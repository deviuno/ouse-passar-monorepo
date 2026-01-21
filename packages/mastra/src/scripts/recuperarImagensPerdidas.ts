/**
 * Script para recuperar as 21 imagens perdidas do Supabase antigo
 * Busca as imagens diretamente do TecConcursos e faz upload para o Supabase atual
 */

import { createClient } from '@supabase/supabase-js';

// IDs das questões com imagens perdidas
const QUESTOES_AFETADAS = [
  132016, 186552, 186606, 213198, 213307, 213317, 214808, 215033,
  218621, 218623, 220174, 220179, 220182, 220235, 256674, 447299,
  447300, 613266, 2155815, 2340527, 2742685
];

interface RecuperacaoResult {
  id: number;
  success: boolean;
  urlsOriginais?: string[];
  urlsLocais?: string[];
  error?: string;
}

async function extrairImagensTecConcursos(questaoId: number): Promise<string[]> {
  const url = `https://www.tecconcursos.com.br/questoes/${questaoId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[Recuperação] Erro HTTP ${response.status} para questão ${questaoId}`);
      return [];
    }

    const html = await response.text();

    // Extrair URLs de imagens do CDN do TecConcursos
    const regex = /https:\/\/cdn\.tecconcursos\.com\.br\/figuras\/[a-f0-9-]+/g;
    const matches = html.match(regex) || [];

    // Remover duplicatas
    const uniqueUrls = [...new Set(matches)];

    console.log(`[Recuperação] Questão ${questaoId}: encontradas ${uniqueUrls.length} imagens`);
    return uniqueUrls;
  } catch (error) {
    console.error(`[Recuperação] Erro ao buscar questão ${questaoId}:`, error);
    return [];
  }
}

async function baixarImagem(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[Recuperação] Erro ao baixar imagem ${url}: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`[Recuperação] Exceção ao baixar imagem ${url}:`, error);
    return null;
  }
}

async function uploadParaSupabase(
  supabase: any,
  buffer: Buffer,
  filename: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('imagem_enunciado')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`[Recuperação] Erro no upload ${filename}:`, error);
      return null;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://avlttxzppcywybiaxxzd.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/imagem_enunciado/${data.path}`;
  } catch (error) {
    console.error(`[Recuperação] Exceção no upload ${filename}:`, error);
    return null;
  }
}

export async function recuperarImagensPerdidas(): Promise<{
  total: number;
  sucesso: number;
  falha: number;
  resultados: RecuperacaoResult[];
}> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://avlttxzppcywybiaxxzd.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY não configurada');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const resultados: RecuperacaoResult[] = [];
  let sucesso = 0;
  let falha = 0;

  console.log(`[Recuperação] Iniciando recuperação de ${QUESTOES_AFETADAS.length} questões...`);

  for (const questaoId of QUESTOES_AFETADAS) {
    console.log(`\n[Recuperação] Processando questão ${questaoId}...`);

    try {
      // 1. Extrair URLs das imagens do TecConcursos
      const urlsOriginais = await extrairImagensTecConcursos(questaoId);

      if (urlsOriginais.length === 0) {
        console.log(`[Recuperação] Questão ${questaoId}: nenhuma imagem encontrada`);
        resultados.push({ id: questaoId, success: false, error: 'Nenhuma imagem encontrada no TecConcursos' });
        falha++;
        continue;
      }

      const urlsLocais: string[] = [];

      // 2. Para cada imagem, baixar e fazer upload
      for (let i = 0; i < urlsOriginais.length; i++) {
        const urlOriginal = urlsOriginais[i];
        const filename = `questao_${questaoId}_${i}.jpg`;

        // Baixar imagem
        const buffer = await baixarImagem(urlOriginal);
        if (!buffer) {
          console.error(`[Recuperação] Falha ao baixar imagem ${i} da questão ${questaoId}`);
          continue;
        }

        // Upload para Supabase
        const urlLocal = await uploadParaSupabase(supabase, buffer, filename);
        if (!urlLocal) {
          console.error(`[Recuperação] Falha no upload da imagem ${i} da questão ${questaoId}`);
          continue;
        }

        urlsLocais.push(urlLocal);
        console.log(`[Recuperação] Imagem ${i} da questão ${questaoId} recuperada com sucesso`);
      }

      if (urlsLocais.length === 0) {
        resultados.push({ id: questaoId, success: false, urlsOriginais, error: 'Falha ao processar todas as imagens' });
        falha++;
        continue;
      }

      // 3. Atualizar o banco de dados
      const { error: updateError } = await supabase
        .from('questoes_concurso')
        .update({
          imagens_enunciado: `{${urlsOriginais.join(',')}}`,
          imagens_enunciado_local: `{${urlsLocais.join(',')}}`,
        })
        .eq('id', questaoId);

      if (updateError) {
        console.error(`[Recuperação] Erro ao atualizar questão ${questaoId}:`, updateError);
        resultados.push({ id: questaoId, success: false, urlsOriginais, urlsLocais, error: updateError.message });
        falha++;
        continue;
      }

      console.log(`[Recuperação] Questão ${questaoId} atualizada com sucesso!`);
      resultados.push({ id: questaoId, success: true, urlsOriginais, urlsLocais });
      sucesso++;

      // Pequeno delay para não sobrecarregar o TecConcursos
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`[Recuperação] Erro inesperado na questão ${questaoId}:`, error);
      resultados.push({ id: questaoId, success: false, error: String(error) });
      falha++;
    }
  }

  console.log(`\n[Recuperação] Concluído: ${sucesso} sucesso, ${falha} falhas de ${QUESTOES_AFETADAS.length} questões`);

  return {
    total: QUESTOES_AFETADAS.length,
    sucesso,
    falha,
    resultados,
  };
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  recuperarImagensPerdidas()
    .then(result => {
      console.log('\nResultado final:', JSON.stringify(result, null, 2));
      process.exit(result.falha > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}
