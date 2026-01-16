import { Agent } from "@mastra/core/agent";
import { vertex } from "../../lib/modelProvider.js";

/**
 * Agente especializado em analisar PDFs de provas anteriores de concursos.
 * Extrai a distribuição de questões por matéria (Raio-X) para uso na geração de simulados fidedignos.
 *
 * Modelo: gemini-2.5-flash (multimodal - suporta PDF nativamente)
 */
export const provaAnalyzerAgent = new Agent({
  name: "provaAnalyzerAgent",
  description: "Agente especializado em analisar PDFs de provas anteriores de concursos e extrair a distribuição de questões por matéria (Raio-X).",
  instructions: `Você é um especialista em análise de provas de concursos públicos brasileiros.

## SUA MISSÃO
Analisar o PDF de uma prova anterior de concurso e extrair o RAIO-X da prova:
- Quantidade total de questões
- Distribuição de questões por matéria/disciplina
- Tipo predominante de questões (múltipla escolha ou certo/errado)
- Banca organizadora (se identificável)

## FORMATO DE SAÍDA (JSON OBRIGATÓRIO)

Retorne APENAS um JSON válido neste formato exato:

{
  "total_questoes": 120,
  "tipo_predominante": "certo_errado",
  "banca_identificada": "CEBRASPE",
  "distribuicao": [
    { "materia": "Língua Portuguesa", "quantidade": 20 },
    { "materia": "Raciocínio Lógico", "quantidade": 10 },
    { "materia": "Noções de Informática", "quantidade": 10 },
    { "materia": "Direito Constitucional", "quantidade": 15 },
    { "materia": "Direito Administrativo", "quantidade": 15 },
    { "materia": "Legislação Específica", "quantidade": 20 },
    { "materia": "Conhecimentos Específicos", "quantidade": 30 }
  ]
}

## REGRAS DE ANÁLISE

### IDENTIFICAÇÃO DO TIPO DE QUESTÃO
- **certo_errado**: Questões com apenas duas opções "Certo" ou "Errado" (típicas do CESPE/CEBRASPE)
- **multipla_escolha**: Questões com 4 ou 5 alternativas (A, B, C, D, E)

### IDENTIFICAÇÃO DA BANCA
Bancas comuns:
- CEBRASPE (antigo CESPE) - questões certo/errado
- FGV - questões de múltipla escolha
- FCC - questões de múltipla escolha
- VUNESP - questões de múltipla escolha
- CONSULPLAN - questões de múltipla escolha
- IADES - questões de múltipla escolha
- IBFC - questões de múltipla escolha

### IDENTIFICAÇÃO DAS MATÉRIAS
- Procure por cabeçalhos ou divisões na prova que indicam a matéria
- Exemplos: "LÍNGUA PORTUGUESA", "CONHECIMENTOS ESPECÍFICOS", "RACIOCÍNIO LÓGICO"
- Conte as questões em cada seção
- Se não houver divisão clara, analise o conteúdo das questões para classificar

### PADRONIZAÇÃO DOS NOMES DAS MATÉRIAS
Use nomes padronizados para as matérias:
- "Língua Portuguesa" (não "Português", "LP", etc.)
- "Raciocínio Lógico" (não "Lógica", "RL", etc.)
- "Noções de Informática" (não "Informática Básica", etc.)
- "Direito Constitucional"
- "Direito Administrativo"
- "Direito Penal"
- "Direito Processual Penal"
- "Legislação Específica"
- "Conhecimentos Específicos"
- "Atualidades" ou "Noções de Atualidades"
- "Ética no Serviço Público"
- "Matemática" ou "Matemática Financeira"
- "Contabilidade" ou "Contabilidade Pública"
- "Administração Pública"
- "Gestão de Pessoas"

## INSTRUÇÕES IMPORTANTES

1. **Conte TODAS as questões** da prova
2. **Identifique CORRETAMENTE a matéria** de cada questão ou bloco de questões
3. **Verifique se a soma** das quantidades na distribuição é igual ao total_questoes
4. **Se a matéria fornecida no contexto for diferente**, tente fazer o match mais próximo
5. **Retorne APENAS o JSON válido**, sem markdown, sem texto adicional, sem explicações
6. **Se não conseguir identificar a banca**, use null para banca_identificada

## CONTEXTO ADICIONAL
Se for fornecida uma lista de matérias do edital, tente fazer o match das matérias identificadas na prova com as matérias do edital. Isso ajuda a manter a consistência entre o Raio-X e o preparatório.

Exemplo: Se o edital tem "LÍNGUA PORTUGUESA" e a prova tem "Português", use "Língua Portuguesa" na distribuição.
`,
  model: vertex("gemini-2.5-flash"),
});

/**
 * Interface para o resultado da análise Raio-X
 */
export interface RaioXDistribuicao {
  materia: string;
  quantidade: number;
  percentual?: number;
}

export interface RaioXResult {
  total_questoes: number;
  tipo_predominante: 'multipla_escolha' | 'certo_errado';
  banca_identificada: string | null;
  distribuicao: RaioXDistribuicao[];
  prova_anterior_url?: string;
  analisado_em?: string;
}

/**
 * Processa o resultado da análise e calcula percentuais
 */
export function processRaioXResult(result: RaioXResult): RaioXResult {
  const total = result.total_questoes || result.distribuicao.reduce((sum, d) => sum + d.quantidade, 0);

  return {
    ...result,
    total_questoes: total,
    distribuicao: result.distribuicao.map(d => ({
      ...d,
      percentual: Math.round((d.quantidade / total) * 100 * 10) / 10, // 1 decimal
    })),
    analisado_em: new Date().toISOString(),
  };
}

/**
 * Faz o match entre matérias da prova e matérias do edital
 */
export function matchMateriasWithEdital(
  raioX: RaioXResult,
  materiasEdital: string[]
): RaioXResult {
  const normalizeMateria = (m: string) =>
    m.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const materiasEditalNormalized = materiasEdital.map(m => ({
    original: m,
    normalized: normalizeMateria(m),
  }));

  const distribuicaoMatched = raioX.distribuicao.map(d => {
    const normalizedProva = normalizeMateria(d.materia);

    // Tentar match exato
    const exactMatch = materiasEditalNormalized.find(
      m => m.normalized === normalizedProva
    );
    if (exactMatch) {
      return { ...d, materia: exactMatch.original };
    }

    // Tentar match parcial (contém)
    const partialMatch = materiasEditalNormalized.find(
      m => m.normalized.includes(normalizedProva) || normalizedProva.includes(m.normalized)
    );
    if (partialMatch) {
      return { ...d, materia: partialMatch.original };
    }

    // Manter original se não encontrar match
    return d;
  });

  return {
    ...raioX,
    distribuicao: distribuicaoMatched,
  };
}
