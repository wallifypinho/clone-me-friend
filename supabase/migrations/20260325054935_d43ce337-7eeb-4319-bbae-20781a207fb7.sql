-- 1. LEADS table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text UNIQUE NOT NULL,
  name text,
  email text,
  phone text,
  whatsapp text,
  cpf text,
  session_id text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read leads" ON public.leads FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update leads" ON public.leads FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 2. RESERVATIONS table
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code text UNIQUE NOT NULL,
  lead_id text REFERENCES public.leads(lead_id),
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  departure_time text,
  arrival_time text,
  company text,
  seat_type text,
  seats text,
  passenger_count integer NOT NULL DEFAULT 1,
  base_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  reservation_status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reservations" ON public.reservations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read reservations" ON public.reservations FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update reservations" ON public.reservations FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 3. TICKETS table
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL,
  reservation_code text,
  order_id text,
  passenger_name text,
  passenger_cpf text,
  origin text,
  destination text,
  departure_date date,
  departure_time text,
  seat text,
  airline_locator text,
  issued_at timestamptz,
  pdf_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tickets" ON public.tickets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read tickets" ON public.tickets FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update tickets" ON public.tickets FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 4. Add buyer_score to visitor_sessions
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS buyer_score integer DEFAULT 0;