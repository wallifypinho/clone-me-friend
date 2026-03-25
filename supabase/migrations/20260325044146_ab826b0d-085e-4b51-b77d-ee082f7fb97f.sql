
-- 1. Create orders table for payment tracking
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  reservation_code text,
  lead_id text,
  session_id text,
  visitor_id text,
  gateway_transaction_id text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  payment_method text,
  payment_status text NOT NULL DEFAULT 'created',
  paid_at timestamp with time zone,
  last_gateway_update_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Attribution fields
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  campaign_name text,
  campaign_id text,
  adset_name text,
  adset_id text,
  ad_name text,
  ad_id text,
  placement text,
  first_visit_at timestamp with time zone,
  landing_page text,
  referrer text,
  buyer_score integer DEFAULT 0,
  customer_name text,
  customer_cpf text,
  customer_email text,
  customer_whatsapp text,
  raw_gateway_response jsonb
);

-- 2. Create payment_events table for webhook audit
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  order_id text,
  gateway_transaction_id text,
  raw_status text,
  normalized_status text,
  payload_json jsonb,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  is_duplicate boolean DEFAULT false
);

-- 3. Add missing columns to orders_attribution
ALTER TABLE public.orders_attribution
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS first_visit_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS buyer_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text;

-- 4. Add paid_at to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text;

-- 5. RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE TO public USING (true);

-- 6. RLS for payment_events
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert payment_events" ON public.payment_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read payment_events" ON public.payment_events FOR SELECT TO public USING (true);

-- 7. Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_gateway_tx ON public.orders (gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_reservation_code ON public.orders (reservation_code);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_gateway_tx ON public.payment_events (gateway_transaction_id);
