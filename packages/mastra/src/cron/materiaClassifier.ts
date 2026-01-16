/**
 * Cron Job para Classificação Automática de Matérias
 *
 * Processa questões sem matéria definida, usando IA para classificar
 * baseado no enunciado da questão.
 *
 * Fluxo:
 * 1. Busca questões sem matéria (que não são HTML garbage)
 * 2. Usa IA para classificar cada questão
 * 3. Atualiza a matéria e remove flag de lixo se sucesso
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { vertex } from "../lib/modelProvider.js";
import { MATERIAS_VALIDAS } from "../mastra/agents/materiaClassifierAgent.js";

let isProcessing = false;
let lastRun: Date | null = null;
let stats = {
  processed: 0,
  classified: 0,
  failed: 0,
  skipped: 0,
};

// System prompt do agente de classificação
const SYSTEM_PROMPT = `Você é um especialista em classificação de questões de concursos públicos brasileiros.

## TAREFA
Analisar o enunciado de uma questão e determinar a qual MATÉRIA ela pertence.

## MATÉRIAS VÁLIDAS
Você DEVE escolher uma matéria da lista abaixo. NÃO invente matérias novas.

${MATERIAS_VALIDAS.map((m, i) => `${i + 1}. ${m}`).join("\n")}

## REGRAS DE CLASSIFICAÇÃO

### Direito
- Questões sobre leis, artigos, doutrinas → Use a área específica (Constitucional, Penal, Civil, etc.)
- "Julgue o item" sobre legislação → Identifique a lei mencionada
- CF/1988 → Direito Constitucional
- Código Penal, crimes → Direito Penal
- Contratos, obrigações, família → Direito Civil
- Licitações, servidores públicos → Direito Administrativo
- CLT, trabalhista → Direito do Trabalho

### Administração
- Gestão, planejamento, organização → Administração Geral e Pública
- RH, motivação, liderança → Gestão de Pessoas (ou Administração Geral)
- Materiais, estoque, logística → Administração de Recursos Materiais
- Atendimento ao público → Atendimento
- PMBOK, cronograma, escopo → Gestão de Projetos

### Contabilidade/Finanças
- Balanço, DRE, lançamentos → Contabilidade Geral
- Orçamento público, LOA, LDO → AFO, Direito Financeiro e Contabilidade Pública
- Custos, rateio, ABC → Contabilidade de Custos
- Juros, VPL, TIR → Matemática Financeira

### TI/Informática
- Programação, algoritmos → TI - Desenvolvimento de Sistemas
- SQL, banco de dados → TI - Banco de Dados
- Redes, TCP/IP, protocolos → TI - Redes de Computadores
- Windows, Linux → TI - Sistemas Operacionais
- Criptografia, firewall → TI - Segurança da Informação
- Word, Excel, navegadores → Informática

### Saúde
- Anatomia, fisiologia, doenças gerais → Medicina
- Procedimentos de enfermagem → Enfermagem
- Medicamentos, farmacologia → Farmácia
- Tratamento dentário → Odontologia

### Exatas
- Cálculos, equações, funções → Matemática
- Lógica, proposições, silogismos → Raciocínio Lógico
- Probabilidade, amostragem → Estatística
- Mecânica, termodinâmica, eletricidade → Física
- Elementos, reações → Química e Engenharia Química

### Português
- Gramática, sintaxe, semântica → Língua Portuguesa (Português)
- Interpretação de texto → Língua Portuguesa (Português)
- Redação oficial, ofícios → Redação Oficial

## FORMATO DE RESPOSTA

Retorne APENAS um JSON válido (sem markdown):

{
    "materia": "Nome Exato da Matéria",
    "confianca": 0.95,
    "motivo": "Breve justificativa da classificação"
}

## REGRAS IMPORTANTES

1. **confianca** entre 0 e 1:
   - 0.9-1.0: Classificação óbvia e clara
   - 0.7-0.9: Boa certeza, tema bem identificável
   - 0.5-0.7: Alguma ambiguidade, mas provável
   - < 0.5: Muito ambíguo ou texto sem sentido

2. Se o texto for lixo (HTML, lorem ipsum, sem sentido):
   {
       "materia": null,
       "confianca": 0,
       "motivo": "Texto inválido ou sem sentido"
   }

3. Use EXATAMENTE o nome da matéria da lista. Não abrevie nem modifique.

4. Quando houver dúvida entre duas matérias, escolha a mais específica.`;

/**
 * Processa uma questão e classifica a matéria usando AI SDK diretamente
 */
