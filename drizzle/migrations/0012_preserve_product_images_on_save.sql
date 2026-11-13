CREATE OR REPLACE FUNCTION public.save_product_options(_product jsonb, _variants jsonb, _id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid; v jsonb; vid uuid; keep_photos boolean;
BEGIN
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'editor')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 pid := coalesce(_id,gen_random_uuid());
 IF jsonb_typeof(_variants) <> 'array' OR jsonb_array_length(_variants)>100 THEN RAISE EXCEPTION 'INVALID_VARIANTS'; END IF;
 IF _id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.products WHERE id=pid) THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
 -- An empty gallery never erases saved photos unless the admin explicitly asked to remove them all.
 keep_photos := jsonb_array_length(coalesce(_product->'images','[]'::jsonb))=0 AND NOT coalesce((_product->>'clear_images')::boolean,false);
 INSERT INTO public.products(id,slug,name_sq,name_en,description_sq,description_en,price,cost_price,barcode,sku,stock,images,image_url,category_id,active,featured,specs,discount_active,discount_percent)
 VALUES(pid,_product->>'slug',_product->>'name_sq',_product->>'name_en',_product->>'description_sq',_product->>'description_en',(_product->>'price')::numeric,(_product->>'cost_price')::numeric,_product->>'barcode',_product->>'sku',(_product->>'stock')::integer,ARRAY(SELECT jsonb_array_elements_text(coalesce(_product->'images','[]'::jsonb))),_product->>'image_url',(_product->>'category_id')::uuid,(_product->>'active')::boolean,(_product->>'featured')::boolean,coalesce(_product->'specs','{}'),coalesce((_product->>'discount_active')::boolean,false),coalesce((_product->>'discount_percent')::numeric,0))
 ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name_sq=excluded.name_sq,name_en=excluded.name_en,description_sq=excluded.description_sq,description_en=excluded.description_en,price=excluded.price,cost_price=excluded.cost_price,barcode=excluded.barcode,sku=excluded.sku,stock=excluded.stock,
  images=CASE WHEN keep_photos THEN products.images ELSE excluded.images END,
  image_url=CASE WHEN keep_photos THEN products.image_url ELSE excluded.image_url END,
  category_id=excluded.category_id,active=excluded.active,featured=excluded.featured,specs=excluded.specs,discount_active=excluded.discount_active,discount_percent=excluded.discount_percent;
 UPDATE public.product_variants SET active=false WHERE product_id=pid AND id NOT IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(_variants) x);
 FOR v IN SELECT value FROM jsonb_array_elements(_variants) LOOP
  vid := (v->>'id')::uuid;
  IF length(btrim(v->>'name_sq')) NOT BETWEEN 1 AND 120 OR (v->>'stock')::integer<0 THEN RAISE EXCEPTION 'INVALID_VARIANT'; END IF;
  IF EXISTS(SELECT 1 FROM public.product_variants WHERE id=vid AND product_id<>pid) THEN RAISE EXCEPTION 'VARIANT_INVALID'; END IF;
  INSERT INTO public.product_variants(id,product_id,name_sq,name_en,color_hex,image_url,price,stock,sort_order,active)
  VALUES(vid,pid,btrim(v->>'name_sq'),coalesce(nullif(btrim(v->>'name_en'),''),btrim(v->>'name_sq')),v->>'color_hex',v->>'image_url',(v->>'price')::numeric,(v->>'stock')::integer,(v->>'sort_order')::integer,(v->>'active')::boolean)
  ON CONFLICT(id) DO UPDATE SET name_sq=excluded.name_sq,name_en=excluded.name_en,color_hex=excluded.color_hex,image_url=excluded.image_url,price=excluded.price,stock=excluded.stock,sort_order=excluded.sort_order,active=excluded.active;
 END LOOP;
 RETURN pid;
END; $$;
REVOKE ALL ON FUNCTION public.save_product_options(jsonb,jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_product_options(jsonb,jsonb,uuid) TO authenticated;