DROP POLICY IF EXISTS "Anyone insert order items" ON public.order_items;
CREATE POLICY "Users insert items into own pending orders" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  quantity > 0 AND unit_price >= 0 AND subtotal >= 0
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
      AND o.status = 'pending'
  )
);