async function classifyQuestion(
  db: SupabaseClient,
  questaoId: number
): Promise<{ success: boolean; materia?: string; error?: string }> {
  try {
    // Buscar questão
    const { data: questao, error: fetchError } = await db
      .from("questoes_concurso")
      .select("id, enunciado, alternativas")
      .eq("id", questaoId)
      .single();

    if (fetchError || !questao) {
      return { success: false, error: "Questão não encontrada" };
    }

    if (!questao.enunciado || questao.enunciado.length < 30) {
      return { success: false, error: "Enunciado muito curto" };
    }

    // Verificar se é HTML garbage
    if (
      questao.enunciado.includes("ngIf") ||
      questao.enunciado.includes("<!--")
    ) {
      return { success: false, error: "HTML garbage detectado" };
    }

    // Formatar alternativas se existirem
    let alternativasText = "";
    if (questao.alternativas && Array.isArray(questao.alternativas)) {
      alternativasText = questao.alternativas
        .map((alt: any) => `${alt.letter}) ${alt.text}`)
        .join("\n");
    }

    // Prompt para classificação
    const userPrompt = `Classifique a matéria desta questão de concurso:

## ENUNCIADO:
${questao.enunciado}

${alternativasText ? `## ALTERNATIVAS:\n${alternativasText}` : ""}

---
Retorne a classificação em JSON.`;

    // Chamar IA diretamente usando AI SDK
    const model = vertex("gemini-2.0-flash-001");
    const response = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const text = response.text || "";

    // Parse JSON
    const jsonMatch = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: "IA não retornou JSON válido" };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Verificar confiança
    if (!parsed.materia || parsed.confianca < 0.7) {
      return {
        success: false,
        error: `Confiança baixa: ${parsed.confianca} - ${parsed.motivo || ""}`,
      };
    }

    // Validar matéria
    if (!MATERIAS_VALIDAS.includes(parsed.materia)) {
      // Tentar encontrar match aproximado
      const materiaLower = parsed.materia.toLowerCase();
      const match = MATERIAS_VALIDAS.find(
        (m) =>
          m.toLowerCase() === materiaLower ||
          m.toLowerCase().includes(materiaLower) ||
          materiaLower.includes(m.toLowerCase())
      );

      if (!match) {
        return { success: false, error: `Matéria inválida: ${parsed.materia}` };
      }
      parsed.materia = match;
    }

    // Atualizar questão
    const { error: updateError } = await db
      .from("questoes_concurso")
      .update({
        materia: parsed.materia,
        lixo: false, // Remove flag de lixo
        ativo: true, // Ativa a questão
        updated_at: new Date().toISOString(),
      })
      .eq("id", questaoId);

    if (updateError) {
      return { success: false, error: `Erro ao atualizar: ${updateError.message}` };
    }

    return { success: true, materia: parsed.materia };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Processa um lote de questões sem matéria
 */
async function processQueue(
  db: SupabaseClient,
  limit: number = 10
): Promise<{ processed: number; classified: number; failed: number; skipped: number }> {
  const result = { processed: 0, classified: 0, failed: 0, skipped: 0 };

  try {
    // Buscar questões sem matéria que não são HTML garbage
    const { data: questoes, error } = await db
      .from("questoes_concurso")
      .select("id, enunciado")
      .or("materia.is.null,materia.eq.")
      .not("enunciado", "ilike", "%ngIf%")
      .not("enunciado", "ilike", "%<!--%")
      .gt("enunciado", "")
      .order("id", { ascending: true })
      .limit(limit);

    if (error || !questoes || questoes.length === 0) {
      console.log("[MateriaClassifier] Nenhuma questão para processar");
      return result;
    }

    console.log(
      `[MateriaClassifier] Processando ${questoes.length} questões sem matéria`
    );

    for (const questao of questoes) {
      result.processed++;

      // Skip se enunciado for muito curto
      if (!questao.enunciado || questao.enunciado.length < 50) {
        result.skipped++;
        console.log(`[MateriaClassifier] Questão ${questao.id}: Enunciado muito curto, pulando`);
        continue;
      }

      // Classificar
      const classification = await classifyQuestion(db, questao.id);

      if (classification.success) {
        result.classified++;
        stats.classified++;
        console.log(
          `[MateriaClassifier] Questão ${questao.id}: ${classification.materia}`
        );
      } else {
        result.failed++;
        stats.failed++;
        console.log(
          `[MateriaClassifier] Questão ${questao.id}: Falha - ${classification.error}`
        );
      }

      // Rate limit: 500ms entre requisições (Vertex AI suporta alto throughput)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return result;
  } catch (error) {
    console.error("[MateriaClassifier] Erro ao processar fila:", error);
    return result;
  }
}

/**
 * Executa um ciclo de classificação
 */
export async function runMateriaClassification(
  dbUrl: string,
  dbKey: string,
  options: { limit?: number } = {}
): Promise<{
  success: boolean;
  processed: number;
  classified: number;
  failed: number;
  skipped: number;
}> {
  if (isProcessing) {
    console.log("[MateriaClassifier] Já em execução, ignorando...");
    return { success: false, processed: 0, classified: 0, failed: 0, skipped: 0 };
  }

  isProcessing = true;
  lastRun = new Date();

  try {
    const db = createClient(dbUrl, dbKey);
    const result = await processQueue(db, options.limit || 10);

    console.log(
      `[MateriaClassifier] Ciclo completo: ${result.classified} classificadas, ${result.failed} falhas, ${result.skipped} puladas`
    );

    return { success: true, ...result };
  } catch (error) {
    console.error("[MateriaClassifier] Erro no ciclo:", error);
    return { success: false, processed: 0, classified: 0, failed: 0, skipped: 0 };
  } finally {
    isProcessing = false;
  }
}

/**
 * Obtém status do classificador
 */
export function getMateriaClassifierStatus(): {
  isProcessing: boolean;
  lastRun: Date | null;
  stats: typeof stats;
} {
  return {
    isProcessing,
    lastRun,
    stats: { ...stats },
  };
}

/**
 * Inicia o cron job de classificação de matérias
 * Executa a cada 5 minutos
 */
export function startMateriaClassifierCron(
  dbUrl: string,
  dbKey: string,
  intervalMs: number = 5 * 60 * 1000,
  batchSize: number = 10
): NodeJS.Timeout {
  console.log(
    `[MateriaClassifier] Iniciando cron job (intervalo: ${intervalMs / 1000}s, lote: ${batchSize})`
  );

  // Primeira execução após 1 minuto
  setTimeout(() => {
    runMateriaClassification(dbUrl, dbKey, { limit: batchSize });
  }, 60 * 1000);

  // Execuções periódicas
  return setInterval(() => {
    runMateriaClassification(dbUrl, dbKey, { limit: batchSize });
  }, intervalMs);
}
