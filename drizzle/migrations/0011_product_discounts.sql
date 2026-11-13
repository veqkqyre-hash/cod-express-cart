ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_active boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD CONSTRAINT products_discount_percent_range CHECK (discount_percent >= 0 AND discount_percent <= 100);
CREATE OR REPLACE FUNCTION public.discounted_price(_base numeric, _active boolean, _pct numeric) RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE WHEN _active AND _pct > 0 THEN round(_base * (100 - least(_pct,100)) / 100, 2) ELSE _base END $$;
GRANT EXECUTE ON FUNCTION public.discounted_price(numeric,boolean,numeric) TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.save_product_options(_product jsonb, _variants jsonb, _id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid; v jsonb; vid uuid;
BEGIN
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'editor')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 pid := coalesce(_id,gen_random_uuid());
 IF jsonb_typeof(_variants) <> 'array' OR jsonb_array_length(_variants)>100 THEN RAISE EXCEPTION 'INVALID_VARIANTS'; END IF;
 IF _id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.products WHERE id=pid) THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
 INSERT INTO public.products(id,slug,name_sq,name_en,description_sq,description_en,price,cost_price,barcode,sku,stock,images,image_url,category_id,active,featured,specs,discount_active,discount_percent)
 VALUES(pid,_product->>'slug',_product->>'name_sq',_product->>'name_en',_product->>'description_sq',_product->>'description_en',(_product->>'price')::numeric,(_product->>'cost_price')::numeric,_product->>'barcode',_product->>'sku',(_product->>'stock')::integer,ARRAY(SELECT jsonb_array_elements_text(_product->'images')),_product->>'image_url',(_product->>'category_id')::uuid,(_product->>'active')::boolean,(_product->>'featured')::boolean,coalesce(_product->'specs','{}'),coalesce((_product->>'discount_active')::boolean,false),coalesce((_product->>'discount_percent')::numeric,0))
 ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name_sq=excluded.name_sq,name_en=excluded.name_en,description_sq=excluded.description_sq,description_en=excluded.description_en,price=excluded.price,cost_price=excluded.cost_price,barcode=excluded.barcode,sku=excluded.sku,stock=excluded.stock,images=excluded.images,image_url=excluded.image_url,category_id=excluded.category_id,active=excluded.active,featured=excluded.featured,specs=excluded.specs,discount_active=excluded.discount_active,discount_percent=excluded.discount_percent;
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

