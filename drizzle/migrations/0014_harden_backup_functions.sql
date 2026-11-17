REVOKE EXECUTE ON FUNCTION public.create_db_backup(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_db_backup(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) TO authenticated, service_role;