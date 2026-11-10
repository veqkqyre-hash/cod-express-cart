DROP POLICY IF EXISTS "Users insert items into own pending orders" ON public.order_items;
CREATE POLICY "Users insert items into own pending orders" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  quantity > 0 AND quantity <= 1000
  AND subtotal = unit_price * quantity
  AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid() AND o.status = 'pending')
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = order_items.product_id AND p.active AND p.price = order_items.unit_price)
);

DROP POLICY IF EXISTS "Anyone can send message" ON public.messages;
CREATE POLICY "Anyone can send valid message" ON public.messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  read = false
  AND length(btrim(name)) BETWEEN 1 AND 120
  AND length(btrim(body)) BETWEEN 1 AND 5000
  AND (email IS NULL OR (length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
  AND (phone IS NULL OR length(phone) <= 40)
  AND (subject IS NULL OR length(subject) <= 200)
);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with valid email" ON public.newsletter_subscribers
FOR INSERT TO anon, authenticated
WITH CHECK (
  active = true
  AND lang IN ('sq','en')
  AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

DROP POLICY IF EXISTS "Anyone can request stock alert" ON public.stock_alerts;
CREATE POLICY "Anyone can request valid stock alert" ON public.stock_alerts
FOR INSERT TO anon, authenticated
WITH CHECK (
  notified = false
  AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (product_name IS NULL OR length(product_name) <= 300)
  AND product_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = stock_alerts.product_id)
);

DROP POLICY IF EXISTS "Anyone can log a visit" ON public.visitor_logs;
CREATE POLICY "Visitors log own visit" ON public.visitor_logs
FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND length(path) BETWEEN 1 AND 500
  AND (referrer IS NULL OR length(referrer) <= 1000)
  AND (user_agent IS NULL OR length(user_agent) <= 1000)
  AND (session_id IS NULL OR length(session_id) <= 100)
);