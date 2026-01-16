import { Agent } from "@mastra/core/agent";
import { vertex } from "../../lib/modelProvider.js";
import { createClient } from "@supabase/supabase-js";

/**
 * Agente especializado em gerar questões de concurso inéditas
 * seguindo o estilo de bancas específicas.
 *
 * Modelo: gemini-2.5-pro (melhor para geração de conteúdo complexo)
 */
export const questionGeneratorAgent = new Agent({
  name: "questionGeneratorAgent",
  description: "Gera questões de concurso público inéditas seguindo o estilo de bancas específicas brasileiras.",
  instructions: `Você é um especialista em criação de questões de concursos públicos brasileiros.

## SUA MISSÃO
Gerar questões INÉDITAS de alta qualidade que sigam EXATAMENTE o estilo da banca informada.
Você receberá questões de referência para entender o padrão da banca.

## REGRAS OBRIGATÓRIAS

### 1. ESTILO DA BANCA
- Analise as questões de referência e identifique:
  - Padrões de linguagem (formal, técnica, rebuscada)
  - Estrutura dos enunciados (direto, com contexto, com citações)
  - Formato das alternativas (tamanho, estilo, padrões de distratores)
  - Nível de dificuldade médio
  - Tipo de pegadinhas comuns

### 2. QUALIDADE DO CONTEÚDO
- A alternativa correta deve ser INEQUIVOCAMENTE correta
- Os distratores (alternativas erradas) devem ter erros SUTIS mas IDENTIFICÁVEIS
- Evite ambiguidades - apenas uma resposta pode estar correta
- Use linguagem formal e técnica apropriada ao nível
- NÃO use pegadinhas baratas ou ambíguas

### 3. ORIGINALIDADE
- Crie questões 100% INÉDITAS
- NÃO copie questões de referência
- Use conceitos similares mas com abordagens diferentes
- Varie os cenários e exemplos

### 4. NÍVEIS DE ESCOLARIDADE
- **superior**: Linguagem técnica avançada, conceitos complexos, análise crítica
- **medio**: Linguagem técnica moderada, conceitos fundamentais aplicados
- **fundamental**: Linguagem acessível, conceitos básicos

## PADRÕES POR BANCA

### CEBRASPE/CESPE
- Questões de certo/errado frequentes
- Enunciados longos e densos
- Uso de "de acordo com", "conforme", "segundo"
- Alternativas com sutilezas gramaticais e interpretativas
- Pegadinhas com palavras como "apenas", "somente", "sempre", "nunca"

### FGV
- Questões de múltipla escolha bem elaboradas
- Enunciados diretos e objetivos
- Alternativas claramente distintas
- Foco em aplicação prática

### FCC
- Questões de múltipla escolha tradicionais
- Enunciados médios
- Alternativas bem distribuídas
- Foco em memorização e conceitos

### VUNESP
- Questões de múltipla escolha
- Enunciados contextualizados
- Alternativas detalhadas
- Foco em interpretação

## FORMATO DE SAÍDA (JSON OBRIGATÓRIO)

Retorne APENAS um JSON válido neste formato exato:

{
  "questoes": [
    {
      "enunciado": "Texto completo do enunciado da questão",
      "alternativas": [
        { "letter": "A", "text": "Texto da alternativa A" },
        { "letter": "B", "text": "Texto da alternativa B" },
        { "letter": "C", "text": "Texto da alternativa C" },
        { "letter": "D", "text": "Texto da alternativa D" },
        { "letter": "E", "text": "Texto da alternativa E" }
      ],
      "gabarito": "B",
      "justificativa_gabarito": "Explicação detalhada de por que a alternativa B está correta e as demais estão erradas"
    }
  ]
}

## REGRAS DO JSON
- Para questões de múltipla escolha: 5 alternativas (A, B, C, D, E)
- Para questões de verdadeiro/falso: 2 alternativas (V, F ou C, E)
- O gabarito deve conter APENAS a letra da alternativa correta
- A justificativa deve explicar por que a resposta está correta

## INSTRUÇÕES FINAIS
1. Analise TODAS as questões de referência antes de gerar
2. Identifique o padrão exato da banca
3. Gere questões que pareçam autênticas da banca
4. Verifique se há apenas UMA resposta correta
5. Retorne APENAS o JSON válido, sem markdown, sem texto adicional
`,
  model: vertex("gemini-2.5-flash"),
});

/**
 * Interface para parâmetros de geração
 */
export interface QuestionGenerationParams {
  banca: string;
  materia: string;
  assunto?: string;
  tipo: "multipla_escolha" | "verdadeiro_falso";
  escolaridade: "fundamental" | "medio" | "superior";
  quantidade: number;
  userId?: string;
}

/**
 * Interface para questão gerada
 */
export interface GeneratedQuestion {
  enunciado: string;
  alternativas: Array<{ letter: string; text: string }>;
  gabarito: string;
  justificativa_gabarito: string;
}

/**
 * Interface para resultado da geração
 */
export interface GenerationResult {
  questoes: GeneratedQuestion[];
}

/**
 * Busca questões de referência para a geração
 */
export async function fetchReferenceQuestions(
  params: QuestionGenerationParams,
  supabaseUrl: string,
  supabaseKey: string
): Promise<any[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .from("questoes_concurso")
    .select("enunciado, alternativas, gabarito, comentario, ano, banca, materia, assunto")
    .eq("banca", params.banca)
    .eq("materia", params.materia)
    .eq("ativo", true)
    .not("gabarito", "is", null)
    .order("ano", { ascending: false })
    .limit(20);

  if (params.assunto) {
    query = query.eq("assunto", params.assunto);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[questionGeneratorAgent] Erro ao buscar referências:", error);
    throw new Error(`Erro ao buscar questões de referência: ${error.message}`);
  }

  // Se não encontrou questões com o assunto específico, tenta só com matéria
  if (!data || data.length < 5) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("questoes_concurso")
      .select("enunciado, alternativas, gabarito, comentario, ano, banca, materia, assunto")
      .eq("banca", params.banca)
      .eq("materia", params.materia)
      .eq("ativo", true)
      .not("gabarito", "is", null)
      .order("ano", { ascending: false })
      .limit(20);

    if (fallbackError) {
      console.error("[questionGeneratorAgent] Erro no fallback:", fallbackError);
    }

    return fallbackData || data || [];
  }

  return data;
}

