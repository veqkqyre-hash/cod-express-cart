-- Normalize + validate barcodes server-side
CREATE OR REPLACE FUNCTION public.tg_validate_barcode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.barcode IS NOT NULL THEN
    NEW.barcode := upper(btrim(NEW.barcode));
    IF NEW.barcode = '' THEN
      NEW.barcode := NULL;
    ELSIF NEW.barcode !~ '^[A-Z0-9._-]{4,32}$' THEN
      RAISE EXCEPTION 'Barkod i pavlefshëm: % (4-32 karaktere, pa zbrazëti, vetëm A-Z 0-9 . _ -)', NEW.barcode;
    END IF;
  END IF;
  IF NEW.sku IS NOT NULL THEN
    NEW.sku := btrim(NEW.sku);
    IF NEW.sku = '' THEN NEW.sku := NULL; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_product_barcode ON public.products;
CREATE TRIGGER validate_product_barcode
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.tg_validate_barcode();

CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique
  ON public.products (barcode) WHERE barcode IS NOT NULL;

-- Server-side scan: validates the code, logs the scan, returns the product
CREATE OR REPLACE FUNCTION public.pos_scan(_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _c text := upper(btrim(COALESCE(_code, '')));
  _p public.products;
  _email text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT email::text INTO _email FROM auth.users WHERE id = _uid;

  IF _c = '' THEN
    RAISE EXCEPTION 'Skanimi nuk prodhoi vlerë / Empty scan';
  END IF;
  IF _c !~ '^[A-Z0-9._-]{4,32}$' THEN
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
    VALUES (_uid, _email, 'pos.scan_invalid', 'products', NULL, jsonb_build_object('code', _c));
    RAISE EXCEPTION 'Barkod i pavlefshëm: % / Invalid barcode', _c;
  END IF;

  SELECT * INTO _p FROM public.products
   WHERE upper(barcode) = _c OR upper(COALESCE(sku,'')) = _c
   LIMIT 1;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _email, CASE WHEN _p.id IS NULL THEN 'pos.scan_not_found' ELSE 'pos.scan' END,
          'products', _p.id::text,
          jsonb_build_object('code', _c, 'product', _p.name_sq, 'stock', _p.stock));

  IF _p.id IS NULL THEN
    RETURN json_build_object('found', false, 'code', _c);
  END IF;
  RETURN json_build_object('found', true, 'code', _c, 'product', row_to_json(_p));
END;
$$;