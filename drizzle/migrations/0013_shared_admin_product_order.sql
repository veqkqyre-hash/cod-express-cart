CREATE TABLE public.admin_product_order (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  product_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_product_order TO authenticated;
GRANT ALL ON public.admin_product_order TO service_role;
ALTER TABLE public.admin_product_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read product ordering" ON public.admin_product_order FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.save_admin_product_order(_ids uuid[], _expected_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_ids uuid[]; stored_ids uuid[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Nuk keni leje për renditje.'; END IF;
  PERFORM pg_advisory_xact_lock(73821941);
  LOCK TABLE public.products IN SHARE MODE;
  SELECT product_ids INTO stored_ids FROM public.admin_product_order WHERE singleton;
  SELECT coalesce(array_agg(p.id ORDER BY o.position NULLS LAST, p.created_at DESC, p.id), '{}') INTO current_ids
  FROM public.products p LEFT JOIN unnest(coalesce(stored_ids, '{}')) WITH ORDINALITY o(id, position) ON o.id = p.id;
  IF _ids IS NULL OR cardinality(_ids) <> cardinality(current_ids)
     OR EXISTS (SELECT 1 FROM unnest(_ids) x(id) WHERE id IS NULL)
     OR (SELECT count(DISTINCT id) FROM unnest(_ids) x(id)) <> cardinality(_ids)
     OR NOT (_ids @> current_ids AND current_ids @> _ids) THEN
    RAISE EXCEPTION 'Renditja lejohet vetëm për listën e plotë të produkteve.';
  END IF;
  IF _expected_ids IS DISTINCT FROM current_ids THEN RAISE EXCEPTION 'Lista ka ndryshuar. Rifreskojeni dhe provoni përsëri.'; END IF;
  INSERT INTO public.admin_product_order(singleton, product_ids) VALUES (true, _ids)
  ON CONFLICT (singleton) DO UPDATE SET product_ids = EXCLUDED.product_ids, updated_at = now();
END; $$;
REVOKE ALL ON FUNCTION public.save_admin_product_order(uuid[], uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_admin_product_order(uuid[], uuid[]) TO authenticated, service_role;
COMMENT ON TABLE public.admin_product_order IS 'Admin-only shared Products/Inventory ordering; never updates product data or public shop ordering.';