
-- TABELA: companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text DEFAULT '🚌',
  is_active boolean NOT NULL DEFAULT true,
  accepts_local boolean NOT NULL DEFAULT false,
  accepts_metropolitan boolean NOT NULL DEFAULT true,
  accepts_intermunicipal boolean NOT NULL DEFAULT true,
  accepts_interstate boolean NOT NULL DEFAULT false,
  accepts_long_distance boolean NOT NULL DEFAULT false,
  distance_min_km numeric NULL,
  distance_max_km numeric NULL,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies" ON public.companies
  FOR SELECT TO public USING (true);

-- TABELA: company_coverage_rules
CREATE TABLE public.company_coverage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  origin_state char(2) NULL,
  destination_state char(2) NULL,
  origin_city_ibge text NULL,
  destination_city_ibge text NULL,
  rule_type text NOT NULL DEFAULT 'allow' CHECK (rule_type IN ('allow', 'deny')),
  min_distance_km numeric NULL,
  max_distance_km numeric NULL,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_coverage_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read company_coverage_rules" ON public.company_coverage_rules
  FOR SELECT TO public USING (true);
