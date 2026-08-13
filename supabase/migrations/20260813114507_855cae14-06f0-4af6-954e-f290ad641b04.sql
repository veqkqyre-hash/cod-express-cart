ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_key ON public.products (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);

CREATE SEQUENCE IF NOT EXISTS pos_sale_number_seq;

CREATE TABLE public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text NOT NULL UNIQUE DEFAULT ('POS-' || nextval('pos_sale_number_seq')::text),
  total numeric NOT NULL DEFAULT 0,
  cost_total numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  paid_amount numeric,
  change_amount numeric,
  note text,
  cashier_id uuid,
  cashier_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pos_sales TO authenticated;
GRANT ALL ON public.pos_sales TO service_role;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read pos sales" ON public.pos_sales FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TABLE public.pos_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  barcode text,
  unit_price numeric NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pos_sale_items TO authenticated;
GRANT ALL ON public.pos_sale_items TO service_role;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read pos sale items" ON public.pos_sale_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX IF NOT EXISTS pos_sale_items_sale_idx ON public.pos_sale_items (sale_id);
CREATE INDEX IF NOT EXISTS pos_sales_created_idx ON public.pos_sales (created_at DESC);

CREATE OR REPLACE FUNCTION public.create_pos_sale(
  _items jsonb,
  _payment_method text DEFAULT 'cash',
  _paid_amount numeric DEFAULT NULL,
  _note text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.pos_sales (payment_method, paid_amount, note, cashier_id, cashier_email)
  VALUES (_payment_method, _paid_amount, _note, _uid,
          (SELECT email::text FROM auth.users WHERE id = _uid))
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
$$;