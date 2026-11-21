CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- The app owner becomes admin once her email is confirmed.
CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) = 'shoroukelbaz39@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_owner_confirmed
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

-- Content the owner publishes to every device (routes, places, ads).
CREATE TABLE public.app_content (
  key text PRIMARY KEY CHECK (key IN ('routes', 'places', 'ads')),
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_content TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_content TO authenticated;
GRANT ALL ON public.app_content TO service_role;
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published content" ON public.app_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert content" ON public.app_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update content" ON public.app_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- One row per app open, for the visitor counter.
CREATE TABLE public.app_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL CHECK (char_length(device_id) BETWEEN 6 AND 64),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.app_visits TO anon, authenticated;
GRANT ALL ON public.app_visits TO service_role;
ALTER TABLE public.app_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone records a visit" ON public.app_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX app_visits_created_idx ON public.app_visits (created_at);

CREATE OR REPLACE FUNCTION public.visitor_stats()
RETURNS TABLE (total_opens bigint, devices bigint, today_opens bigint, today_devices bigint, week_devices bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  RETURN QUERY SELECT
    count(*),
    count(DISTINCT device_id),
    count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo'),
    count(DISTINCT device_id) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo'),
    count(DISTINCT device_id) FILTER (WHERE created_at >= now() - interval '7 days')
  FROM public.app_visits;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.visitor_stats() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.visitor_stats() TO authenticated;