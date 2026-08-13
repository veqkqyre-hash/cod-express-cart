CREATE TABLE public.pos_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by uuid REFERENCES auth.users(id),
  opened_email text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  opening_cash numeric NOT NULL DEFAULT 0,
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id),
  closed_email text,
  counted_cash numeric,
  expected_cash numeric,
  difference numeric,
  cash_sales numeric NOT NULL DEFAULT 0,
  card_sales numeric NOT NULL DEFAULT 0,
  other_sales numeric NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pos_shifts TO authenticated;
GRANT ALL ON public.pos_shifts TO service_role;

ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read pos shifts" ON public.pos_shifts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER set_pos_shifts_updated BEFORE UPDATE ON public.pos_shifts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE UNIQUE INDEX pos_shifts_one_open ON public.pos_shifts (status) WHERE status = 'open';

ALTER TABLE public.pos_sales ADD COLUMN shift_id uuid REFERENCES public.pos_shifts(id);

CREATE OR REPLACE FUNCTION public.open_pos_shift(_opening_cash numeric DEFAULT 0, _note text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _s public.pos_shifts;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO _s FROM public.pos_shifts WHERE status = 'open' LIMIT 1;
  IF _s.id IS NOT NULL THEN RETURN row_to_json(_s); END IF;
  INSERT INTO public.pos_shifts (opened_by, opened_email, opening_cash, note)
  VALUES (_uid, (SELECT email::text FROM auth.users WHERE id = _uid), COALESCE(_opening_cash,0), _note)
  RETURNING * INTO _s;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _s.opened_email, 'pos.shift_opened', 'pos_shifts', _s.id::text,
          jsonb_build_object('opening_cash', _s.opening_cash));
  RETURN row_to_json(_s);
END; $$;

CREATE OR REPLACE FUNCTION public.current_pos_shift()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _s public.pos_shifts;
  _cash numeric := 0; _card numeric := 0; _other numeric := 0; _cnt int := 0;
BEGIN
  IF _uid IS NULL OR NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO _s FROM public.pos_shifts WHERE status = 'open' LIMIT 1;
  IF _s.id IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(SUM(CASE WHEN payment_method='cash' THEN total ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN payment_method='card' THEN total ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN payment_method NOT IN ('cash','card') THEN total ELSE 0 END),0),
         COUNT(*)
    INTO _cash, _card, _other, _cnt
  FROM public.pos_sales WHERE shift_id = _s.id;
  RETURN json_build_object('shift', row_to_json(_s), 'cash_sales', _cash, 'card_sales', _card,
    'other_sales', _other, 'sales_count', _cnt, 'expected_cash', _s.opening_cash + _cash);
END; $$;

CREATE OR REPLACE FUNCTION public.close_pos_shift(_counted_cash numeric DEFAULT NULL, _note text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _s public.pos_shifts;
  _cash numeric := 0; _card numeric := 0; _other numeric := 0; _cnt int := 0; _exp numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO _s FROM public.pos_shifts WHERE status = 'open' FOR UPDATE;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'No open shift'; END IF;
  SELECT COALESCE(SUM(CASE WHEN payment_method='cash' THEN total ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN payment_method='card' THEN total ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN payment_method NOT IN ('cash','card') THEN total ELSE 0 END),0),
         COUNT(*)
    INTO _cash, _card, _other, _cnt
  FROM public.pos_sales WHERE shift_id = _s.id;
  _exp := _s.opening_cash + _cash;
  UPDATE public.pos_shifts SET
    status = 'closed', closed_at = now(), closed_by = _uid,
    closed_email = (SELECT email::text FROM auth.users WHERE id = _uid),
    counted_cash = _counted_cash, expected_cash = _exp,
    difference = CASE WHEN _counted_cash IS NULL THEN NULL ELSE _counted_cash - _exp END,
    cash_sales = _cash, card_sales = _card, other_sales = _other, sales_count = _cnt,
    note = COALESCE(_note, note)
  WHERE id = _s.id RETURNING * INTO _s;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _s.closed_email, 'pos.shift_closed', 'pos_shifts', _s.id::text,
          jsonb_build_object('expected_cash', _s.expected_cash, 'counted_cash', _s.counted_cash, 'difference', _s.difference));
  RETURN row_to_json(_s);
END; $$;

CREATE OR REPLACE FUNCTION public.create_pos_sale(_items jsonb, _payment_method text DEFAULT 'cash'::text, _paid_amount numeric DEFAULT NULL::numeric, _note text DEFAULT NULL::text)
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

  SELECT id INTO _shift FROM public.pos_shifts WHERE status = 'open' LIMIT 1;

  INSERT INTO public.pos_sales (payment_method, paid_amount, note, cashier_id, cashier_email, shift_id)
  VALUES (_payment_method, _paid_amount, _note, _uid,
          (SELECT email::text FROM auth.users WHERE id = _uid), _shift)
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

  UPDATE public.pos_sales
     SET total = _total, cost_total = _cost, item_count = _count,
         change_amount = CASE WHEN _payment_method = 'cash' AND _paid_amount IS NOT NULL
                              THEN _paid_amount - _total ELSE NULL END
   WHERE id = _sale.id
  RETURNING * INTO _sale;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _sale.cashier_email, 'pos.sale', 'pos_sales', _sale.id::text,
          jsonb_build_object('sale_number', _sale.sale_number, 'total', _total, 'method', _payment_method));

  RETURN row_to_json(_sale);
END;
$function$;