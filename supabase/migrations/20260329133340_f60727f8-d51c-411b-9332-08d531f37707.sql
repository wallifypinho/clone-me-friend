ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS purchase_event_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fbc text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fbp text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS fbc text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS fbp text;
ALTER TABLE public.orders_attribution ADD COLUMN IF NOT EXISTS fbc text;
ALTER TABLE public.orders_attribution ADD COLUMN IF NOT EXISTS fbp text;