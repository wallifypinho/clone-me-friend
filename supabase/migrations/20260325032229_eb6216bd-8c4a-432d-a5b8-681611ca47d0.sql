
-- visitor_sessions table
CREATE TABLE public.visitor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  first_visit_at TIMESTAMPTZ DEFAULT now(),
  last_interaction_at TIMESTAMPTZ DEFAULT now(),
  landing_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  campaign_name TEXT,
  campaign_id TEXT,
  adset_name TEXT,
  adset_id TEXT,
  ad_name TEXT,
  ad_id TEXT,
  placement TEXT,
  fbclid TEXT,
  gclid TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  language TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor_sessions" ON public.visitor_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read visitor_sessions" ON public.visitor_sessions FOR SELECT TO public USING (true);

-- visitor_events table
CREATE TABLE public.visitor_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  session_id TEXT,
  visitor_id TEXT,
  lead_id TEXT,
  reservation_code TEXT,
  event_name TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_url TEXT,
  payload_json JSONB DEFAULT '{}'::jsonb,
  buyer_score INTEGER DEFAULT 0,
  buyer_stage TEXT DEFAULT 'frio'
);

ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor_events" ON public.visitor_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read visitor_events" ON public.visitor_events FOR SELECT TO public USING (true);

-- orders_attribution table
CREATE TABLE public.orders_attribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  session_id TEXT,
  lead_id TEXT,
  reservation_code TEXT,
  first_touch_source TEXT,
  last_touch_source TEXT,
  campaign_name TEXT,
  campaign_id TEXT,
  adset_name TEXT,
  adset_id TEXT,
  ad_name TEXT,
  ad_id TEXT,
  placement TEXT,
  purchase_value NUMERIC,
  purchase_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders_attribution" ON public.orders_attribution FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read orders_attribution" ON public.orders_attribution FOR SELECT TO public USING (true);