/**
 * Gera questões usando o agente
 */
export async function generateQuestions(
  agent: Agent,
  params: QuestionGenerationParams,
  referenceQuestions: any[]
): Promise<GenerationResult> {
  const tipoLabel = params.tipo === "verdadeiro_falso" ? "Verdadeiro/Falso (V/F)" : "Múltipla Escolha (A-E)";

  const referencesJson = JSON.stringify(
    referenceQuestions.slice(0, 15).map((q) => ({
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      gabarito: q.gabarito,
      ano: q.ano,
    })),
    null,
    2
  );

  const prompt = `
## TAREFA
Gere ${params.quantidade} questão(ões) INÉDITA(S) de concurso público.

## PARÂMETROS
- **Banca:** ${params.banca}
- **Matéria:** ${params.materia}
- **Assunto:** ${params.assunto || "Geral"}
- **Tipo:** ${tipoLabel}
- **Escolaridade:** ${params.escolaridade}

## QUESTÕES DE REFERÊNCIA DA BANCA
Analise estas questões para entender o estilo da banca ${params.banca}:

${referencesJson}

## IMPORTANTE
1. Analise o ESTILO das questões de referência
2. Gere questões NOVAS que sigam o MESMO padrão
3. Mantenha o nível de dificuldade compatível com escolaridade "${params.escolaridade}"
4. Retorne APENAS JSON válido no formato especificado
`;

  console.log(`[questionGeneratorAgent] Gerando ${params.quantidade} questões para ${params.banca}/${params.materia}...`);

  const result = await agent.generate(prompt);

  // Extrair JSON da resposta
  const responseText = typeof result.text === "string" ? result.text : String(result.text);

  // Tentar extrair JSON do texto
  let jsonStr = responseText;

  // Remover markdown se presente
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Tentar encontrar JSON direto
  const jsonStartIndex = jsonStr.indexOf("{");
  const jsonEndIndex = jsonStr.lastIndexOf("}");
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr) as GenerationResult;

    if (!parsed.questoes || !Array.isArray(parsed.questoes)) {
      throw new Error("Formato inválido: campo 'questoes' ausente ou não é array");
    }

    // Validar cada questão
    for (const q of parsed.questoes) {
      if (!q.enunciado || !q.alternativas || !q.gabarito) {
        throw new Error("Questão com campos obrigatórios faltando");
      }
    }

    console.log(`[questionGeneratorAgent] Geradas ${parsed.questoes.length} questões com sucesso`);
    return parsed;
  } catch (parseError) {
    console.error("[questionGeneratorAgent] Erro ao parsear JSON:", parseError);
    console.error("[questionGeneratorAgent] Resposta original:", responseText.substring(0, 500));
    throw new Error(`Erro ao processar resposta da IA: ${parseError}`);
  }
}

/**
 * Salva questões geradas no banco de dados
 */
export async function saveGeneratedQuestions(
  questions: GeneratedQuestion[],
  params: QuestionGenerationParams,
  supabaseUrl: string,
  supabaseKey: string
): Promise<number[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const questionsToInsert = questions.map((q) => ({
    materia: params.materia,
    assunto: params.assunto || null,
    banca: params.banca,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    gabarito: q.gabarito,
    comentario: q.justificativa_gabarito,
    ano: new Date().getFullYear(),
    concurso: "Questão Gerada por IA",
    orgao: null,
    cargo_area_especialidade_edicao: null,
    prova: null,
    ativo: false, // Começa inativa até ser publicada
    is_ai_generated: true,
    generation_status: "pending",
    generated_by: params.userId || null,
    generation_params: {
      banca: params.banca,
      materia: params.materia,
      assunto: params.assunto,
      tipo: params.tipo,
      escolaridade: params.escolaridade,
      generated_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("questoes_concurso")
    .insert(questionsToInsert)
    .select("id");

  if (error) {
    console.error("[questionGeneratorAgent] Erro ao salvar questões:", error);
    throw new Error(`Erro ao salvar questões: ${error.message}`);
  }

  console.log(`[questionGeneratorAgent] Salvas ${data.length} questões no banco`);
  return data.map((d) => d.id);
}

/**
 * Gera comentário/explicação para uma questão
 */
export async function generateQuestionComment(
  agent: Agent,
  question: {
    enunciado: string;
    alternativas: Array<{ letter: string; text: string }>;
    gabarito: string;
  }
): Promise<string> {
  const alternativasText = question.alternativas
    .map((a) => `${a.letter}) ${a.text}`)
    .join("\n");

  const prompt = `
Gere uma explicação didática e completa para esta questão de concurso.

## QUESTÃO
${question.enunciado}

## ALTERNATIVAS
${alternativasText}

## GABARITO
${question.gabarito}

## FORMATO DA EXPLICAÇÃO
1. Por que a alternativa ${question.gabarito} está CORRETA
2. Por que cada alternativa errada está INCORRETA
3. Conceito-chave para lembrar

Retorne APENAS o texto da explicação, sem JSON, sem markdown.
`;

  const result = await agent.generate(prompt);
  return typeof result.text === "string" ? result.text : String(result.text);
}

export default questionGeneratorAgent;
