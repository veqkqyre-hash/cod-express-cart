-- 1. PRODUCT REVIEWS
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  title text,
  body text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_reviews_product_idx ON public.product_reviews(product_id);
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved reviews" ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (approved = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own reviews" ON public.product_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users write own reviews" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.product_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_validate_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Vlerësimi duhet të jetë 1-5';
  END IF;
  NEW.author_name := btrim(NEW.author_name);
  IF NEW.author_name = '' THEN RAISE EXCEPTION 'Emri është i detyrueshëm'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER validate_review BEFORE INSERT OR UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_validate_review();

-- 2. NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  lang text NOT NULL DEFAULT 'sq',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX newsletter_email_uidx ON public.newsletter_subscribers(lower(email));
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update subscribers" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete subscribers" ON public.newsletter_subscribers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. BACK IN STOCK ALERTS
CREATE TABLE public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text,
  email text NOT NULL,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.stock_alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_alerts TO authenticated;
GRANT ALL ON public.stock_alerts TO service_role;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request stock alert" ON public.stock_alerts
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read stock alerts" ON public.stock_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff update stock alerts" ON public.stock_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins delete stock alerts" ON public.stock_alerts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. POS REFUNDS
CREATE SEQUENCE IF NOT EXISTS public.pos_refund_number_seq START 1;
CREATE TABLE public.pos_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number text NOT NULL DEFAULT ('RET-' || nextval('public.pos_refund_number_seq')::text),
  sale_id uuid REFERENCES public.pos_sales(id) ON DELETE SET NULL,
  sale_number text,
  total numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  reason text,
  cashier_id uuid,
  cashier_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.pos_refund_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES public.pos_refunds(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pos_refunds TO authenticated;
GRANT SELECT ON public.pos_refund_items TO authenticated;
GRANT ALL ON public.pos_refunds TO service_role;
GRANT ALL ON public.pos_refund_items TO service_role;
ALTER TABLE public.pos_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_refund_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read refunds" ON public.pos_refunds
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff read refund items" ON public.pos_refund_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE OR REPLACE FUNCTION public.refund_pos_sale(_sale_id uuid, _items jsonb DEFAULT NULL, _reason text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _sale public.pos_sales;
  _ref public.pos_refunds;
  _it jsonb;
  _pid uuid;
  _qty int;
  _si public.pos_sale_items;
  _total numeric := 0;
  _count int := 0;
  _already int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT email::text INTO _email FROM auth.users WHERE id = _uid;
  SELECT * INTO _sale FROM public.pos_sales WHERE id = _sale_id;
  IF _sale.id IS NULL THEN RAISE EXCEPTION 'Shitja nuk u gjet'; END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    _items := (SELECT COALESCE(jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', quantity)), '[]'::jsonb)
               FROM public.pos_sale_items WHERE sale_id = _sale_id);
  END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Asnjë artikull për kthim'; END IF;

  INSERT INTO public.pos_refunds (sale_id, sale_number, reason, cashier_id, cashier_email)
  VALUES (_sale_id, _sale.sale_number, _reason, _uid, _email)
  RETURNING * INTO _ref;

  FOR _it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := (_it->>'product_id')::uuid;
    _qty := (_it->>'quantity')::int;
    IF _qty IS NULL OR _qty <= 0 THEN RAISE EXCEPTION 'Sasi e pavlefshme'; END IF;

    SELECT * INTO _si FROM public.pos_sale_items
      WHERE sale_id = _sale_id AND product_id IS NOT DISTINCT FROM _pid LIMIT 1;
    IF _si.id IS NULL THEN RAISE EXCEPTION 'Artikulli nuk i takon kësaj shitje'; END IF;

    SELECT COALESCE(SUM(ri.quantity),0) INTO _already
      FROM public.pos_refund_items ri
      JOIN public.pos_refunds r ON r.id = ri.refund_id
     WHERE r.sale_id = _sale_id AND ri.product_id IS NOT DISTINCT FROM _pid;
    IF _already + _qty > _si.quantity THEN
      RAISE EXCEPTION 'Sasia e kthimit tejkalon sasinë e shitur për %', _si.product_name;
    END IF;

    IF _pid IS NOT NULL THEN
      UPDATE public.products SET stock = stock + _qty, updated_at = now() WHERE id = _pid;
    END IF;

    INSERT INTO public.pos_refund_items (refund_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (_ref.id, _pid, _si.product_name, _si.unit_price, _qty, _si.unit_price * _qty);

    _total := _total + _si.unit_price * _qty;
    _count := _count + _qty;
  END LOOP;

  UPDATE public.pos_refunds SET total = _total, item_count = _count WHERE id = _ref.id RETURNING * INTO _ref;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _email, 'pos.refund', 'pos_refunds', _ref.id::text,
          jsonb_build_object('refund_number', _ref.refund_number, 'sale_number', _sale.sale_number, 'total', _total));

  RETURN row_to_json(_ref);
END; $$;