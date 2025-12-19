/**
 * Serviço para gerenciar conteúdo gerado das missões.
 * O conteúdo é gerado uma vez pelo primeiro usuário e reutilizado por todos.
 */

import { supabase } from './supabaseClient';
import { getQuestoesParaMissao, getMissaoEditalItems, getEditalItemsTitulos } from './missaoQuestoesService';

// Tipos
export interface MissaoConteudo {
  id: string;
  missao_id: string;
  texto_content: string;
  audio_url: string | null;
  modelo_texto: string;
  modelo_audio: string | null;
  topicos_analisados: string[] | null;
  questoes_analisadas: number[] | null;
  status: 'generating' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  generated_by_user_id: string | null;
}

interface GeracaoConteudoInput {
  missaoId: string;
  userId: string;
  questoesPorMissao?: number;
}

// URL base do servidor Mastra (ajustar conforme ambiente)
const MASTRA_SERVER_URL = import.meta.env.VITE_MASTRA_SERVER_URL || 'http://localhost:4000';

/**
 * Busca o conteúdo existente de uma missão
 */
export async function getMissaoConteudo(missaoId: string): Promise<MissaoConteudo | null> {
  try {
    const { data, error } = await supabase
      .from('missao_conteudos')
      .select('*')
      .eq('missao_id', missaoId)
      .maybeSingle(); // Usa maybeSingle() para retornar null quando não encontra (evita erro 406)

    if (error) {
      // PGRST116 = não encontrado, 406 = Not Acceptable (também significa não encontrado com .single())
      if (error.code === 'PGRST116' || error.message?.includes('406')) {
        return null;
      }
      console.error('[MissaoConteudoService] Erro ao buscar conteúdo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[MissaoConteudoService] Erro:', error);
    return null;
  }
}

/**
 * Verifica se o conteúdo de uma missão existe e está pronto
 */
export async function conteudoExiste(missaoId: string): Promise<boolean> {
  const conteudo = await getMissaoConteudo(missaoId);
  return conteudo !== null && conteudo.status === 'completed';
}

/**
 * Busca informações da missão para contexto
 */
async function getMissaoInfo(missaoId: string) {
  const { data, error } = await supabase
    .from('missoes')
    .select('*, rodadas(preparatorio_id)')
    .eq('id', missaoId)
    .single();

  if (error) {
    console.error('[MissaoConteudoService] Erro ao buscar missão:', error);
    return null;
  }

  return data;
}

/**
 * Monta o contexto completo para o agente de geração
 */
async function montarContextoParaGeracao(missaoId: string, questoesPorMissao: number = 20) {
  // 1. Buscar info da missão
  const missaoInfo = await getMissaoInfo(missaoId);
  if (!missaoInfo) {
    throw new Error('Missão não encontrada');
  }

  // 2. Buscar tópicos do edital
  const editalItemIds = await getMissaoEditalItems(missaoId);
  const topicos = editalItemIds.length > 0
    ? await getEditalItemsTitulos(editalItemIds)
    : [missaoInfo.assunto || 'Tema geral'];

  // 3. Buscar questões da missão
  const questoes = await getQuestoesParaMissao(missaoId, questoesPorMissao);

  // 4. Formatar questões para o contexto
  const questoesFormatadas = questoes.map((q, i) => ({
    numero: i + 1,
    enunciado: q.enunciado,
    alternativas: q.parsedAlternativas,
    gabarito: q.gabarito,
    comentario: q.comentario || 'Sem comentário disponível',
    banca: q.banca,
    ano: q.ano,
  }));

  return {
    materia: missaoInfo.materia || 'Matéria não especificada',
    topicos,
    questoes: questoesFormatadas,
    totalQuestoes: questoes.length,
    questoesIds: questoes.map(q => q.id),
  };
}

/**
 * Chama o agente Mastra para gerar o conteúdo
 */
async function gerarConteudoComAgente(contexto: any): Promise<string> {
  const prompt = `
## Contexto da Missão

**Matéria:** ${contexto.materia}

**Tópicos do Edital:**
${contexto.topicos.map((t: string) => `- ${t}`).join('\n')}

**Questões para Análise (${contexto.totalQuestoes} questões):**

${contexto.questoes.map((q: any) => `
### Questão ${q.numero} (${q.banca} ${q.ano})

**Enunciado:** ${q.enunciado}

**Alternativas:**
${q.alternativas.map((a: any) => `${a.letter}) ${a.text}`).join('\n')}

**Gabarito:** ${q.gabarito}

**Comentário da banca/professor:** ${q.comentario}
`).join('\n---\n')}

---

Com base nas questões acima, crie uma aula completa sobre "${contexto.topicos[0] || contexto.materia}".
A aula deve preparar o aluno para responder questões similares às apresentadas.
`;

  try {
    const response = await fetch(`${MASTRA_SERVER_URL}/api/agents/contentGeneratorAgent/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Mastra: ${response.status}`);
    }

    const result = await response.json();
    return result.text || result.content || '';
  } catch (error) {
    console.error('[MissaoConteudoService] Erro ao chamar agente:', error);
    throw error;
  }
}

