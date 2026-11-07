ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS customer_name text;

CREATE OR REPLACE FUNCTION public.create_pos_sale(_items jsonb, _payment_method text DEFAULT 'cash'::text, _paid_amount numeric DEFAULT NULL::numeric, _note text DEFAULT NULL::text, _discount numeric DEFAULT 0, _customer_name text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _sale public.pos_sales;
  _it jsonb;
  _pid uuid;
  _qty int;
  _prod public.products;
  _total numeric := 0;
  _cost numeric := 0;
  _count int := 0;
  _shift uuid;
  _final numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(_uid, 'admin') OR public.has_role(_uid, 'manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _payment_method NOT IN ('cash','card','other') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Empty sale';
  END IF;
  IF _discount IS NULL OR _discount < 0 THEN
    RAISE EXCEPTION 'Invalid discount';
  END IF;

  SELECT id INTO _shift FROM public.pos_shifts WHERE status = 'open' LIMIT 1;

  INSERT INTO public.pos_sales (payment_method, paid_amount, note, cashier_id, cashier_email, shift_id, discount, customer_name)
  VALUES (_payment_method, _paid_amount, _note, _uid,
          (SELECT email::text FROM auth.users WHERE id = _uid), _shift, _discount, NULLIF(btrim(_customer_name), ''))
  RETURNING * INTO _sale;

  FOR _it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := (_it->>'product_id')::uuid;
    _qty := (_it->>'quantity')::int;
    IF _qty IS NULL OR _qty <= 0 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;

    SELECT * INTO _prod FROM public.products WHERE id = _pid FOR UPDATE;
    IF _prod.id IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;
    IF _prod.stock < _qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', _prod.name_sq;
    END IF;

    UPDATE public.products SET stock = stock - _qty, updated_at = now() WHERE id = _pid;

    INSERT INTO public.pos_sale_items
      (sale_id, product_id, product_name, barcode, unit_price, unit_cost, quantity, subtotal)
    VALUES (_sale.id, _pid, _prod.name_sq, _prod.barcode, _prod.price, _prod.cost_price, _qty, _prod.price * _qty);

    _total := _total + _prod.price * _qty;
    _cost := _cost + _prod.cost_price * _qty;
    _count := _count + _qty;
  END LOOP;

  _final := GREATEST(0, _total - _discount);

  UPDATE public.pos_sales
     SET total = _final, cost_total = _cost, item_count = _count,
         change_amount = CASE WHEN _payment_method = 'cash' AND _paid_amount IS NOT NULL
                              THEN _paid_amount - _final ELSE NULL END
   WHERE id = _sale.id
  RETURNING * INTO _sale;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _sale.cashier_email, 'pos.sale', 'pos_sales', _sale.id::text,
          jsonb_build_object('sale_number', _sale.sale_number, 'total', _final, 'discount', _discount, 'method', _payment_method));

  RETURN row_to_json(_sale);
END;
$function$;