CREATE OR REPLACE FUNCTION public.checkout_product_options(_customer jsonb, _items jsonb, _coupon text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); it jsonb; p public.products%ROWTYPE; v public.product_variants%ROWTYPE; rate public.shipping_rates%ROWTYPE; cp public.coupons%ROWTYPE; oid uuid; num text; amount numeric:=0; shipping numeric:=0; discount numeric:=0; q integer; price numeric; city text; vid uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
 IF jsonb_typeof(_items)<>'array' OR jsonb_array_length(_items) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_ITEMS'; END IF;
 IF length(btrim(_customer->>'customer_name')) NOT BETWEEN 2 AND 100 OR length(btrim(_customer->>'phone')) NOT BETWEEN 6 AND 30 OR length(btrim(_customer->>'city')) NOT BETWEEN 2 AND 100 OR length(btrim(_customer->>'address')) NOT BETWEEN 3 AND 300 THEN RAISE EXCEPTION 'INVALID_CUSTOMER'; END IF;
 PERFORM 1 FROM public.products WHERE id IN (SELECT (x->>'product_id')::uuid FROM jsonb_array_elements(_items) x) ORDER BY id FOR UPDATE;
 PERFORM 1 FROM public.product_variants WHERE product_id IN (SELECT (x->>'product_id')::uuid FROM jsonb_array_elements(_items) x) ORDER BY id FOR UPDATE;
 FOR it IN SELECT value FROM jsonb_array_elements(_items) LOOP
  q:=(it->>'quantity')::integer; IF q NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
  SELECT * INTO p FROM public.products WHERE id=(it->>'product_id')::uuid;
  IF NOT FOUND OR NOT p.active THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
  vid:=nullif(it->>'variant_id','')::uuid; price:=public.discounted_price(p.price,p.discount_active,p.discount_percent);
  IF vid IS NULL AND EXISTS(SELECT 1 FROM public.product_variants WHERE product_id=p.id AND active) THEN RAISE EXCEPTION 'VARIANT_REQUIRED'; END IF;
  IF vid IS NOT NULL THEN
   SELECT * INTO v FROM public.product_variants WHERE id=vid AND product_id=p.id AND active;
   IF NOT FOUND THEN RAISE EXCEPTION 'VARIANT_INVALID'; END IF;
   IF v.stock<q THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
   price:=public.discounted_price(coalesce(v.price,p.price),p.discount_active,p.discount_percent);
  ELSIF p.stock<q THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
  IF (it->>'unit_price')::numeric IS DISTINCT FROM price THEN RAISE EXCEPTION 'PRICE_MISMATCH'; END IF;
  amount:=amount+price*q;
 END LOOP;
 city:=lower(btrim(_customer->>'city'));
 SELECT * INTO rate FROM public.shipping_rates WHERE active ORDER BY CASE WHEN lower(zone)=city THEN 0 WHEN position(lower(zone) in city)>0 OR position(city in lower(zone))>0 THEN 1 ELSE 2 END,fee,id LIMIT 1;
 IF FOUND THEN shipping:=CASE WHEN amount>=coalesce(rate.free_over,50) THEN 0 ELSE rate.fee END; END IF;
 IF nullif(btrim(_coupon),'') IS NOT NULL THEN
  SELECT * INTO cp FROM public.coupons WHERE upper(code)=upper(btrim(_coupon)) AND active AND (expires_at IS NULL OR expires_at>=now()) AND min_order<=amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'COUPON_INVALID'; END IF;
  discount:=least(amount,greatest(0,CASE WHEN cp.discount_type='percent' THEN amount*cp.discount_value/100 ELSE cp.discount_value END));
 END IF;
 INSERT INTO public.orders(user_id,customer_name,phone,email,city,address,postal_code,notes,subtotal,shipping_fee,total,payment_method)
 VALUES(uid,btrim(_customer->>'customer_name'),btrim(_customer->>'phone'),nullif(_customer->>'email',''),btrim(_customer->>'city'),btrim(_customer->>'address'),nullif(_customer->>'postal_code',''),concat_ws(' | ',nullif(_customer->>'notes',''),CASE WHEN discount>0 THEN 'Kupon: '||cp.code||' (-'||discount||' EUR)' END),amount,shipping,amount-discount+shipping,'cod') RETURNING id,order_number INTO oid,num;
 FOR it IN SELECT value FROM jsonb_array_elements(_items) LOOP
  SELECT * INTO p FROM public.products WHERE id=(it->>'product_id')::uuid;
  vid:=nullif(it->>'variant_id','')::uuid;
  SELECT * INTO v FROM public.product_variants WHERE id=vid;
  INSERT INTO public.order_items(order_id,product_id,product_name,unit_price,quantity,subtotal,variant_id,variant_name)
  VALUES(oid,p.id,p.name_sq||CASE WHEN vid IS NOT NULL THEN ' — '||v.name_sq ELSE '' END,(it->>'unit_price')::numeric,(it->>'quantity')::integer,(it->>'unit_price')::numeric*(it->>'quantity')::integer,vid,CASE WHEN vid IS NOT NULL THEN v.name_sq END);
 END LOOP;
 RETURN jsonb_build_object('id',oid,'order_number',num);
END; $$;
REVOKE ALL ON FUNCTION public.checkout_product_options(jsonb,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.checkout_product_options(jsonb,jsonb,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.tg_order_item_validate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p record; v record;
BEGIN
 IF NEW.product_id IS NULL THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
 IF NEW.quantity NOT BETWEEN 1 AND 1000 OR NEW.subtotal<>NEW.unit_price*NEW.quantity THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
 SELECT * INTO p FROM public.products WHERE id=NEW.product_id FOR UPDATE;
 IF NOT FOUND OR NOT p.active THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
 IF NEW.variant_id IS NULL AND EXISTS(SELECT 1 FROM public.product_variants WHERE product_id=p.id AND active) THEN RAISE EXCEPTION 'VARIANT_REQUIRED'; END IF;
 IF NEW.variant_id IS NOT NULL THEN
  SELECT * INTO v FROM public.product_variants WHERE id=NEW.variant_id FOR UPDATE;
  IF NOT FOUND OR v.product_id<>p.id OR NOT v.active THEN RAISE EXCEPTION 'VARIANT_INVALID'; END IF;
  IF NEW.unit_price<>public.discounted_price(coalesce(v.price,p.price),p.discount_active,p.discount_percent) THEN RAISE EXCEPTION 'PRICE_MISMATCH'; END IF;
  IF v.stock<NEW.quantity THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
  NEW.variant_name:=v.name_sq;
 ELSE
  IF NEW.unit_price<>public.discounted_price(p.price,p.discount_active,p.discount_percent) THEN RAISE EXCEPTION 'PRICE_MISMATCH'; END IF;
  IF p.stock<NEW.quantity THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
 END IF;
 RETURN NEW;
END; $$;