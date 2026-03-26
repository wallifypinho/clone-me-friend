
CREATE TABLE IF NOT EXISTS cidades_ibge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cidade text NOT NULL,
  estado text NOT NULL,
  nome_estado text NOT NULL,
  codigo_ibge text NOT NULL UNIQUE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cidades_nome ON cidades_ibge(nome_cidade);
CREATE INDEX idx_cidades_estado ON cidades_ibge(estado);
CREATE INDEX idx_cidades_nome_estado ON cidades_ibge(nome_cidade, estado);

CREATE TABLE IF NOT EXISTS rotas_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_id uuid REFERENCES cidades_ibge(id) ON DELETE CASCADE,
  destino_id uuid REFERENCES cidades_ibge(id) ON DELETE CASCADE,
  distancia_km numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(origem_id, destino_id)
);

CREATE TABLE IF NOT EXISTS tipos_onibus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  fator_preco numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa text NOT NULL,
  origem_id uuid REFERENCES cidades_ibge(id) ON DELETE CASCADE,
  destino_id uuid REFERENCES cidades_ibge(id) ON DELETE CASCADE,
  hora_inicio text NOT NULL DEFAULT '06:00',
  hora_fim text NOT NULL DEFAULT '23:00',
  intervalo_minutos integer NOT NULL DEFAULT 120,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cidades_ibge ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_onibus ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cidades_ibge" ON cidades_ibge FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read rotas_cache" ON rotas_cache FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert rotas_cache" ON rotas_cache FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read tipos_onibus" ON tipos_onibus FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read programacoes" ON programacoes FOR SELECT TO public USING (true);

INSERT INTO tipos_onibus (nome, fator_preco) VALUES
  ('Convencional', 1.0),
  ('Semi-Leito', 1.3),
  ('Leito', 1.8),
  ('Leito Cama', 2.5);
