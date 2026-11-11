ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_sq text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  color_hex text,
  image_url text,
  price numeric,
  stock integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants(product_id, sort_order);

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active variants" ON public.product_variants
FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Staff manage variants" ON public.product_variants
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'editor'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'editor'));

CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name text;

-- Server-side validation of variant choice, price and stock for online orders
CREATE OR REPLACE FUNCTION public.tg_order_item_validate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p record; v record; has_variants boolean;
BEGIN
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO p FROM public.products WHERE id = NEW.product_id;
  IF NOT FOUND OR NOT p.active THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.product_variants WHERE product_id = NEW.product_id AND active) INTO has_variants;
  IF has_variants AND NEW.variant_id IS NULL THEN RAISE EXCEPTION 'VARIANT_REQUIRED'; END IF;
  IF NEW.variant_id IS NOT NULL THEN
    SELECT * INTO v FROM public.product_variants WHERE id = NEW.variant_id FOR UPDATE;
    IF NOT FOUND OR v.product_id <> NEW.product_id OR NOT v.active THEN RAISE EXCEPTION 'VARIANT_INVALID'; END IF;
    IF NEW.unit_price <> COALESCE(v.price, p.price) THEN RAISE EXCEPTION 'PRICE_MISMATCH'; END IF;
    IF v.stock < NEW.quantity THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
    NEW.variant_name := v.name_sq;
  ELSE
    IF NEW.unit_price <> p.price THEN RAISE EXCEPTION 'PRICE_MISMATCH'; END IF;
    IF p.stock < NEW.quantity THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS order_items_validate ON public.order_items;
CREATE TRIGGER order_items_validate BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.tg_order_item_validate();

CREATE OR REPLACE FUNCTION public.tg_order_item_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
       SET stock = GREATEST(0, stock - NEW.quantity), updated_at = now()
     WHERE id = NEW.product_id;
  END IF;
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
       SET stock = GREATEST(0, stock - NEW.quantity)
     WHERE id = NEW.variant_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.tg_order_cancel_restock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
       SET stock = p.stock + oi.quantity, updated_at = now()
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    UPDATE public.product_variants pv
       SET stock = pv.stock + oi.quantity
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.variant_id = pv.id;
  ELSIF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
       SET stock = GREATEST(0, p.stock - oi.quantity), updated_at = now()
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    UPDATE public.product_variants pv
       SET stock = GREATEST(0, pv.stock - oi.quantity)
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.variant_id = pv.id;
  END IF;
  RETURN NEW;
END; $$;

DROP POLICY IF EXISTS "Users insert items into own pending orders" ON public.order_items;
CREATE POLICY "Users insert items into own pending orders" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  quantity > 0 AND quantity <= 1000
  AND subtotal = unit_price * quantity
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid() AND o.status = 'pending')
  AND EXISTS (
    SELECT 1 FROM public.products p
    LEFT JOIN public.product_variants v ON v.id = order_items.variant_id
    WHERE p.id = order_items.product_id AND p.active
      AND (order_items.variant_id IS NULL OR (v.product_id = p.id AND v.active))
      AND COALESCE(v.price, p.price) = order_items.unit_price
  )
);