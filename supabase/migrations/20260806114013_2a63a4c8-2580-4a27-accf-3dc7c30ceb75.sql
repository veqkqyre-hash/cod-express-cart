CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text,
  kind text NOT NULL DEFAULT 'status',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read notifications" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff update notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins delete notifications" ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX notifications_created_idx ON public.notifications (created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_order_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (order_id, order_number, kind, title, body)
    VALUES (NEW.id, NEW.order_number, 'new_order',
            'Porosi e re / New order ' || NEW.order_number,
            NEW.customer_name || ' - ' || NEW.city || ' - ' || NEW.total::text || ' EUR');
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
    VALUES (NEW.user_id, 'order.created', 'orders', NEW.id::text,
            jsonb_build_object('order_number', NEW.order_number, 'total', NEW.total));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (order_id, order_number, kind, title, body)
    VALUES (NEW.id, NEW.order_number, 'status',
            'Porosia ' || NEW.order_number || ' -> ' || NEW.status,
            OLD.status || ' -> ' || NEW.status);
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
    VALUES (auth.uid(), 'order.status_changed', 'orders', NEW.id::text,
            jsonb_build_object('order_number', NEW.order_number, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER order_notify_insert AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_order_notify();
CREATE TRIGGER order_notify_status AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_order_notify();

CREATE OR REPLACE FUNCTION public.list_staff()
RETURNS TABLE(user_id uuid, email text, role app_role, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT ur.user_id, u.email::text, ur.role, ur.created_at
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role IN ('admin','manager','editor')
    ORDER BY ur.role, ur.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_role_by_email(_email text, _role app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'User with that email not found. They must sign up first.';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (auth.uid(), (SELECT email::text FROM auth.users WHERE id = auth.uid()),
          'role.granted', 'user_roles', _uid::text,
          jsonb_build_object('email', _email, 'role', _role));
  RETURN json_build_object('user_id', _uid, 'email', _email, 'role', _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _user_id = auth.uid() AND _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (auth.uid(), (SELECT email::text FROM auth.users WHERE id = auth.uid()),
          'role.revoked', 'user_roles', _user_id::text, jsonb_build_object('role', _role));
END;
$$;

CREATE OR REPLACE FUNCTION public.log_action(_action text, _entity text, _entity_id text, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (auth.uid(), (SELECT email::text FROM auth.users WHERE id = auth.uid()),
          _action, _entity, _entity_id, COALESCE(_details, '{}'::jsonb));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_role_by_email(text, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_action(text, text, text, jsonb) FROM anon;