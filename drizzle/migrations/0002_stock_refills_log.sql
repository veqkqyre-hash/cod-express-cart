CREATE TABLE public.stock_refills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_name text,
  old_stock integer NOT NULL,
  new_stock integer NOT NULL,
  added integer NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stock_refills TO authenticated;
GRANT ALL ON public.stock_refills TO service_role;
ALTER TABLE public.stock_refills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read refills" ON public.stock_refills FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'editor'));
CREATE OR REPLACE FUNCTION public.log_stock_refill() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stock > COALESCE(OLD.stock,0) THEN
    INSERT INTO public.stock_refills(product_id, product_name, old_stock, new_stock, added, user_id)
    VALUES (NEW.id, NEW.name_sq, COALESCE(OLD.stock,0), NEW.stock, NEW.stock - COALESCE(OLD.stock,0), auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_log_stock_refill AFTER UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_stock_refill();