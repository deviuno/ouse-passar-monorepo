// Estrutura de dados do Planejamento PRF
export interface Missao {
  numero: string;
  materia?: string;
  assunto?: string;
  instrucoes?: string;
  tema?: string;
  acao?: string;
  extra?: string[];
  obs?: string;
}

export interface Rodada {
  numero: number;
  titulo: string;
  missoes: Missao[];
  nota?: string;
}

export const planejamentoPRF: Rodada[] = [
  {
    numero: 1,
    titulo: "1a RODADA (Missões 1 a 10)",
    missoes: [
      {
        numero: "1",
        materia: "Direito Constitucional",
        assunto: "Direitos e deveres individuais e coletivos",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do artigo 5o da Constituição Federal"
      },
      {
        numero: "2",
        materia: "Português",
        assunto: "5.1 Emprego das classes de palavras. 5.2 Relacoes de coordenacao entre oracoes e entre termos da oracao. 5.3 Relacoes de subordinacao entre oracoes e entre termos da oracao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "3",
        materia: "Informática",
        assunto: "Conceito de internet e intranet",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "4",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Disposicoes preliminares. Vias e Velocidades",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 1 ao 4 e 60 ao 63 do CTB."
      },
      {
        numero: "5",
        materia: "Raciocínio Lógico",
        assunto: "Teoria de Conjuntos",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "6",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Normas Gerais de Circulacao e Conduta. Da conducao de veiculos por motoristas profissionais",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 26 ao 67-E do CTB."
      },
      {
        numero: "7",
        materia: "Direito Constitucional",
        assunto: "Direitos sociais",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do artigo 6o ao 11o da Constituição Federal"
      },
      {
        numero: "8",
        tema: "REVISAO OUSE PASSAR"
      },
      {
        numero: "9",
        acao: "APLICAR AS TECNICAS OUSE PASSAR"
      },
      {
        numero: "10",
        acao: "SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 2,
    titulo: "2a RODADA (Missões 11 a 20)",
    missoes: [
      {
        numero: "11",
        materia: "Direito Constitucional",
        assunto: "Nacionalidade",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura dos artigos 12o e 13o da Constituição Federal"
      },
      {
        numero: "12",
        materia: "Informática",
        assunto: "Conceitos e modos de utilizacao de tecnologias, ferramentas, aplicativos e procedimentos associados a internet/intranet. 2.1 Ferramentas e aplicativos comerciais de navegacao, de correio eletronico, de grupos de discussao, de busca, de pesquisa, de redes sociais e ferramentas colaborativas.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "13",
        materia: "Português",
        assunto: "Dominio da ortografia oficial.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "14",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Sistema Nacional de Transito",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 5o ao 25-A do CTB."
      },
      {
        numero: "15",
        materia: "Raciocínio Lógico",
        assunto: "Porcentagem",
        instrucoes: "Estudar a teoria pontual e resolver 44 questões"
      },
      {
        numero: "16",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Pedestres e Condutores de Veiculo nao Motorizados",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 68 ao 71 do CTB."
      },
      {
        numero: "17",
        materia: "Direito Constitucional",
        assunto: "3 Poder Executivo. 3.1 Forma e sistema de governo. 3.2 Chefia de Estado e chefia de governo. 3.3 Atribuicoes e responsabilidades do presidente da Republica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do artigo 76o ao 86o da Constituição Federal"
      },
      {
        numero: "18",
        tema: "REVISAO OUSE PASSAR e APLICAR AS TECNICAS OUSE PASSAR"
      },
      {
        numero: "19",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "20",
        acao: "SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 3,
    titulo: "3a RODADA (Missões 21 a 30)",
    missoes: [
      {
        numero: "21",
        materia: "Direito Constitucional",
        assunto: "Direitos Politicos e Partidos Politicos",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do artigo 14o ao 17o da Constituição Federal"
      },
      {
        numero: "22",
        materia: "Raciocínio Lógico",
        assunto: "Taxas de Variacao de grandeza. Razao e Proporcao com aplicacoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "23",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Cidadao. Educacao para o Transito.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 72 ao 79 do CTB."
      },
      {
        numero: "24",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Sinalizacao de Transito + Res. 160",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 80 ao 90 do CTB."
      },
      {
        numero: "25",
        materia: "Português",
        assunto: "Dominio dos mecanismos de coesao textual. Emprego de elementos de referenciacao, substituicao e repeticao, de conectores e de outros elementos de sequenciacao textual. Emprego de tempos e modos verbais.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "26",
        materia: "Informática",
        assunto: "Nocoes de sistema operacional (ambiente Windows).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "27",
        materia: "Direito Constitucional",
        assunto: "3.4 Da Uniao: bens e competencias (arts. 20 a 24 da CF).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura artigo 20 a 24 da Constituição Federal"
      },
      {
        numero: "28",
        tema: "REVISAO OUSE PASSAR"
      },
      {
        numero: "29",
        acao: "APLICAR AS TECNICAS OUSE PASSAR"
      },
      {
        numero: "30",
        acao: "Iniciante: SIMULADO COM ASSUNTOS DA RODADA / Avancado: SIMULADO COMPLETO / Correcao do Simulado"
      }
    ]
  },
  {
    numero: 4,
    titulo: "4a RODADA (Missões 31 a 41)",
    nota: "A numeracao das missoes segue a ordem de apresentacao do conteudo para manter a logica de estudo.",
    missoes: [
      {
        numero: "31",
        materia: "Raciocínio Lógico",
        assunto: "Regra de Tres Simples e Composta.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "32",
        materia: "Legislação de Trânsito",
        assunto: "Veiculos. Registro de Veiculos. Licenciamento.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 96 ao 117 e Art. 120 ao 135 do CTB."
      },
      {
        numero: "33",
        materia: "Direito Constitucional",
        assunto: "Ordem social. 5.1 Base e objetivos da ordem social. 5.2 Seguridade social. 5.3 Meio ambiente. 5.4 Familia, crianca, adolescente, idoso, indio.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do artigo 193 ao 204 // artigo 225 ao 232 da Constituição Federal"
      },
      {
        numero: "34",
        tema: "REVISAO OUSE PASSAR"
      },
      {
        numero: "35",
        materia: "Direito Constitucional",
        assunto: "Defesa do Estado e das instituicoes democraticas. 4.1 Forcas Armadas (art. 142, CF). 4.2 Seguranca publica (art. 144 da CF).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do artigo 142 e 144 da Constituição Federal."
      },
      {
        numero: "36",
        materia: "Informática",
        assunto: "Acesso a distancia a computadores, transferencia de informacao e arquivos, aplicativos de audio, video e multimidia",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "37",
        materia: "Português",
        assunto: "Compreensao e interpretacao de textos de generos variados e Reconhecimento de tipos e generos textuais.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "38",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Engenharia de Trafego, Operacao, Fiscalizacao e Policiamento Ostensivo de Transito.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 91 ao 95 do CTB."
      },
      {
        numero: "39",
        acao: "APLICAR AS TECNICAS OUSE PASSAR"
      },
      {
        numero: "40",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "41",
        acao: "SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 5,
    titulo: "5a RODADA (Missões 42 a 51)",
    missoes: [
      {
        numero: "42",
        materia: "Direito Constitucional",
        assunto: "1 Poder constituinte. 1.1 Fundamentos do poder constituinte. 1.2 Poder constituinte originario e derivado. 1.3 Reforma e revisao constitucionais. 1.4 Limitacao do poder de revisao. 1.5 Emendas a Constituição.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "43",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Veiculos em Circulacao Internacional + Resolução CONTRAN No 933 DE 28/03/2022 (revoga resolucao 360)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 118 e 119 do CTB + Resolução citada."
      },
      {
        numero: "44",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)"
      },
      {
        numero: "45",
        materia: "Português",
        assunto: "5.4 Emprego dos sinais de pontuacao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "46",
        materia: "Informática",
        assunto: "Transformacao digital. 3.1 Internet das coisas (IoT). 3.2 Big data. 3.3 Inteligencia artificial.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "47",
        materia: "Raciocínio Lógico",
        assunto: "Sequencias numericas. Progressao aritmetica e Progressao Geometrica",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "48",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Conducao de Escolares. Conducao de Moto-frete.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 136 ao 139-B do CTB."
      },
      {
        numero: "49",
        tema: "Revisao: Parte 2 - Direito Constitucional (4 missoes)",
        materia: "Direito Administrativo",
        assunto: "1. Nocoes de organizacao administrativa. 1.1 Centralizacao, descentralizacao, concentracao e desconcentracao. 1.2 Administracao direta e indireta. 1.3 Autarquias, fundacoes, empresas publicas e sociedades de economia mista.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "50",
        acao: "REVISAO OUSE PASSAR e APLICAR AS TECNICAS OUSE PASSAR"
      },
      {
        numero: "51",
        acao: "SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 6,
    titulo: "6a RODADA (Missões 52 a 62)",
    missoes: [
      {
        numero: "52",
        materia: "Raciocínio Lógico",
        assunto: "Analise Combinatoria e probabilidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "53",
        materia: "Português",
        assunto: "5.5 Concordancia verbal e nominal.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "54",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Informática",
        assunto: "Nocoes de virus, worms, phishing e pragas virtuais",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "55",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Habilitacao + Res. 789 (Anexo I - Habilitacao)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 140 ao 160 do CTB + Resolução citada"
      },
      {
        numero: "56",
        materia: "Direito Administrativo",
        assunto: "2 Ato administrativo. 2.1 Conceito, requisitos, atributos, classificacao e especies.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "57",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Infracoes de Transito.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 161 ao 255 do CTB."
      },
      {
        numero: "58",
        materia: "Direito Administrativo",
        assunto: "3 Agentes publicos. 3.1 Legislacao pertinente. 3.1.1 Lei no 8.112/1990 e suas alteracoes. 3.1.2 Disposicoes constitucionais aplicaveis. 3.2 Disposicoes doutrinarias. 3.2.1 Conceito. 3.2.2 Especies. 3.2.3 Cargo, emprego e funcao publica. 3.3 Carreira de policial rodoviario federal.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "59",
        materia: "Legislação de Trânsito",
        assunto: "CTB: Penalidades.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 256 ao 268-A do CTB.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "60",
        acao: "REVISAO OUSE PASSAR + APLICAR AS TECNICAS OUSE PASSAR"
      },
      {
        numero: "61",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "62",
        acao: "SIMULADO (Iniciante: Rodada / Avancado: Completo) e CORRECAO"
      }
    ]
  },
  {
    numero: 7,
    titulo: "7a RODADA (Missões 63 a 74)",
    missoes: [
      {
        numero: "63",
        materia: "Raciocínio Lógico",
        assunto: "Modelagem de situacoes - problema por meio de equacoes do 1o e 2o graus e sistemas lineares.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "64",
        materia: "Legislação de Trânsito",
        assunto: "Medidas Administrativas.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 269 ao 279 do CTB."
      },
      {
        numero: "65",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Informática",
        assunto: "Aplicativos para seguranca (antivirus, firewall, anti-spyware, VPN, etc.)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "66",
        materia: "Direito Administrativo",
        assunto: "3.3.1 Lei no 9.654/1998 e suas alteracoes (carreira de PRF). 3.3.2 Lei no 12.855/2013 (indenizacao fronteiras). 3.3.3 Lei no 13.712/2018 (indenizacao PRF). 3.3.4 Decreto no 8.282/2014 (carreira de PRF).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "67",
        materia: "Legislação de Trânsito",
        assunto: "Processo Administrativo.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 280 ao 290 do CTB."
      },
      {
        numero: "68",
        materia: "Direito Administrativo",
        assunto: "4 Poderes administrativos. 4.1 Hierarquico, disciplinar, regulamentar e de policia. 4.2 Uso e abuso do poder.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "69",
        materia: "Legislação de Trânsito",
        assunto: "Crimes de Transito + Res. 432 (CONSUMO DE ALCOOL OU DE OUTRA SUBSTANCIA PSICOATIVA)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 291 ao 312-B do CTB."
      },
      {
        numero: "70",
        tema: "Revisao: Parte 2 - Direito Constitucional (4 missoes)",
        materia: "Português",
        assunto: "5.6 Regencia verbal e nominal. Emprego do sinal indicativo de crase",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "71",
        materia: "Legislação de Trânsito",
        assunto: "Anexo I do CTB",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "72",
        materia: "Legislação de Trânsito",
        assunto: "Lei no 5.970/1973",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "73",
        materia: "Legislação de Trânsito",
        assunto: "Revisao: Anexo I do CTB e Lei no 5.970/1973",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "74",
        acao: "REVISAO OUSE PASSAR + APLICAR AS TECNICAS OUSE PASSAR / SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 8,
    titulo: "8a RODADA (Missões 75 a 86)",
    missoes: [
      {
        numero: "75",
        materia: "Raciocínio Lógico",
        assunto: "Nocao de funcao. Analise grafica. Funcao afim, quadratica, exponencial e logaritmica. Aplicacoes",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "76",
        tema: "Revisao: Transito - CTB - Parte 1 (4 missoes)",
        materia: "Legislação de Trânsito",
        assunto: "911/2022; 912/2022 36/1998; 970/2022; 938/2022",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "77",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Informática",
        assunto: "5 Computacao na nuvem (cloud computing).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "78",
        materia: "Direito Administrativo",
        assunto: "5 Licitacao. 5.1 Principios. 5.2 Contratacao direta: dispensa e inexigibilidade. 5.3 Modalidades. 5.4 Tipos. 5.5 Procedimento.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "79",
        materia: "Raciocínio Lógico",
        assunto: "Descricao e analise de dados. Leitura e interpretacao de tabelas e graficos apresentados em diferentes linguagens e representacoes. Calculo de medias e analise de desvios de conjuntos de dados",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "80",
        materia: "Direito Administrativo",
        assunto: "6 Controle da Administracao Publica. 6.1 Controle exercido pela Administracao Publica. 6.2 Controle judicial. 6.3 Controle legislativo.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "81",
        materia: "Português",
        assunto: "5.8 Colocacao dos pronomes atonos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "82",
        materia: "Legislação de Trânsito",
        assunto: "Resoluções do Contran: 968/2022; 110/2000; 969/2022",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "83",
        materia: "Legislação de Trânsito",
        assunto: "Resolução 882/21 (revoga a 210, 211, 290, 520 e 803);",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "84",
        acao: "REVISAO OUSE PASSAR + APLICAR TECNICAS"
      },
      {
        numero: "85",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "86",
        acao: "SIMULADO + CORRECAO"
      }
    ]
  },
  {
    numero: 9,
    titulo: "9a RODADA (Missões 87 a 97)",
    missoes: [
      {
        numero: "87",
        materia: "Raciocínio Lógico",
        assunto: "Metrica. Areas e volumes. Estimativa. Aplicacoes. Analise e interpretacao de diferentes representacoes de figuras planas, como desenhos, mapas e plantas. Utilizacao de escalas. Visualizacao de figuras espaciais em diferentes posicoes. Representacoes bidimensionais de projecoes, planificacao e cortes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "88",
        tema: "Revisao: Informática - Parte 1 (4 missoes)",
        materia: "Legislação de Trânsito",
        assunto: "Resoluções do Contran: 960 (REVOGOU A 216/2006; 253/2007; 254/2007) e 955/2022",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "89",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Português",
        assunto: "6 Reescrita de frases e paragrafos do texto. 6.1 Significacao das palavras. 6.2 Substituicao de palavras ou de trechos de texto. 6.3 Reorganizacao da estrutura de oracoes e de periodos do texto. 6.4 Reescrita de textos de diferentes generos e niveis de formalidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "90",
        tema: "Revisao: Informática - Parte 2 (4 missoes)",
        materia: "Direito Administrativo",
        assunto: "7 Responsabilidade civil do Estado. 7.1 Responsabilidade civil do Estado no direito brasileiro. 7.1.1 Responsabilidade por ato comissivo do Estado. 7.1.2 Responsabilidade por omissao do Estado. 7.2 Requisitos para a demonstracao da responsabilidade do Estado. 7.3 Causas excludentes e atenuantes da responsabilidade do Estado.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "91",
        materia: "Legislação de Trânsito",
        assunto: "Resoluções do Contran: 946/2022; 508/2014; 945/2022, exceto os anexos; 735/2018, exceto os anexos;",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "92",
        materia: "Direito Administrativo",
        assunto: "8 Regime juridico-administrativo. 8.1 Conceito. 8.2 Principios expressos e implicitos da Administracao Publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "93",
        materia: "Português",
        assunto: "7 Correspondencia oficial (conforme Manual de Redacao da Presidencia da Republica). 7.1 Aspectos gerais da redacao oficial. 7.2 Finalidade dos expedientes oficiais. 7.3 Adequacao da linguagem ao tipo de documento. 7.4 Adequacao do formato do texto ao genero.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "94",
        materia: "Legislação de Trânsito",
        assunto: "Resoluções do Contran: 925/2022; 909/20252 e 561/2015, exceto as fichas;",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "95",
        materia: "Legislação de Trânsito",
        assunto: "Resoluções do Contran: 870/21 (740/2018 FOI REVOGADA); 871/21 (REVOGA A 806/2020);",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões."
      },
      {
        numero: "96",
        acao: "REVISAO OUSE PASSAR + TECNICAS"
      },
      {
        numero: "97",
        acao: "SIMULADO (Iniciante e Avancado) + CORRECAO"
      }
    ]
  },
  {
    numero: 10,
    titulo: "10a RODADA (Missões 98 a 109)",
    missoes: [
      {
        numero: "98",
        materia: "Legislação de Trânsito",
        assunto: "Resolução do Contran: 798/2020;",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "99",
        materia: "Direito Penal",
        assunto: "1 Principios basicos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Raciocínio Lógico - Parte 1 (5 missoes)", "Revisao: Informática - Parte 1 (4 missoes)"]
      },
      {
        numero: "100",
        materia: "Legislação de Trânsito",
        assunto: "Resoluções do Contran: 809/2020; 810/2020.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Administrativo - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "101",
        materia: "Direito Penal",
        assunto: "2 Aplicacao da lei penal. 2.1 Lei penal no tempo. 2.1.1 Tempo do crime. 2.1.2 Conflito de leis penais no tempo. 2.2 Lei penal no espaco. 2.2.1 Lugar do crime. 2.2.2 Territorialidade. 2.2.3 Extraterritorialidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura dos arts 1 ao 12 do Código Penal.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "102",
        materia: "Legislação Especial",
        assunto: "1 Lei no 5.553/1968 e Lei no 12.037/2009.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)"]
      },
      {
        numero: "103",
        materia: "Direito Penal",
        assunto: "3 Tipicidade. 3.1 Crime doloso e crime culposo. 3.2 Erro de tipo. 3.3 Crime consumado e tentado. 3.4 Crime impossivel. 3.5 Punibilidade e causas de extincao. 4 Ilicitude. 4.1 Causas de exclusao da ilicitude. 4.2 Excesso punivel. e 5.3 Erro de proibicao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do art, 13 ao 25 do Código Penal.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "104",
        materia: "Legislação Especial",
        assunto: "2 Lei no 8.069/1990 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Informática - Parte 2 (4 missoes)", "Revisao: Raciocínio Lógico - Parte 2 (5 missoes)"]
      },
      {
        numero: "105",
        materia: "Física",
        assunto: "1 Cinematica escalar, cinematica vetorial.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Direito Administrativo - Parte 2 (5 missoes)"]
      },
      {
        numero: "106",
        materia: "Legislação Especial",
        assunto: "3 Lei no 8.072/1990 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver 20 questões"
      },
      {
        numero: "107",
        acao: "REVISAO OUSE PASSAR"
      },
      {
        numero: "108",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "109",
        acao: "SIMULADO + CORRECAO"
      }
    ]
  },
  {
    numero: 11,
    titulo: "11a RODADA (Missões 110 a 119)",
    missoes: [
      {
        numero: "110",
        materia: "Direito Penal",
        assunto: "5 Culpabilidade. 5.1 Causas de exclusao da culpabilidade. 5.2 Imputabilidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do art, 26 ao 28 do Código Penal.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Informática - Parte 1 (4 missoes)"]
      },
      {
        numero: "111",
        materia: "Legislação Especial",
        assunto: "4 Decreto no 1.655/1995 e art. 47 do Decreto no 9.662/2019.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Raciocínio Lógico - Parte 1 (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "112",
        materia: "Direito Penal",
        assunto: "6.1 Crimes contra a pessoa.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 121 ao 154-B do Código Penal.",
        extra: ["Revisao: Transito - Resoluções - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "113",
        materia: "Física",
        assunto: "2 Movimento circular.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Administrativo - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "114",
        materia: "Direito Penal",
        assunto: "6.2 Crimes contra o patrimonio",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura do Art. 155 ao 183 do Código Penal.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)"]
      },
      {
        numero: "115",
        materia: "Física",
        assunto: "3 Leis de Newton e suas aplicacoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Raciocínio Lógico - Parte 2 (5 missoes)"]
      },
      {
        numero: "116",
        materia: "Direito Penal",
        assunto: "6.3 Crimes contra a dignidade sexual.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura dos arts 213 ao 234-B do Código Penal.",
        extra: ["Revisao: Informática - Parte 2 (4 missoes)", "Revisao: Direito Administrativo - Parte 2 (5 missoes)"]
      },
      {
        numero: "117",
        materia: "Legislação Especial",
        assunto: "5 Lei no 9.099/1995 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Transito - Resoluções - Parte 2 (5 missoes)"]
      },
      {
        numero: "118",
        acao: "REVISAO OUSE PASSAR + TECNICAS"
      },
      {
        numero: "119",
        acao: "SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 12,
    titulo: "12a RODADA (Missões 120 a 130)",
    missoes: [
      {
        numero: "120",
        materia: "Direito Penal",
        assunto: "6.4 Crimes contra a incolumidade publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura dos arts 250 a 285 do Código Penal.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Direito Administrativo - Parte 1 (4 missoes)"]
      },
      {
        numero: "121",
        materia: "Física",
        assunto: "4 Trabalho. 5 Potencia.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Raciocínio Lógico - Parte 1 (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "122",
        materia: "Direito Penal",
        assunto: "6.5 Crimes contra a fe publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Informática - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "123",
        materia: "Legislação Especial",
        assunto: "6 Lei no 9.455/1997 e suas alteracoes. 7 Lei no 9.605/1998 e suas alteracoes: Capitulos III e V.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - Resoluções - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "124",
        materia: "Direito Penal",
        assunto: "6.6 Crimes contra a Administracao Publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura arts. 312 a 359-H do Código Penal",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Informática - Parte 2 (4 missoes)"]
      },
      {
        numero: "125",
        materia: "Física",
        assunto: "6 Energia cinetica, energia potencial, atrito. 7 Conservacao de energia e suas transformacoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)", "Revisao: Raciocínio Lógico - Parte 2 (5 missoes)"]
      },
      {
        numero: "126",
        materia: "Legislação Especial",
        assunto: "8 Lei no 10.826/2003 e suas alteracoes: Capitulo IV. 9 Lei no 11.343/2006 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "127",
        tema: "Revisao: Transito - Resoluções - Parte 2 (5 missoes)"
      },
      {
        numero: "128",
        acao: "REVISAO OUSE PASSAR + TECNICAS"
      },
      {
        numero: "129",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "130",
        acao: "SIMULADO + CORRECAO"
      }
    ]
  },
  {
    numero: 13,
    titulo: "13a RODADA (Missões 131 a 140)",
    missoes: [
      {
        numero: "131",
        materia: "Legislação Especial",
        assunto: "10 Lei no 12.850/2013 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Informática - Parte 1 (4 missoes)", "Revisao: Direito Penal - Parte 1 (5 missoes)"]
      },
      {
        numero: "132",
        materia: "Física",
        assunto: "8 Quantidade de movimento e conservacao da quantidade de movimento, impulso. 9 Colisoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "133",
        materia: "Legislação Especial",
        assunto: "11 Lei no 13.675/2018. 12 Lei no 13.869/2019.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Informática - Parte 2 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)", "Revisao: Direito Administrativo - Parte 1 (4 missoes)"]
      },
      {
        numero: "134",
        materia: "Direito Processual Penal",
        assunto: "Diligencias Investigatorias (art. 6o e 13 do CPP). e 1 Acao penal. 1.1 Conceito. 1.2 Caracteristicas. 1.3 Especies. 1.4 Condicoes. 2 Termo Circunstanciado de Ocorrencia (Lei no 9.099/1995). 2.1 Atos processuais: forma, lugar e tempo.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "135",
        materia: "Direitos Humanos",
        assunto: "1 Direitos humanos na Constituição Federal. 1.1 A Constituição Federal e os tratados internacionais de direitos humanos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - Resoluções - Parte 1 (4 missoes)", "Revisao: Raciocínio Lógico - Parte 1 (5 missoes)"]
      },
      {
        numero: "136",
        materia: "Direito Processual Penal",
        assunto: "3 Prova. 3.1 Conceito, objeto, classificacao. 3.2 Preservacao de local de crime. 3.3 Requisitos e onus da prova. 3.4 Provas ilicitas. 3.5 Meios de prova: pericial, interrogatorio, confissao, perguntas ao ofendido, testemunhas, reconhecimento de pessoas e coisas, acareacao, documentos, indicios. 3.6 Busca e apreensao: pessoal, domiciliar, requisitos, restricoes, horarios.",
        extra: ["Revisao: Direito Penal - Parte 2 (5 missoes)"]
      },
      {
        numero: "137",
        materia: "Direitos Humanos",
        assunto: "2 Declaracao Universal dos Direitos Humanos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "138",
        materia: "Direito Processual Penal",
        assunto: "4 Prisao. 4.1 Conceito, formalidades, especies e mandado de prisao e cumprimento. 4.2 Prisao em flagrante. 5 Identificacao Criminal (art. 5o, LVIII, da Constituição Federal e art. 3o da Lei no 12.037/2009).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões. Leitura dos arts 282 ao 350 do Código de Processo Penal.",
        extra: ["Revisao: Raciocínio Lógico - Parte 2 (5 missoes)", "Revisao: Transito - Resoluções - Parte 1 (4 missoes)"]
      },
      {
        numero: "139",
        acao: "REVISAO OUSE PASSAR + TECNICAS"
      },
      {
        numero: "140",
        acao: "SIMULADO + CORRECAO"
      }
    ]
  },
  {
    numero: 14,
    titulo: "14a RODADA (Missões 141 a 151)",
    missoes: [
      {
        numero: "141",
        materia: "Direitos Humanos",
        assunto: "3 Convencao Americana sobre Direitos Humanos (Decreto no 678/1992).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Informática - Parte 1 (4 missoes)"]
      },
      {
        numero: "142",
        materia: "Ética e Cidadania",
        assunto: "Etica e moral",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "143",
        materia: "Geopolítica",
        assunto: "1 O Brasil politico: nacao e territorio.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Informática - Parte 2 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "144",
        materia: "Ética e Cidadania",
        assunto: "Etica, principios e valores",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Física", "Revisao: Transito - CTB - Parte 3 (4 missoes)", "Revisao: Legislação Especial - Parte 1 (4 missoes)"]
      },
      {
        numero: "145",
        materia: "Ética e Cidadania",
        assunto: "Etica e funcao publica: integridade Etica no setor publico. 4.1 Principios da Administracao Publica: moralidade (art. 37 da CF). 4.2. Deveres dos servidores publicos: moralidade administrativa (Lei no 8.112/1990, art. 116, IX).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - Resoluções - Parte 1 (4 missoes)", "Revisao: Raciocínio Lógico - Parte 1 (5 missoes)", "Revisao: Direito Penal - Parte 1 (5 missoes)"]
      },
      {
        numero: "146",
        materia: "Geopolítica",
        assunto: "2 Organizacao do Estado Brasileiro.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Administrativo - Parte 1 (4 missoes)", "Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Direito Penal - Parte 2 (5 missoes)"]
      },
      {
        numero: "147",
        tema: "Revisao: Direito Penal e Direito Processual Penal",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Legislação Especial - Parte 2 (5 missoes)"]
      },
      {
        numero: "148",
        materia: "Geopolítica",
        assunto: "3 A divisao interregional do trabalho e da producao no Brasil.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Raciocínio Lógico - Parte 2 (5 missoes)", "Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Transito - Resoluções - Parte 2 (5 missoes)"]
      },
      {
        numero: "149",
        acao: "REVISAO OUSE PASSAR + TECNICAS"
      },
      {
        numero: "150",
        acao: "PRODUZIR UMA DISCURSIVA"
      },
      {
        numero: "151",
        acao: "SIMULADO + CORRECAO"
      }
    ]
  },
  {
    numero: 15,
    titulo: "15a RODADA (Missões 152 a 169)",
    missoes: [
      {
        numero: "152",
        materia: "Ética e Cidadania",
        assunto: "Politica de governanca da administracao publica federal (Decreto no 9.203/2017). 4.4. Promocao da etica e de regras de conduta para servidores. 4.4.1. Código de Etica Profissional do Servidor Publico Civil do Poder Executivo Federal (Decreto no 1.171/1994).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Direito Administrativo - Parte 1 (4 missoes)"]
      },
      {
        numero: "153",
        materia: "Geopolítica",
        assunto: "4 A estrutura urbana brasileira e as grandes metropoles.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Raciocínio Lógico - Parte 1 (5 missoes)", "Revisao: Parte 1 - Direito Constitucional (5 missoes)"]
      },
      {
        numero: "154",
        materia: "Ética e Cidadania",
        assunto: "Sistema de Gestao da Etica do Poder Executivo Federal e Comissoes de Etica (Decreto no 6.029/2007). Código de Conduta da Alta Administracao Federal (Exposicao de Motivos no 37/2000).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Informática - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "155",
        materia: "Geopolítica",
        assunto: "5 Distribuicao espacial da populacao no Brasil e movimentos migratorios internos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Física", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "156",
        materia: "Inglês OU Espanhol",
        assunto: "BASES PARA A INTERPRETACAO TEXTUAL",
        instrucoes: "Assistir as videoaulas e resolver a lista de questões.",
        obs: "o aluno deve escolher entre Inglês ou Espanhol.",
        extra: ["Revisao: Informática - Parte 2 (4 missoes)"]
      },
      {
        numero: "157",
        materia: "Geopolítica",
        assunto: "6 Integracao entre industria e estrutura urbana e setor agricola no Brasil.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Legislação Especial - Parte 1 (4 missoes)"]
      },
      {
        numero: "158",
        materia: "Inglês OU Espanhol",
        assunto: "VERBOS",
        instrucoes: "Assistir as videoaulas e resolver a lista de questões.",
        obs: "o aluno deve escolher entre Inglês ou Espanhol.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)", "Revisao: Direitos Humanos"]
      },
      {
        numero: "159",
        materia: "Ética e Cidadania",
        assunto: "Etica e democracia: exercicio da cidadania. 5.1 Promocao da transparencia ativa e do acesso a informacao (Lei no 12.527/2011 e Decreto no 7.724/2012). 5.2. Tratamento de conflitos de interesses e nepotismo (Lei no 12.813/2013 e Decreto no 7.203/2010).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Penal"]
      },
      {
        numero: "160",
        materia: "Geopolítica",
        assunto: "7 Rede de transporte no Brasil: modais e principais infraestruturas",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Transito - Resoluções - Parte 1 (4 missoes)"]
      },
      {
        numero: "161",
        materia: "Inglês OU Espanhol",
        assunto: "VOCABULARIO",
        instrucoes: "Assistir as videoaulas e resolver questões",
        obs: "o aluno deve escolher entre Inglês ou Espanhol.",
        extra: ["Revisao: Raciocínio Lógico - Parte 2 (5 missoes)"]
      },
      {
        numero: "162",
        materia: "Geopolítica",
        assunto: "8 A integracao do Brasil ao processo de internacionalizacao da economia.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "163",
        materia: "Inglês OU Espanhol",
        assunto: "REVISAO FINAL",
        instrucoes: "Assistir as videoaulas e resolver a lista de questões.",
        obs: "o aluno deve escolher entre Inglês ou Espanhol.",
        extra: ["Revisao: Direito Penal - Parte 1 (5 missoes)"]
      },
      {
        numero: "164",
        materia: "Geopolítica",
        assunto: "10 Macrodivisao natural do espaco brasileiro: biomas, dominios e ecossistemas.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Legislação Especial"]
      },
      {
        numero: "165",
        tema: "Revisao: Transito - Resoluções - Parte 2 (5 missoes)"
      },
      {
        numero: "166",
        tema: "Revisao: Direito Penal - Parte 2 (5 missoes)"
      },
      {
        numero: "167",
        materia: "Geopolítica",
        assunto: "9 Geografia e gestao ambiental.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questões.",
        extra: ["Revisao: Direito Processual Penal", "Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Legislação Especial - Parte 2 (5 missoes)"]
      },
      {
        numero: "168",
        acao: "REVISAO OUSE PASSAR + TECNICAS"
      },
      {
        numero: "169",
        acao: "SIMULADO + CORRECAO"
      }
    ]
  },
  {
    numero: 16,
    titulo: "16a RODADA - SOMENTE PARA REVISAO (Missões 170 a 184)",
    missoes: [
      { numero: "170", tema: "REVISAO: Materia: Português" },
      { numero: "171", tema: "REVISAO: Materia: Raciocínio Lógico" },
      { numero: "172", tema: "REVISAO: Materia: Informática" },
      { numero: "173", tema: "REVISAO: Materia: Transito - CTB" },
      { numero: "174", tema: "REVISAO: Materia: Direito Administrativo" },
      { numero: "175", tema: "REVISAO: Materia: Direito Constitucional" },
      { numero: "176", tema: "REVISAO: Materia: Direito Penal" },
      { numero: "177", tema: "REVISAO: Materia: Transito - Resoluções" },
      { numero: "178", tema: "REVISAO: Materia: Física" },
      { numero: "179", tema: "REVISAO: Materia: Direito Processual Penal" },
      { numero: "180", tema: "REVISAO: Materia: Legislação Especial" },
      { numero: "181", tema: "REVISAO: Materia: Direitos Humanos" },
      { numero: "182", tema: "REVISAO: Materia: Ética e Cidadania" },
      { numero: "183", tema: "REVISAO: Materia: Geopolítica" },
      { numero: "184", tema: "REVISAO: Materia: Inglês ou Espanhol" }
    ]
  }
];

// Mensagens de incentivo aleatorias
export const mensagensIncentivo = [
  "Sua dedicacao vai te levar longe! Siga firme no planejamento.",
  "Cada missao concluida e um passo mais perto da sua aprovacao!",
  "Disciplina e constancia sao as chaves do sucesso. Voce consegue!",
  "O esforco de hoje e a vitoria de amanha. Continue firme!",
  "Acredite no seu potencial. A farda da PRF espera por voce!",
  "Nao desista! Os melhores resultados vem para quem persiste.",
  "Sua determinacao e sua maior arma. Use-a todos os dias!",
  "Lembre-se: a dor do treinamento e temporaria, a gloria da aprovacao e permanente!",
  "Voce esta no caminho certo. Confie no processo!",
  "Cada hora de estudo te aproxima do seu objetivo. Siga em frente!"
];

export function getMensagemAleatoria(): string {
  return mensagensIncentivo[Math.floor(Math.random() * mensagensIncentivo.length)];
}
