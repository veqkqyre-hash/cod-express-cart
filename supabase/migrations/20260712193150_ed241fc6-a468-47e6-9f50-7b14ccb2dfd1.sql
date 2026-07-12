
CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _count int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT count(*) INTO _count FROM public.user_roles WHERE role = 'admin';
  IF _count > 0 THEN
    RETURN json_build_object('granted', false, 'reason', 'admin_exists');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN json_build_object('granted', true, 'user_id', _uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;
