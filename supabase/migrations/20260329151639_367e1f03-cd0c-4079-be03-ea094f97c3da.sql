
-- Payment transactions table for DuttyFy integration
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text,
  provider text NOT NULL DEFAULT 'duttyfy',
  transaction_id text,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'PIX',
  status_internal text NOT NULL DEFAULT 'waiting_payment',
  status_external text,
  customer_name text,
  customer_document text,
  customer_email text,
  customer_phone text,
  item_title text,
  item_price numeric,
  item_quantity integer DEFAULT 1,
  utm text,
  raw_request jsonb,
  raw_response jsonb,
  pix_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert payment_transactions" ON public.payment_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read payment_transactions" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can update payment_transactions" ON public.payment_transactions FOR UPDATE USING (true) WITH CHECK (true);

-- Integration logs table
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'duttyfy',
  action text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  status_code integer,
  error_message text,
  transaction_id text,
  order_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert integration_logs" ON public.integration_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read integration_logs" ON public.integration_logs FOR SELECT USING (true);
