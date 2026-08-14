-- Orders: managers get read + update alongside admins
DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
CREATE POLICY "Staff read orders" ON public.orders
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Staff update orders" ON public.orders
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins delete orders" ON public.orders
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Order items
DROP POLICY IF EXISTS "Admins read order items" ON public.order_items;
CREATE POLICY "Staff read order items" ON public.order_items
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins delete order items" ON public.order_items
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));