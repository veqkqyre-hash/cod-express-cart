CREATE TABLE public.backup_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_email text,
  kind text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'created',
  data jsonb NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  sha256 text NOT NULL,
  table_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  photos_manifest jsonb NOT NULL DEFAULT '[]'::jsonb,
  photos_count integer NOT NULL DEFAULT 0,
  photos_bytes bigint NOT NULL DEFAULT 0,
  photos_status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  restored_at timestamptz,
  restored_by_email text,
  error text
);
GRANT SELECT ON public.backup_snapshots TO authenticated;
GRANT ALL ON public.backup_snapshots TO service_role;
ALTER TABLE public.backup_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read backup snapshots" ON public.backup_snapshots FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.backup_tables()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['categories','products','orders','order_items','notifications','pos_shifts','pos_sales','pos_sale_items','pos_refunds','pos_refund_items','product_reviews','stock_alerts','stock_refills','coupons','shipping_rates','site_settings','homepage_slides','blog_posts','messages','newsletter_subscribers','admin_tasks','visitor_logs','user_roles','audit_logs']
$$;

CREATE OR REPLACE FUNCTION public.create_db_backup(_kind text DEFAULT 'manual')
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t text; arr jsonb; payload jsonb := '{}'::jsonb; counts jsonb := '{}'::jsonb;
  manifest jsonb; new_id uuid; txt text; em text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Vetëm administratori mund të krijojë backup.'; END IF;
  FOREACH t IN ARRAY public.backup_tables() LOOP
    EXECUTE format('SELECT COALESCE(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) FROM public.%I x', t) INTO arr;
    payload := payload || jsonb_build_object(t, arr);
    counts := counts || jsonb_build_object(t, jsonb_array_length(arr));
  END LOOP;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', o.name, 'size', COALESCE((o.metadata->>'size')::bigint, 0)) ORDER BY o.name), '[]'::jsonb)
    INTO manifest FROM storage.objects o WHERE o.bucket_id = 'product-images';
  txt := payload::text;
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.backup_snapshots(created_by, created_by_email, kind, data, size_bytes, sha256, table_counts, photos_manifest, photos_count, photos_bytes, photos_status)
  VALUES (auth.uid(), em, CASE WHEN _kind = 'pre_restore' THEN 'pre_restore' ELSE 'manual' END, payload, octet_length(txt),
          encode(sha256(convert_to(txt, 'UTF8')), 'hex'), counts, manifest, jsonb_array_length(manifest),
          COALESCE((SELECT sum((m->>'size')::bigint) FROM jsonb_array_elements(manifest) m), 0),
          CASE WHEN jsonb_array_length(manifest) = 0 THEN 'verified' ELSE 'pending' END)
  RETURNING id INTO new_id;
  PERFORM public.log_action('backup.create', 'backup', new_id::text, jsonb_build_object('kind', _kind, 'size', octet_length(txt)));
  RETURN json_build_object('id', new_id, 'size_bytes', octet_length(txt), 'photos', jsonb_array_length(manifest));
END $$;
REVOKE ALL ON FUNCTION public.create_db_backup(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_db_backup(text) TO authenticated;

-- Server-side verification: recompute the checksum, check every table is present,
-- and check every photo in the manifest exists in the private backups bucket.
CREATE OR REPLACE FUNCTION public.verify_db_backup(_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.backup_snapshots; ok_hash boolean; missing_tables int; missing_photos int; st text; pst text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Vetëm administratori.'; END IF;
  SELECT * INTO s FROM public.backup_snapshots WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Backup-i nuk u gjet.'; END IF;
  ok_hash := encode(sha256(convert_to(s.data::text, 'UTF8')), 'hex') = s.sha256;
  SELECT count(*) INTO missing_tables FROM unnest(public.backup_tables()) t WHERE NOT (s.data ? t);
  SELECT count(*) INTO missing_photos FROM jsonb_array_elements(s.photos_manifest) m
   WHERE NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'backups' AND o.name = _id::text || '/photos/' || (m->>'name'));
  pst := CASE WHEN missing_photos = 0 THEN 'verified' ELSE 'incomplete' END;
  st := CASE WHEN ok_hash AND missing_tables = 0 AND missing_photos = 0 THEN 'verified' ELSE 'failed' END;
  UPDATE public.backup_snapshots SET status = st, photos_status = pst,
    verified_at = CASE WHEN st = 'verified' THEN now() ELSE verified_at END,
    error = CASE WHEN st = 'verified' THEN NULL ELSE format('checksum=%s, tabela që mungojnë=%s, foto që mungojnë=%s', ok_hash, missing_tables, missing_photos) END
  WHERE id = _id;
  RETURN json_build_object('status', st, 'checksum_ok', ok_hash, 'missing_tables', missing_tables, 'missing_photos', missing_photos);
END $$;
REVOKE ALL ON FUNCTION public.verify_db_backup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_db_backup(uuid) TO authenticated;

-- Non-destructive restore: rows from the backup are inserted or updated back to their saved values.
-- Nothing is deleted. Roles, accounts and the audit log are never changed. Triggers are paused so
-- restored order lines do not decrement stock again or send notifications. A pre-restore backup is
-- created first. Runs in one transaction: any error rolls everything back.
CREATE OR REPLACE FUNCTION public.restore_db_backup(_id uuid, _confirm text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.backup_snapshots; t text; cols text; upd text; pk text; n int; counts jsonb := '{}'::jsonb; safety json; em text;
  restore_tables text[] := ARRAY['categories','products','orders','order_items','notifications','pos_shifts','pos_sales','pos_sale_items','pos_refunds','pos_refund_items','product_reviews','stock_alerts','stock_refills','coupons','shipping_rates','site_settings','homepage_slides','blog_posts','messages','newsletter_subscribers','admin_tasks','visitor_logs'];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Vetëm administratori mund të rikthejë backup.'; END IF;
  IF _confirm IS DISTINCT FROM 'RIKTHE' THEN RAISE EXCEPTION 'Konfirmimi mungon. Shkruani RIKTHE.'; END IF;
  SELECT * INTO s FROM public.backup_snapshots WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Backup-i nuk u gjet.'; END IF;
  IF s.status <> 'verified' OR encode(sha256(convert_to(s.data::text, 'UTF8')), 'hex') <> s.sha256 THEN
    RAISE EXCEPTION 'Backup-i nuk është i verifikuar. Rikthimi u ndal.';
  END IF;
  safety := public.create_db_backup('pre_restore');
  FOREACH t IN ARRAY restore_tables LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum) INTO cols
      FROM pg_attribute a WHERE a.attrelid = ('public.' || t)::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '';
    SELECT string_agg(quote_ident(a.attname), ', ') INTO pk
      FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ('public.' || t)::regclass AND i.indisprimary;
    SELECT string_agg(format('%1$s = EXCLUDED.%1$s', quote_ident(a.attname)), ', ') INTO upd
      FROM pg_attribute a WHERE a.attrelid = ('public.' || t)::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
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
END $$;
REVOKE ALL ON FUNCTION public.restore_db_backup(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) TO authenticated;

CREATE POLICY "Admins read backup files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add backup files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'));