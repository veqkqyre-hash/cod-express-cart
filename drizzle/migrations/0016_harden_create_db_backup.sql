CREATE OR REPLACE FUNCTION public.create_db_backup(_kind text DEFAULT 'manual'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t text; arr jsonb; payload jsonb := '{}'::jsonb; counts jsonb := '{}'::jsonb;
  manifest jsonb; new_id uuid; txt text; em text; k text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Vetëm administratori mund të krijojë backup.';
  END IF;
  k := CASE WHEN _kind = 'pre_restore' THEN 'pre_restore' ELSE 'manual' END;
  FOREACH t IN ARRAY public.backup_tables() LOOP
    IF t !~ '^[a-z_][a-z0-9_]*$' OR to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE EXCEPTION 'Tabelë e pavlefshme në listën e backup-it.';
    END IF;
    EXECUTE format('SELECT COALESCE(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) FROM public.%I x', t) INTO arr;
    payload := payload || jsonb_build_object(t, arr);
    counts := counts || jsonb_build_object(t, jsonb_array_length(arr));
  END LOOP;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', o.name, 'size', COALESCE((o.metadata->>'size')::bigint, 0)) ORDER BY o.name), '[]'::jsonb)
    INTO manifest FROM storage.objects o WHERE o.bucket_id = 'product-images';
  txt := payload::text;
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.backup_snapshots(created_by, created_by_email, kind, data, size_bytes, sha256, table_counts, photos_manifest, photos_count, photos_bytes, photos_status)
  VALUES (auth.uid(), em, k, payload, octet_length(txt),
          encode(sha256(convert_to(txt, 'UTF8')), 'hex'), counts, manifest, jsonb_array_length(manifest),
          COALESCE((SELECT sum((m->>'size')::bigint) FROM jsonb_array_elements(manifest) m), 0),
          CASE WHEN jsonb_array_length(manifest) = 0 THEN 'verified' ELSE 'pending' END)
  RETURNING id INTO new_id;
  PERFORM public.log_action('backup.create', 'backup', new_id::text, jsonb_build_object('kind', k, 'size', octet_length(txt)));
  RETURN json_build_object('id', new_id, 'size_bytes', octet_length(txt), 'photos', jsonb_array_length(manifest));
END $function$;
REVOKE EXECUTE ON FUNCTION public.create_db_backup(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_db_backup(text) TO authenticated, service_role;