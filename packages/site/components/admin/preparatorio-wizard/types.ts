export interface ProductPricing {
  preco: string;
  precoDesconto: string;
  checkoutUrl: string;
  guruProductId: string;
}

export interface PreparatorioWizardData {
  // Step 1: Informações Gerais
  nome: string;
  descricao: string;
  imagemCapa: string;

  // Step 2: Informações Técnicas
  banca: string;
  bancasAdicionais: string[];
  tipoQuestao: 'certo_errado' | 'multipla_escolha';
  orgao: string;
  logoUrl: string;
  cargo: string;
  nivel: 'fundamental' | 'medio' | 'superior';
  escolaridade: string;
  modalidade: 'presencial' | 'remoto' | 'hibrido';
  regiao: string;

  // Step 3: Detalhes do Concurso
  salario: string;
  cargaHoraria: string;
  vagas: string;
  taxaInscricao: string;
  inscricoesInicio: string;
  inscricoesFim: string;
  dataPrevista: string;
  anoPrevisto: string;

  // Step 4: Vendas - Preços por Produto
  precoPlanejador: string;
  precoPlanejadorDesconto: string;
  checkoutPlanejador: string;
  guruProductIdPlanejador: string;
  preco8Questoes: string;
  preco8QuestoesDesconto: string;
  checkout8Questoes: string;
  guruProductId8Questoes: string;
  precoSimulados: string;
  precoSimuladosDesconto: string;
  checkoutSimulados: string;
  guruProductIdSimulados: string;
  precoRetaFinal: string;
  precoRetaFinalDesconto: string;
  checkoutRetaFinal: string;
  guruProductIdRetaFinal: string;
  precoPlataformaCompleta: string;
  precoPlataformaCompletaDesconto: string;
  checkoutPlataformaCompleta: string;
  guruProductIdPlataformaCompleta: string;
  precoTrilhas: string;
  precoTrilhasDesconto: string;
  checkoutTrilhas: string;
  guruProductIdTrilhas: string;
  descricaoCurta: string;
  descricaoVendas: string;

  // Campos legados
  preco: string;
  precoDesconto: string;
  checkoutUrl: string;
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}
