
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order status
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled');

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_sq TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_sq TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_sq TEXT,
  description_en TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Order number sequence
CREATE SEQUENCE public.order_number_seq START 1000;

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('ORD-' || nextval('public.order_number_seq')::TEXT),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  notes TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public function to fetch an order by number (for confirmation page)
CREATE OR REPLACE FUNCTION public.get_order_by_number(_order_number TEXT)
RETURNS JSON LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'order', row_to_json(o),
    'items', COALESCE((SELECT json_agg(oi) FROM public.order_items oi WHERE oi.order_id = o.id), '[]'::json)
  )
  FROM public.orders o WHERE o.order_number = _order_number;
$$;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(TEXT) TO anon, authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER set_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
