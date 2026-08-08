CREATE TABLE public.visitor_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text,
  user_id uuid,
  path text NOT NULL DEFAULT '/',
  referrer text,
  ip text,
  country text,
  country_code text,
  city text,
  region text,
  user_agent text,
  device text,
  language text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX visitor_logs_created_at_idx ON public.visitor_logs (created_at DESC);
CREATE INDEX visitor_logs_country_idx ON public.visitor_logs (country_code);

GRANT INSERT ON public.visitor_logs TO anon;
GRANT SELECT, INSERT ON public.visitor_logs TO authenticated;
GRANT ALL ON public.visitor_logs TO service_role;

ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a visit" ON public.visitor_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Staff read visitors" ON public.visitor_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));