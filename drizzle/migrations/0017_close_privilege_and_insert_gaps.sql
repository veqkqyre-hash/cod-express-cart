CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN RETURN json_build_object('granted', false, 'reason', 'disabled'); END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.grant_role_by_email(_email text, _role app_role)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(btrim(_email)) AND email_confirmed_at IS NOT NULL LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No confirmed account with that email. The user must sign up and confirm their email first.'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role) ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (auth.uid(), (SELECT email::text FROM auth.users WHERE id = auth.uid()), 'role.granted', 'user_roles', _uid::text,
          jsonb_build_object('email', _email, 'role', _role));
  RETURN json_build_object('user_id', _uid, 'email', _email, 'role', _role);
END; $function$;

CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(btrim(_email)) AND email_confirmed_at IS NOT NULL LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No confirmed account with that email. The user must sign up and confirm their email first.'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN json_build_object('user_id', _uid, 'email', _email);
END; $function$;

ALTER POLICY "Authenticated users create own orders" ON public.orders WITH CHECK (false);

ALTER POLICY "Users write own reviews" ON public.product_reviews WITH CHECK (auth.uid() = user_id AND approved = false);

CREATE OR REPLACE FUNCTION public.restore_db_backup(_id uuid, _confirm text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  s public.backup_snapshots; t text; cols text; upd text; pk text; n int; counts jsonb := '{}'::jsonb; safety json; em text;
  restore_tables constant text[] := ARRAY['categories','products','orders','order_items','notifications','pos_shifts','pos_sales','pos_sale_items','pos_refunds','pos_refund_items','product_reviews','stock_alerts','stock_refills','coupons','shipping_rates','site_settings','homepage_slides','blog_posts','messages','newsletter_subscribers','admin_tasks','visitor_logs'];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Vetëm administratori mund të rikthejë backup.'; END IF;
  IF _confirm IS DISTINCT FROM 'RIKTHE' THEN RAISE EXCEPTION 'Konfirmimi mungon. Shkruani RIKTHE.'; END IF;
  SELECT * INTO s FROM public.backup_snapshots WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Backup-i nuk u gjet.'; END IF;
  IF s.status <> 'verified' OR encode(sha256(convert_to(s.data::text, 'UTF8')), 'hex') <> s.sha256 THEN
    RAISE EXCEPTION 'Backup-i nuk është i verifikuar. Rikthimi u ndal.';
  END IF;
  safety := public.create_db_backup('pre_restore');
  FOREACH t IN ARRAY restore_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN RAISE EXCEPTION 'Tabelë e pavlefshme.'; END IF;
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum) INTO cols
      FROM pg_attribute a WHERE a.attrelid = to_regclass(format('public.%I', t)) AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '';
    SELECT string_agg(quote_ident(a.attname), ', ') INTO pk
      FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = to_regclass(format('public.%I', t)) AND i.indisprimary;
    SELECT string_agg(format('%1$s = EXCLUDED.%1$s', quote_ident(a.attname)), ', ') INTO upd
      FROM pg_attribute a WHERE a.attrelid = to_regclass(format('public.%I', t)) AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
      AND quote_ident(a.attname) <> ALL (string_to_array(pk, ', '));
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', t);
    EXECUTE format('INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM jsonb_populate_recordset(NULL::public.%1$I, $1) ON CONFLICT (%3$s) DO UPDATE SET %4$s',
                   t, cols, pk, upd) USING COALESCE(s.data->t, '[]'::jsonb);
    GET DIAGNOSTICS n = ROW_COUNT;
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);
    counts := counts || jsonb_build_object(t, n);
  END LOOP;
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  UPDATE public.backup_snapshots SET restored_at = now(), restored_by_email = em WHERE id = _id;
  PERFORM public.log_action('backup.restore', 'backup', _id::text, jsonb_build_object('rows', counts, 'pre_restore_backup', safety->>'id'));
  RETURN json_build_object('rows', counts, 'pre_restore_backup', safety->>'id');
END $function$;
REVOKE EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) FROM PUBLIC, anon;