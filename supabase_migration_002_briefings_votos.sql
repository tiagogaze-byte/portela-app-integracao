-- Criação da tabela de Briefings Diários / Notícias
CREATE TABLE IF NOT EXISTS hub.briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    acao_sugerida TEXT,
    prioridade TEXT DEFAULT 'MÉDIA' CHECK (prioridade IN ('ALTA', 'MÉDIA', 'BAIXA')),
    origem TEXT CHECK (origem IN ('Alê Portela', 'Lincoln Portela', 'Marilda Portela', 'Geral')),
    data_publicacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Votos por Município
CREATE TABLE IF NOT EXISTS hub.votos_eleicoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    municipio_id UUID NOT NULL REFERENCES hub.municipios(id) ON DELETE CASCADE,
    origem TEXT NOT NULL CHECK (origem IN ('Alê Portela', 'Lincoln Portela', 'Marilda Portela')),
    ano_eleicao INTEGER NOT NULL,
    quantidade_votos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(municipio_id, origem, ano_eleicao) -- Garante que não teremos duas contagens para o mesmo candidato/ano/cidade
);

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE hub.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub.votos_eleicoes ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias permitindo tudo para o banco do hub (simplificado para ambiente de desenvolvimento/integrado via API key)
CREATE POLICY "Permitir leitura geral em briefings" ON hub.briefings FOR SELECT USING (true);
CREATE POLICY "Permitir inserção/atualização em briefings" ON hub.briefings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura geral em votos" ON hub.votos_eleicoes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção/atualização em votos" ON hub.votos_eleicoes FOR ALL USING (true) WITH CHECK (true);
