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

// Set para controlar deduplicação de regeneração de áudio
// Evita múltiplas chamadas paralelas para a mesma missão
const audioRegenerationInProgress = new Set<string>();

/**
 * Busca o conteúdo existente de uma missão
 * Se o conteúdo existe mas não tem áudio, dispara geração em background
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

    // Se o conteúdo está completo mas não tem áudio, tentar gerar em background
    // Usa deduplicação para evitar múltiplas chamadas paralelas
    if (data && data.status === 'completed' && !data.audio_url && data.texto_content) {
      if (!audioRegenerationInProgress.has(missaoId)) {
        console.log('[MissaoConteudoService] Conteúdo sem áudio detectado, disparando geração em background...');
        audioRegenerationInProgress.add(missaoId);
        // Usar setTimeout para garantir que as funções auxiliares estejam disponíveis
        setTimeout(() => {
          regenerarAudioParaConteudo(data.id, data.texto_content, missaoId);
        }, 0);
      } else {
        console.log('[MissaoConteudoService] Regeneração de áudio já em progresso para missão:', missaoId);
      }
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
 * Gera o áudio usando Google TTS (com timeout de 5 minutos)
 * Timeout maior pois a geração de áudio pode demorar para textos longos
 */
async function gerarAudio(texto: string, missaoId: string): Promise<string | null> {
  try {
    // Timeout de 5 minutos para permitir geração de áudios completos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[MissaoConteudoService] TTS não disponível, continuando sem áudio');
      return null;
    }

    const result = await response.json();
    return result.audioUrl || null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[MissaoConteudoService] TTS timeout (5min), continuando sem áudio');
    } else {
      console.warn('[MissaoConteudoService] Erro ao gerar áudio:', error);
    }
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
 * Executa a geração de conteúdo (função interna)
 */
async function executarGeracao(
  missaoId: string,
  conteudoId: string,
  questoesPorMissao: number
): Promise<MissaoConteudo | null> {
  try {
    // 1. Montar contexto
    console.log('[MissaoConteudoService] Montando contexto...');
    const contexto = await montarContextoParaGeracao(missaoId, questoesPorMissao);

    // 2. Gerar conteúdo texto
    console.log('[MissaoConteudoService] Gerando conteúdo texto...');
    const textoContent = await gerarConteudoComAgente(contexto);

    // 3. Adaptar para áudio
    console.log('[MissaoConteudoService] Adaptando para áudio...');
    const roteiro = await adaptarParaAudio(textoContent);

    // 4. Gerar áudio (opcional, não bloqueia se falhar)
    console.log('[MissaoConteudoService] Gerando áudio...');
    const audioUrl = await gerarAudio(roteiro, missaoId);

    // 5. Atualizar com sucesso
    await atualizarConteudo(conteudoId, {
      texto_content: textoContent,
      audio_url: audioUrl,
      topicos_analisados: contexto.topicos,
      questoes_analisadas: contexto.questoesIds,
      status: 'completed',
      modelo_texto: 'gemini-3-pro-preview',
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

/**
 * Regenera o áudio para um conteúdo que já existe
 * Usado quando o conteúdo foi gerado mas o áudio falhou
 */
async function regenerarAudioParaConteudo(
  conteudoId: string,
  textoContent: string,
  missaoId: string
): Promise<void> {
  try {
    console.log('[MissaoConteudoService] Iniciando regeneração de áudio para missão:', missaoId);

    // 1. Adaptar para áudio
    const roteiro = await adaptarParaAudio(textoContent);

    if (!roteiro || roteiro.length < 100) {
      console.warn('[MissaoConteudoService] Roteiro muito curto, pulando geração de áudio');
      audioRegenerationInProgress.delete(missaoId);
      return;
    }

    console.log('[MissaoConteudoService] Roteiro adaptado, gerando TTS...');

    // 2. Gerar áudio
    const audioUrl = await gerarAudio(roteiro, missaoId);

    if (audioUrl) {
      // 3. Atualizar o registro com o áudio
      await atualizarConteudo(conteudoId, {
        audio_url: audioUrl,
        modelo_audio: 'gemini-tts',
      });
      console.log('[MissaoConteudoService] Áudio regenerado com sucesso:', audioUrl);
    } else {
      console.warn('[MissaoConteudoService] Não foi possível gerar áudio');
    }
  } catch (error) {
    console.error('[MissaoConteudoService] Erro ao regenerar áudio:', error);
  } finally {
    // Sempre limpar o set quando terminar (sucesso ou falha)
    audioRegenerationInProgress.delete(missaoId);
  }
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
      // Se o conteúdo existe mas não tem áudio, tentar gerar o áudio
      if (!existente.audio_url && existente.texto_content) {
        console.log('[MissaoConteudoService] Conteúdo existe mas sem áudio, tentando gerar áudio...');
        setTimeout(() => regenerarAudioParaConteudo(existente.id, existente.texto_content, missaoId), 0);
      }
      return existente;
    }
    if (existente.status === 'generating') {
      // Verificar se está travado (mais de 5 minutos)
      const createdAt = new Date(existente.created_at);
      const agora = new Date();
      const minutosPassados = (agora.getTime() - createdAt.getTime()) / 1000 / 60;

      if (minutosPassados > 5) {
        console.log('[MissaoConteudoService] Geração travada há', Math.round(minutosPassados), 'minutos. Resetando...');
        // Deletar o registro travado para tentar novamente
        await supabase.from('missao_conteudos').delete().eq('id', existente.id);
      } else {
        console.log('[MissaoConteudoService] Conteúdo está sendo gerado há', Math.round(minutosPassados), 'minutos');
        return existente;
      }
    }
    if (existente.status === 'failed') {
      console.log('[MissaoConteudoService] Geração anterior falhou, deletando para tentar novamente...');
      await supabase.from('missao_conteudos').delete().eq('id', existente.id);
    }
  }

  // 2. Marcar como gerando (evita duplicação)
  const conteudoId = await marcarComoGerando(missaoId, userId);
  if (!conteudoId) {
    // Já existe ou está sendo gerado - aguardar até completar
    console.log('[MissaoConteudoService] Aguardando geração em andamento...');

    // Polling para esperar a geração completar (máx 3 minutos)
    const maxWait = 180000; // 3 minutos
    const pollInterval = 3000; // 3 segundos
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      const conteudo = await getMissaoConteudo(missaoId);

      if (conteudo?.status === 'completed') {
        console.log('[MissaoConteudoService] Conteúdo completado por outro processo');
        return conteudo;
      }

      if (conteudo?.status === 'failed') {
        console.log('[MissaoConteudoService] Geração falhou, tentando novamente...');
        // Deletar registro falho e tentar novamente
        await supabase.from('missao_conteudos').delete().eq('id', conteudo.id);
        break; // Sair do loop para tentar gerar novamente
      }

      console.log('[MissaoConteudoService] Ainda gerando, aguardando...');
    }

    // Se saiu do loop sem completar, tentar criar novo registro
    const novoConteudoId = await marcarComoGerando(missaoId, userId);
    if (!novoConteudoId) {
      // Ainda em progresso ou completou, retornar o que tiver
      return await getMissaoConteudo(missaoId);
    }
    // Continuar com o novo ID para gerar
    return await executarGeracao(missaoId, novoConteudoId, questoesPorMissao);
  }

  // Executar a geração
  return await executarGeracao(missaoId, conteudoId, questoesPorMissao);
}

export default {
  getMissaoConteudo,
  conteudoExiste,
  gerarConteudoMissao,
};
