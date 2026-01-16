/**
 * Agente de Classificação de Matéria
 *
 * Este agente usa IA para analisar o enunciado de uma questão de concurso
 * e determinar a qual matéria ela pertence.
 *
 * Usado para classificar questões que foram importadas sem a matéria definida.
 */

import { Agent } from "@mastra/core/agent";
import { vertex } from "../../lib/modelProvider.js";

// Lista de matérias válidas no sistema (ordenadas por frequência)
const MATERIAS_VALIDAS = [
  "Língua Portuguesa (Português)",
  "Direito Constitucional",
  "AFO, Direito Financeiro e Contabilidade Pública",
  "Estatística",
  "Engenharia Elétrica e Eletrônica",
  "Direito Administrativo",
  "Direito Penal",
  "Arquivologia",
  "Medicina",
  "Criminalística e Medicina Legal",
  "Administração Geral e Pública",
  "Biologia e Biomedicina",
  "Direito Processual Penal",
  "Engenharia Mecânica",
  "Engenharia Civil e Auditoria de Obras",
  "Direito Civil",
  "Enfermagem",
  "Odontologia",
  "Matemática",
  "Física",
  "Gestão de Projetos",
  "Contabilidade Geral",
  "História",
  "Farmácia",
  "Legislação Penal e Processual Penal Especial",
  "Legislação Militar",
  "Língua Inglesa (Inglês)",
  "Comunicação Social",
  "Filosofia e Teologia",
  "Informática",
  "Direito Processual Civil",
  "Direitos Humanos",
  "Engenharia Cartográfica",
  "Atualidades e Conhecimentos Gerais",
  "Química e Engenharia Química",
  "Geografia",
  "Segurança Pública e Legislação Policial",
  "Psicologia",
  "Artes e Música",
  "Administração Geral",
  "Direito Tributário",
  "Direito Ambiental",
  "Legislação de Trânsito e Transportes",
  "Direito Eleitoral",
  "Redação Oficial",
  "Fisioterapia",
  "Economia e Finanças Públicas",
  "Direito Marítimo, Portuário e Aeronáutico",
  "Educação Física",
  "Administração Pública",
  "Desenho Técnico e Artes Gráficas",
  "Legislação e Ética Profissional",
  "Direito Penal Militar",
  "Administração de Recursos Materiais",
  "Criminologia",
  "Direito Notarial e Registral",
  "Direito Empresarial (Comercial)",
  "Arquitetura",
  "Nutrição, Gastronomia e Engenharia de Alimentos",
  "Direito Previdenciário",
  "Ciências Sociais",
  "Raciocínio Lógico",
  "Pedagogia",
  "Contabilidade de Custos",
  "TI - Desenvolvimento de Sistemas",
  "Meteorologia e Astronomia",
  "TI - Segurança da Informação",
  "Direito da Criança e do Adolescente",
  "Legislação Civil e Processual Civil Especial",
  "Ciências Políticas",
  "Biblioteconomia",
  "Direito Internacional Público e Privado",
  "Engenharia Ambiental, Florestal e Sanitária",
  "Direito Processual Penal Militar",
  "Radiologia",
  "Direito do Consumidor",
  "Auditoria Privada",
  "Geologia e Engenharia de Minas",
  "Fonoaudiologia",
  "TI - Redes de Computadores",
  "Análise das Demonstrações Contábeis",
  "Direito Sanitário e Saúde",
  "Engenharia Naval",
  "Auditoria Governamental e Controle",
  "Direito do Trabalho",
  "Oceanografia",
  "Gestão de Projetos (PMBOK)",
  "TI - Banco de Dados",
  "Língua Espanhola (Espanhol)",
  "Ética no Serviço Público",
  "Direito Educacional",
  "Veterinária e Zootecnia",
  "Matemática Financeira",
  "TI - Gestão e Governança de TI",
  "Direito Processual do Trabalho",
  "Serviço Social",
  "TI - Engenharia de Software",
  "Finanças e Conhecimentos Bancários",
  "TI - Sistemas Operacionais",
  "Segurança e Saúde no Trabalho (SST)",
  "Direito Digital",
  "TI - Organização e Arquitetura dos Computadores",
  "Literatura Brasileira e Estrangeira",
  "Arqueologia",
  "Antropologia",
  "Direito Urbanístico",
  "Direito Agrário",
  "Engenharia de Produção",
  "Ciências Atuariais (Atuária)",
  "Direito Econômico",
  "Gestão de Pessoas",
  "Atendimento",
];

export const materiaClassifierAgent = new Agent({
  name: "MateriaClassifierAgent",
  instructions: `Você é um especialista em classificação de questões de concursos públicos brasileiros.

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

4. Quando houver dúvida entre duas matérias, escolha a mais específica.`,
  model: vertex("gemini-2.5-pro"),
});

export { MATERIAS_VALIDAS };
export default materiaClassifierAgent;