/**
 * Adapta o texto para áudio usando o agente de roteiro
 */
async function adaptarParaAudio(textoMarkdown: string): Promise<string> {
  try {
    const response = await fetch(`${MASTRA_SERVER_URL}/api/agents/audioScriptAgent/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Adapte o seguinte texto em Markdown para narração em áudio:\n\n${textoMarkdown}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Mastra: ${response.status}`);
    }

    const result = await response.json();
    return result.text || result.content || '';
  } catch (error) {
    console.error('[MissaoConteudoService] Erro ao adaptar para áudio:', error);
    throw error;
  }
}

/**
 * Gera o áudio usando Google TTS
 */
async function gerarAudio(texto: string, missaoId: string): Promise<string | null> {
  try {
    // Chamar endpoint de TTS no servidor Mastra ou diretamente a API do Google
    const response = await fetch(`${MASTRA_SERVER_URL}/api/tts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texto,
        languageCode: 'pt-BR',
        voiceName: 'kore', // Voz Gemini TTS
        missaoId,
      }),
    });

    if (!response.ok) {
      console.warn('[MissaoConteudoService] TTS não disponível, continuando sem áudio');
      return null;
    }

    const result = await response.json();
    return result.audioUrl || null;
  } catch (error) {
    console.warn('[MissaoConteudoService] Erro ao gerar áudio:', error);
    return null;
  }
}

/**
 * Marca uma missão como "em geração"
 */
async function marcarComoGerando(missaoId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('missao_conteudos')
    .insert({
      missao_id: missaoId,
      texto_content: '',
      status: 'generating',
      generated_by_user_id: userId,
    })
    .select('id')
    .single();

  if (error) {
    // Se já existe (race condition), retorna null
    if (error.code === '23505') {
      console.log('[MissaoConteudoService] Conteúdo já existe ou está sendo gerado');
      return null;
    }
    console.error('[MissaoConteudoService] Erro ao marcar como gerando:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Atualiza o conteúdo com o resultado da geração
 */
async function atualizarConteudo(
  conteudoId: string,
  updates: Partial<MissaoConteudo>
): Promise<boolean> {
  const { error } = await supabase
    .from('missao_conteudos')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conteudoId);

  if (error) {
    console.error('[MissaoConteudoService] Erro ao atualizar conteúdo:', error);
    return false;
  }

  return true;
}

/**
 * Gera o conteúdo completo para uma missão
 * Esta é a função principal que orquestra todo o processo
 */
export async function gerarConteudoMissao(
  input: GeracaoConteudoInput
): Promise<MissaoConteudo | null> {
  const { missaoId, userId, questoesPorMissao = 20 } = input;

  console.log('[MissaoConteudoService] Iniciando geração para missão:', missaoId);

  // 1. Verificar se já existe
  const existente = await getMissaoConteudo(missaoId);
  if (existente) {
    if (existente.status === 'completed') {
      console.log('[MissaoConteudoService] Conteúdo já existe');
      return existente;
    }
    if (existente.status === 'generating') {
      console.log('[MissaoConteudoService] Conteúdo está sendo gerado');
      return existente;
    }
    // Se falhou, vamos tentar novamente (não implementado por simplicidade)
  }

  // 2. Marcar como gerando (evita duplicação)
  const conteudoId = await marcarComoGerando(missaoId, userId);
  if (!conteudoId) {
    // Já existe ou está sendo gerado, buscar novamente
    return await getMissaoConteudo(missaoId);
  }

  try {
    // 3. Montar contexto
    console.log('[MissaoConteudoService] Montando contexto...');
    const contexto = await montarContextoParaGeracao(missaoId, questoesPorMissao);

    // 4. Gerar conteúdo texto
    console.log('[MissaoConteudoService] Gerando conteúdo texto...');
    const textoContent = await gerarConteudoComAgente(contexto);

    // 5. Adaptar para áudio
    console.log('[MissaoConteudoService] Adaptando para áudio...');
    const roteiro = await adaptarParaAudio(textoContent);

    // 6. Gerar áudio (opcional, não bloqueia se falhar)
    console.log('[MissaoConteudoService] Gerando áudio...');
    const audioUrl = await gerarAudio(roteiro, missaoId);

    // 7. Atualizar com sucesso
    await atualizarConteudo(conteudoId, {
      texto_content: textoContent,
      audio_url: audioUrl,
      topicos_analisados: contexto.topicos,
      questoes_analisadas: contexto.questoesIds,
      status: 'completed',
      modelo_texto: 'gemini-2.5-pro-preview',
      modelo_audio: audioUrl ? 'google-tts' : null,
    });

    console.log('[MissaoConteudoService] Conteúdo gerado com sucesso!');
    return await getMissaoConteudo(missaoId);

  } catch (error: any) {
    console.error('[MissaoConteudoService] Erro na geração:', error);

    // Marcar como falhou
    await atualizarConteudo(conteudoId, {
      status: 'failed',
      error_message: error.message || 'Erro desconhecido',
    });

    return null;
  }
}

export default {
  getMissaoConteudo,
  conteudoExiste,
  gerarConteudoMissao,
};
