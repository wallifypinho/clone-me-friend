-- Add session_id to reservations for chain linking
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS session_id text;

-- Add buyer_stage to visitor_sessions
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS buyer_stage text DEFAULT 'frio';

-- Add screen_resolution to visitor_sessions (missing from attribution)
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS screen_resolution text;