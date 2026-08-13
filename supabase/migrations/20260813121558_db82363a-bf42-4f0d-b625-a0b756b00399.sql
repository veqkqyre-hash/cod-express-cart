CREATE OR REPLACE FUNCTION public.tg_order_item_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
       SET stock = GREATEST(0, stock - NEW.quantity), updated_at = now()
     WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER order_items_stock_out
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.tg_order_item_stock();

CREATE OR REPLACE FUNCTION public.tg_order_cancel_restock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
       SET stock = p.stock + oi.quantity, updated_at = now()
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  ELSIF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
       SET stock = GREATEST(0, p.stock - oi.quantity), updated_at = now()
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER order_cancel_restock
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_order_cancel_restock();