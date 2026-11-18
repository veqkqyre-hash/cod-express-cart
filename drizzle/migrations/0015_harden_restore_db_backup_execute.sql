-- Harden restore_db_backup: only signed-in users may attempt it (admin role is still
-- enforced inside the function), never anonymous callers.
REVOKE EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_db_backup(uuid, text) TO service_role;