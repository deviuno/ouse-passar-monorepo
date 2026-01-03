import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://avlttxzppcywybiaxxzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHR0eHpwcGN5d3liaWF4eHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MTcyMTksImV4cCI6MjA0ODM5MzIxOX0.kSEjPtCJxfXjcXZ2_fJLxDge-diHWMx_b-YWAY8Oif4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function limparQuestoesDoPreparatorio(slug) {
  console.log('Buscando preparatorio:', slug);

  // 1. Buscar preparatório pelo slug
  const { data: prep, error: prepError } = await supabase
    .from('preparatorios')
    .select('id, nome')
    .eq('slug', slug)
    .single();

  if (prepError || !prep) {
    console.error('Preparatorio nao encontrado:', prepError);
    return;
  }

  console.log('Encontrado:', prep.nome, '(' + prep.id + ')');

  // 2. Buscar rodadas do preparatório
  const { data: rodadas, error: rodadasError } = await supabase
    .from('rodadas')
    .select('id')
    .eq('preparatorio_id', prep.id);

  if (rodadasError || !rodadas || rodadas.length === 0) {
    console.log('Nenhuma rodada encontrada');
    return;
  }

  console.log('Encontradas', rodadas.length, 'rodadas');

  const rodadaIds = rodadas.map(r => r.id);

  // 3. Buscar missões dessas rodadas
  const { data: missoes, error: missoesError } = await supabase
    .from('missoes')
    .select('id')
    .in('rodada_id', rodadaIds);

  if (missoesError || !missoes || missoes.length === 0) {
    console.log('Nenhuma missao encontrada');
    return;
  }

  console.log('Encontradas', missoes.length, 'missoes');

  const missaoIds = missoes.map(m => m.id);

  // 4. Contar questões fixas antes de deletar
  const { count: countAntes } = await supabase
    .from('missao_questoes')
    .select('*', { count: 'exact', head: true })
    .in('missao_id', missaoIds);

  console.log('Questoes fixas encontradas:', countAntes || 0);

  // 5. Deletar questões fixas
  const { error: deleteError } = await supabase
    .from('missao_questoes')
    .delete()
    .in('missao_id', missaoIds);

  if (deleteError) {
    console.error('Erro ao deletar:', deleteError);
    return;
  }

  console.log('Questoes fixas deletadas com sucesso!');
  console.log('As questoes serao regeneradas corretamente no proximo acesso.');
}

limparQuestoesDoPreparatorio('pcsc-2025-agente-de-policia-civil');
