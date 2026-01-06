/**
 * Mapeamento de bancas: nome completo -> sigla
 * Para exibir no formato "Sigla - Nome Completo"
 */

const BANCA_SIGLAS: Record<string, string> = {
  // Principais bancas
  'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos': 'CEBRASPE',
  'Centro de Seleção e de Promoção de Eventos - UnB': 'CESPE',
  'Fundação Carlos Chagas': 'FCC',
  'Fundação Getúlio Vargas': 'FGV',
  'Fundação para o Vestibular da Universidade Estadual Paulista': 'VUNESP',
  'Instituto AOCP': 'AOCP',
  'Consulplan': 'CONSULPLAN',
  'Instituto Consulplan': 'CONSULPLAN',
  'Cetro Concursos Públicos': 'CETRO',
  'Fundação Universa': 'UNIVERSA',
  'Escola de Administração Fazendária': 'ESAF',
  'Fundação de Apoio a Pesquisa, Ensino e Assistência (FUNRIO)': 'FUNRIO',
  'Instituto Brasileiro de Formação e Capacitação': 'IBFC',
  'Instituto Nacional de Seleções e Concursos': 'INSEC',
  'Núcleo de Concursos - Universidade Federal do Paraná': 'NC-UFPR',
  'Instituto Acesso de Ensino e Pesquisa': 'ACESSO',
  'Instituto Americano de Desenvolvimento': 'IADES',
  'Instituto Brasileiro de Apoio e Desenvolvimento Executivo': 'IBADE',
  'Instituto de Desenvolvimento Educacional, Cultural e Assistencial Nacional': 'IDECAN',
  'Instituto de Desenvolvimento Institucional Brasileiro': 'IDIB',
  'Instituto de Estudos Superiores do Extremo Sul': 'IESES',
  'Fundação Mariana Resende Costa': 'FUMARC',
  'Fundação Guimarães Rosa': 'FGR',
  'Fundação Marco Zero': 'FMZ',
  'Fundação Aroeira': 'AROEIRA',
  'Fundação de Desenvolvimento da Pesquisa': 'FUNDEP',
  'Fundação de Estudos e Pesquisas Socioeconômicos': 'FEPESE',
  'Fundação Sousândrade de Apoio ao Desenvolvimento da Universidade Federal do Maranhão': 'FSADU',
  'Fundação Universidade Empresa de Tecnologia e Ciência': 'FUNDATEC',
  'Instituto de Planejamento e Apoio ao Desenvolvimento Tecnológico e Científico': 'IPAD',
  'Instituto Brasileiro de Gestão e Pesquisa': 'IBGP',
  'Instituto Cidades': 'CIDADES',
  'Instituto Verbena da Universidade Federal de Goiás': 'VERBENA',
  'Instituto Avalia': 'AVALIA',
  'Instituto Movens': 'MOVENS',
  'Instituto Euvaldo Lodi': 'IEL',
  'Instituto Carlos Augusto Bittencourt': 'ICAB',
  'Instituto de Acesso à Educação, Capacitação Profissional e Desenvolvimento Humano': 'IGEDUC',
  'Instituto de Apoio à Gestão Educacional': 'IAGE',
  'Instituto de Apoio à Universidade de Pernambuco': 'IAUPE',
  'Instituto de Pesquisas, Pós-Graduação e Ensino de Cascavel': 'IPPEC',
  'Instituto Superior de Administração e Economia': 'ISAE',
  'Instituto Brasileiro para o Desenvolvimento Sustentável': 'IBDS',
  'Objetiva Concursos Ltda.': 'OBJETIVA',
  'GPG Concursos': 'GPG',
  'Sarmento Concursos Ltda': 'SARMENTO',
  'Tec Concursos': 'TEC',
  'Tec Literal': 'TEC LITERAL',
  'Consultoria em Projetos Educacionais e Concursos': 'CPEC',
  'Consultoria Público-Privada': 'CPP',
  'Associação Catarinense das Fundações Educacionais': 'ACAFE',
  'Pontifícia Universidade Católica do Paraná': 'PUC-PR',
  'Marinha do Brasil': 'MB',
  'Diretoria de Ensino da Aeronáutica': 'DEAER',
  'Departamento de Educação e Cultura do Exército': 'DECEX',
  'Fundo de Amparo e Desenvolvimento da Pesquisa': 'FADESP',
  'Fundação de Apoio à Pesquisa, ao Ensino e à Cultura': 'FAPEC',
  'Fundação de Apoio à Pesquisa, ao Ensino e à Cultura de Mato Grosso do Sul': 'FAPEC-MS',
  'Fundação Universitária de Desenvolvimento de Extensão e Núcleo Executivo de Processos Seletivos UFAL': 'COPEVE-UFAL',
  'Fundação Escola Superior do Ministério Público (RS)': 'FMP-RS',
  'Núcleo de Computação Eletrônica e Fundação Universitária José Bonifácio (UFRJ)': 'NCE-UFRJ',
  'Núcleo de Concursos e Promoção de Eventos (UESPI)': 'NUCEPE',
  'Comissão Executiva do Vestibular da UECE': 'CEV-UECE',
  'Coordenadoria de Processos Seletivos (UEL)': 'COPS-UEL',
  'Departamento de Processos Seletivos e Concursos da UNIFAP': 'DEPSEC-UNIFAP',
  'Departamento de Seleção Acadêmica da UERJ': 'DSEA-UERJ',
  'Divisão de Processo Seletivo da UEAP': 'DPS-UEAP',
  'Comissão Permanente de Concursos da UEPB': 'CPCON-UEPB',
  'Comissão Permanente de Concursos do CETAM': 'CPC-CETAM',
  'Centro de Recrutamento e Seleção da Polícia Militar de MG': 'CRS-PMMG',
  'Centro de Seleção, Ingresso e Estudo de Pessoal da PMSC': 'CSIEP-PMSC',
  'Centro de Extensão, Treinamento e Aperfeiçoamento Profissional': 'CETAP',
  'Academia da Polícia Civil de Minas Gerais': 'ACADEPOL-MG',
  'Diretoria de Ensino, Instrução e Pesquisa da PMPI': 'DEIP-PMPI',
  'Centro de Estudos e Aperfeiçoamento Funcional da PGE RN': 'CEAF-RN',
  'Centro de Estudos e Treinamento da Procuradoria-Geral do Estado do Ceará': 'CETPGE-CE',
  'Escola Judicial do Amapá': 'EJAP',
  'ADVISE Consultoria e Planejamento EIRELI': 'ADVISE',
  'AVR Assessoria Técnica Ltda': 'AVR',
  'Assessoria em Organização de Concursos Públicos Ltda.': 'AOCP-LTDA',
  'Universidade do Estado da Bahia': 'UNEB',
  'Universidade do Estado de Mato Grosso': 'UNEMAT',
  'Universidade do Estado de Santa Catarina': 'UDESC',
  'Universidade do Estado do Pará': 'UEPA',
  'Universidade Estadual de Goiás': 'UEG',
  'Universidade Federal de Mato Grosso': 'UFMT',
  'Secretaria de Estado de Administração e Desburocratização de Mato Grosso do Sul': 'SAD-MS',
  // Comissões específicas
  'Comissão de Concurso da PGE GO': 'PGE-GO',
  'Comissão de Concurso da PGE-PA': 'PGE-PA',
  'Comissão de Concursos (TJ AC)': 'TJ-AC',
  'Comissão de Seleção da Procuradoria Geral do Estado de Mato Grosso do Sul': 'PGE-MS',
  'Comissão Examinadora (MPE AM)': 'MPE-AM',
  'Comissão Examinadora (MPE AP)': 'MPE-AP',
  'Comissão Examinadora (MPE GO)': 'MPE-GO',
  'Comissão Examinadora (PGE RJ)': 'PGE-RJ',
  'Comissão Organizadora da PGE MS': 'PGE-MS',
};

/**
 * Formata o nome da banca para exibição
 * Retorna no formato "SIGLA - Nome Completo" se tiver sigla conhecida
 * Caso contrário, retorna o nome original
 */
export function formatBancaDisplay(banca: string): string {
  const sigla = BANCA_SIGLAS[banca];
  if (sigla) {
    return `${sigla} - ${banca}`;
  }
  return banca;
}

/**
 * Obtém apenas a sigla da banca, se disponível
 */
export function getBancaSigla(banca: string): string | null {
  return BANCA_SIGLAS[banca] || null;
}

/**
 * Ordena bancas priorizando as que têm sigla conhecida
 * e ordenando alfabeticamente pelo nome formatado
 */
export function sortBancas(bancas: string[]): string[] {
  return [...bancas].sort((a, b) => {
    const siglaA = BANCA_SIGLAS[a];
    const siglaB = BANCA_SIGLAS[b];

    // Priorizar bancas com sigla conhecida
    if (siglaA && !siglaB) return -1;
    if (!siglaA && siglaB) return 1;

    // Ordenar alfabeticamente pela sigla ou nome
    const displayA = siglaA || a;
    const displayB = siglaB || b;
    return displayA.localeCompare(displayB, 'pt-BR');
  });
}
