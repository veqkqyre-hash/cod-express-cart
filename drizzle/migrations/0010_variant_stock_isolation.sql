CREATE OR REPLACE FUNCTION public.tg_order_item_stock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.variant_id IS NOT NULL THEN
  UPDATE public.product_variants SET stock=stock-NEW.quantity WHERE id=NEW.variant_id;
 ELSIF NEW.product_id IS NOT NULL THEN
  UPDATE public.products SET stock=stock-NEW.quantity,updated_at=now() WHERE id=NEW.product_id;
 END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.tg_order_cancel_restock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE direction integer;
BEGIN
 IF NEW.status='cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN direction:=1;
 ELSIF OLD.status='cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN direction:=-1;
 ELSE RETURN NEW; END IF;
 UPDATE public.products p SET stock=greatest(0,p.stock+direction*x.quantity),updated_at=now()
 FROM (SELECT product_id,sum(quantity)::integer AS quantity FROM public.order_items WHERE order_id=NEW.id AND variant_id IS NULL GROUP BY product_id) x WHERE p.id=x.product_id;
 UPDATE public.product_variants v SET stock=greatest(0,v.stock+direction*x.quantity)
 FROM (SELECT variant_id,sum(quantity)::integer AS quantity FROM public.order_items WHERE order_id=NEW.id AND variant_id IS NOT NULL GROUP BY variant_id) x WHERE v.id=x.variant_id;
 RETURN NEW;
END; $$;