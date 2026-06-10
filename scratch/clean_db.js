
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hmbyicviwrrayhztzkch.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYnlpY3Zpd3JyYXloenR6a2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ0Nzc4NSwiZXhwIjoyMDg2MDIzNzg1fQ.ploo1AZPIOsFjvyiG3ZWSNevF7hlh1-syirNZ2VXp9k'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const tablesToClean = [
    'hub.liderancas',
    'hub.demandas',
    'hub.agenda',
    'hub.recursos',
    'core.assessores',
    'core.apoiadores',
    'core.votos'
];

async function cleanDatabase() {
    console.log('--- Iniciando Limpeza do Banco de Dados ---');
    
    for (const table of tablesToClean) {
        console.log(`Limpando tabela: ${table}...`);
        // Usando o endpoint de RPC exec_sql se existir, ou tentando via SQL direto se possível
        // No supabase-js v2 para rodar SQL arbitrário precisamos de um RPC
        const { error } = await supabase.rpc('exec_sql', { sql_query: `TRUNCATE TABLE ${table} CASCADE;` });
        
        if (error) {
            console.error(`Erro ao limpar ${table}:`, error.message);
        } else {
            console.log(`✅ ${table} limpa com sucesso.`);
        }
    }
    
    console.log('--- Processo Concluído ---');
}

cleanDatabase();
