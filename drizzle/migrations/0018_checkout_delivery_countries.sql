-- IMPORTANT: Apply in Supabase SQL Editor BEFORE publishing the new cPanel checkout.
-- Order shipping must be calculated in the database, never trusted from the browser.
-- The prices here mirror src/lib/country-shipping.ts:
-- Kosovo: 2 EUR below 50 EUR, otherwise free; Albania/Macedonia: 5 EUR at any amount.
-- The checkout function is based on 0011_product_discounts.sql and retains
-- transaction, stock locks, discounted product price and coupon verification.
-- Existing guest/older clients default to Kosovo; no products/orders are deleted.

CREATE OR REPLACE FUNCTION public.shipping_fee_by_country(_country text, _subtotal numeric)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE selected_country text := upper(btrim(coalesce(_country, '')));
BEGIN
 IF selected_country NOT IN ('XK','AL','MK') THEN RAISE EXCEPTION 'INVALID_COUNTRY'; END IF;
 IF _subtotal IS NULL OR _subtotal < 0 THEN RAISE EXCEPTION 'INVALID_SUBTOTAL'; END IF;
 IF selected_country = 'XK' THEN
   RETURN CASE WHEN _subtotal >= 50 THEN 0 ELSE 2 END;
 END IF;
 RETURN 5;
END; $$;
REVOKE ALL ON FUNCTION public.shipping_fee_by_country(text,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.shipping_fee_by_country(text,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.checkout_product_options(_customer jsonb, _items jsonb, _coupon text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); it jsonb; p public.products%ROWTYPE; v public.product_variants%ROWTYPE; cp public.coupons%ROWTYPE; oid uuid; num text; amount numeric:=0; shipping numeric:=0; discount numeric:=0; q integer; price numeric; country text; vid uuid;
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
 -- Shipping is determined by country, not a fuzzy match on city / active zones.
 country:=upper(btrim(coalesce(nullif(_customer->>'country',''),'XK')));
 shipping:=public.shipping_fee_by_country(country, amount);
 IF nullif(btrim(_coupon),'') IS NOT NULL THEN
  SELECT * INTO cp FROM public.coupons WHERE upper(code)=upper(btrim(_coupon)) AND active AND (expires_at IS NULL OR expires_at>=now()) AND min_order<=amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'COUPON_INVALID'; END IF;
  discount:=least(amount,greatest(0,CASE WHEN cp.discount_type='percent' THEN amount*cp.discount_value/100 ELSE cp.discount_value END));
 END IF;
 INSERT INTO public.orders(user_id,customer_name,phone,email,city,address,postal_code,notes,subtotal,shipping_fee,total,payment_method)
 VALUES(uid,btrim(_customer->>'customer_name'),btrim(_customer->>'phone'),nullif(_customer->>'email',''),btrim(_customer->>'city'),btrim(_customer->>'address'),nullif(_customer->>'postal_code',''),concat_ws(' | ',nullif(_customer->>'notes',''),'Shteti: '||(CASE country WHEN 'XK' THEN 'Kosovë' WHEN 'AL' THEN 'Shqipëri' WHEN 'MK' THEN 'Maqedoni e Veriut' END),CASE WHEN discount>0 THEN 'Kupon: '||cp.code||' (-'||discount||' EUR)' END),amount,shipping,amount-discount+shipping,'cod') RETURNING id,order_number INTO oid,num;
 FOR it IN SELECT value FROM jsonb_array_elements(_items) LOOP
  SELECT * INTO p FROM public.products WHERE id=(it->>'product_id')::uuid;
  vid:=nullif(it->>'variant_id','')::uuid;
  SELECT * INTO v FROM public.product_variants WHERE id=vid;
  INSERT INTO public.order_items(order_id,product_id,product_name,unit_price,quantity,subtotal,variant_id,variant_name)
  VALUES(oid,p.id,p.name_sq||CASE WHEN vid IS NOT NULL THEN ' — '||v.name_sq ELSE '' END,(it->>'unit_price')::numeric,(it->>'quantity')::integer,(it->>'unit_price')::numeric*(it->>'quantity')::integer,vid,CASE WHEN vid IS NOT NULL THEN v.name_sq END);
 END LOOP;
 RETURN jsonb_build_object('id',oid,'order_number',num,'country',country,'shipping_fee',shipping);
END; $$;
REVOKE ALL ON FUNCTION public.checkout_product_options(jsonb,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.checkout_product_options(jsonb,jsonb,text) TO authenticated;
