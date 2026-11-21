-- DREAMÈ: staff approval is managed in the WEBSITE admin panel, never in Lovable.
-- APPLY IN LOVABLE CLOUD -> Database -> SQL Editor before publishing the new frontend.
-- No changes to existing admin accounts or auth settings. No deletion of orders/users.
--
-- The admin can approve any email in advance. The role is only granted:
-- (a) immediately, if the target account already has verified email, or
-- (b) after that same verified user signs in to their DREAMÈ account.
-- This does NOT bypass authentication email verification or send emails.
BEGIN;

CREATE TABLE IF NOT EXISTS public.staff_invites (
  email text PRIMARY KEY,
  role public.app_role NOT NULL,
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.staff_invites FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invite_staff_by_email(_email text, _role public.app_role)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(_email, '')));
  v_uid uuid;
  v_confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(v_email) > 254 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _role IS NULL OR _role::text NOT IN ('admin','manager','editor') THEN
    RAISE EXCEPTION 'Invalid staff role';
  END IF;

  SELECT u.id, u.email_confirmed_at INTO v_uid, v_confirmed
  FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;

  IF v_uid IS NOT NULL AND v_confirmed IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, _role)
      ON CONFLICT (user_id, role) DO NOTHING;
    DELETE FROM public.staff_invites WHERE email = v_email;
    INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details)
      VALUES(auth.uid(), 'role.granted', 'user_roles', v_uid::text,
             jsonb_build_object('email',v_email,'role',_role,'via','admin_website'));
    RETURN jsonb_build_object('status','active','email',v_email,'role',_role::text);
  END IF;

  INSERT INTO public.staff_invites (email, role, invited_by, created_at)
    VALUES (v_email, _role, auth.uid(), now())
    ON CONFLICT (email) DO UPDATE
      SET role=EXCLUDED.role, invited_by=EXCLUDED.invited_by, created_at=now();
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details)
    VALUES(auth.uid(), 'role.pending', 'staff_invites', v_email,
           jsonb_build_object('role',_role));
  RETURN jsonb_build_object('status','pending','email',v_email,'role',_role::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_staff_invites()
RETURNS TABLE(email text, role public.app_role, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT s.email,s.role,s.created_at
    FROM public.staff_invites s ORDER BY s.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_staff_invite(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_email text := lower(btrim(coalesce(_email,'')));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.staff_invites WHERE email = v_email;
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id)
    VALUES(auth.uid(), 'role.invite_cancelled', 'staff_invites', v_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_staff_invite()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
  v_role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  -- The signed-in user's email MUST be verified; the owner, not Lovable,
  -- confirms it by the signup link or a verified OAuth provider.
  SELECT lower(u.email) INTO v_email
    FROM auth.users u
    WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RETURN NULL; END IF;

  SELECT s.role INTO v_role FROM public.staff_invites s
    WHERE s.email = v_email FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  INSERT INTO public.user_roles(user_id, role) VALUES(auth.uid(), v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  DELETE FROM public.staff_invites WHERE email = v_email;
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details)
    VALUES(auth.uid(), 'role.invite_accepted', 'user_roles', auth.uid()::text,
           jsonb_build_object('email',v_email,'role',v_role));
  RETURN v_role::text;
END;
$$;

REVOKE ALL ON FUNCTION public.invite_staff_by_email(text,public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_staff_invites() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_staff_invite(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_staff_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_staff_by_email(text,public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_staff_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_staff_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_staff_invite() TO authenticated;

COMMIT;
