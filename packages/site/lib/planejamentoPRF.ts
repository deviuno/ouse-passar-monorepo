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
    titulo: "1a RODADA (Missoes 1 a 10)",
    missoes: [
      {
        numero: "1",
        materia: "Direito Constitucional",
        assunto: "Direitos e deveres individuais e coletivos",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 5o da Constituicao Federal"
      },
      {
        numero: "2",
        materia: "Portugues",
        assunto: "5.1 Emprego das classes de palavras. 5.2 Relacoes de coordenacao entre oracoes e entre termos da oracao. 5.3 Relacoes de subordinacao entre oracoes e entre termos da oracao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "3",
        materia: "Informatica",
        assunto: "Conceito de internet e intranet",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "4",
        materia: "Legislacao de Transito",
        assunto: "CTB: Disposicoes preliminares. Vias e Velocidades",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 1 ao 4 e 60 ao 63 do CTB."
      },
      {
        numero: "5",
        materia: "Raciocinio Logico",
        assunto: "Teoria de Conjuntos",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "6",
        materia: "Legislacao de Transito",
        assunto: "CTB: Normas Gerais de Circulacao e Conduta. Da conducao de veiculos por motoristas profissionais",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 26 ao 67-E do CTB."
      },
      {
        numero: "7",
        materia: "Direito Constitucional",
        assunto: "Direitos sociais",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 6o ao 11o da Constituicao Federal"
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
    titulo: "2a RODADA (Missoes 11 a 20)",
    missoes: [
      {
        numero: "11",
        materia: "Direito Constitucional",
        assunto: "Nacionalidade",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura dos artigos 12o e 13o da Constituicao Federal"
      },
      {
        numero: "12",
        materia: "Informatica",
        assunto: "Conceitos e modos de utilizacao de tecnologias, ferramentas, aplicativos e procedimentos associados a internet/intranet. 2.1 Ferramentas e aplicativos comerciais de navegacao, de correio eletronico, de grupos de discussao, de busca, de pesquisa, de redes sociais e ferramentas colaborativas.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "13",
        materia: "Portugues",
        assunto: "Dominio da ortografia oficial.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "14",
        materia: "Legislacao de Transito",
        assunto: "CTB: Sistema Nacional de Transito",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 5o ao 25-A do CTB."
      },
      {
        numero: "15",
        materia: "Raciocinio Logico",
        assunto: "Porcentagem",
        instrucoes: "Estudar a teoria pontual e resolver 44 questoes"
      },
      {
        numero: "16",
        materia: "Legislacao de Transito",
        assunto: "CTB: Pedestres e Condutores de Veiculo nao Motorizados",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 68 ao 71 do CTB."
      },
      {
        numero: "17",
        materia: "Direito Constitucional",
        assunto: "3 Poder Executivo. 3.1 Forma e sistema de governo. 3.2 Chefia de Estado e chefia de governo. 3.3 Atribuicoes e responsabilidades do presidente da Republica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 76o ao 86o da Constituicao Federal"
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
    titulo: "3a RODADA (Missoes 21 a 30)",
    missoes: [
      {
        numero: "21",
        materia: "Direito Constitucional",
        assunto: "Direitos Politicos e Partidos Politicos",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 14o ao 17o da Constituicao Federal"
      },
      {
        numero: "22",
        materia: "Raciocinio Logico",
        assunto: "Taxas de Variacao de grandeza. Razao e Proporcao com aplicacoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "23",
        materia: "Legislacao de Transito",
        assunto: "CTB: Cidadao. Educacao para o Transito.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 72 ao 79 do CTB."
      },
      {
        numero: "24",
        materia: "Legislacao de Transito",
        assunto: "CTB: Sinalizacao de Transito + Res. 160",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 80 ao 90 do CTB."
      },
      {
        numero: "25",
        materia: "Portugues",
        assunto: "Dominio dos mecanismos de coesao textual. Emprego de elementos de referenciacao, substituicao e repeticao, de conectores e de outros elementos de sequenciacao textual. Emprego de tempos e modos verbais.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "26",
        materia: "Informatica",
        assunto: "Nocoes de sistema operacional (ambiente Windows).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "27",
        materia: "Direito Constitucional",
        assunto: "3.4 Da Uniao: bens e competencias (arts. 20 a 24 da CF).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura artigo 20 a 24 da Constituicao Federal"
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
    titulo: "4a RODADA (Missoes 31 a 41)",
    nota: "A numeracao das missoes segue a ordem de apresentacao do conteudo para manter a logica de estudo.",
    missoes: [
      {
        numero: "31",
        materia: "Raciocinio Logico",
        assunto: "Regra de Tres Simples e Composta.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "32",
        materia: "Legislacao de Transito",
        assunto: "Veiculos. Registro de Veiculos. Licenciamento.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 96 ao 117 e Art. 120 ao 135 do CTB."
      },
      {
        numero: "33",
        materia: "Direito Constitucional",
        assunto: "Ordem social. 5.1 Base e objetivos da ordem social. 5.2 Seguridade social. 5.3 Meio ambiente. 5.4 Familia, crianca, adolescente, idoso, indio.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 193 ao 204 // artigo 225 ao 232 da Constituicao Federal"
      },
      {
        numero: "34",
        tema: "REVISAO OUSE PASSAR"
      },
      {
        numero: "35",
        materia: "Direito Constitucional",
        assunto: "Defesa do Estado e das instituicoes democraticas. 4.1 Forcas Armadas (art. 142, CF). 4.2 Seguranca publica (art. 144 da CF).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 142 e 144 da Constituicao Federal."
      },
      {
        numero: "36",
        materia: "Informatica",
        assunto: "Acesso a distancia a computadores, transferencia de informacao e arquivos, aplicativos de audio, video e multimidia",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "37",
        materia: "Portugues",
        assunto: "Compreensao e interpretacao de textos de generos variados e Reconhecimento de tipos e generos textuais.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "38",
        materia: "Legislacao de Transito",
        assunto: "CTB: Engenharia de Trafego, Operacao, Fiscalizacao e Policiamento Ostensivo de Transito.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 91 ao 95 do CTB."
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
    titulo: "5a RODADA (Missoes 42 a 51)",
    missoes: [
      {
        numero: "42",
        materia: "Direito Constitucional",
        assunto: "1 Poder constituinte. 1.1 Fundamentos do poder constituinte. 1.2 Poder constituinte originario e derivado. 1.3 Reforma e revisao constitucionais. 1.4 Limitacao do poder de revisao. 1.5 Emendas a Constituicao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "43",
        materia: "Legislacao de Transito",
        assunto: "CTB: Veiculos em Circulacao Internacional + Resolucao CONTRAN No 933 DE 28/03/2022 (revoga resolucao 360)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 118 e 119 do CTB + Resolucao citada."
      },
      {
        numero: "44",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)"
      },
      {
        numero: "45",
        materia: "Portugues",
        assunto: "5.4 Emprego dos sinais de pontuacao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "46",
        materia: "Informatica",
        assunto: "Transformacao digital. 3.1 Internet das coisas (IoT). 3.2 Big data. 3.3 Inteligencia artificial.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "47",
        materia: "Raciocinio Logico",
        assunto: "Sequencias numericas. Progressao aritmetica e Progressao Geometrica",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "48",
        materia: "Legislacao de Transito",
        assunto: "CTB: Conducao de Escolares. Conducao de Moto-frete.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 136 ao 139-B do CTB."
      },
      {
        numero: "49",
        tema: "Revisao: Parte 2 - Direito Constitucional (4 missoes)",
        materia: "Direito Administrativo",
        assunto: "1. Nocoes de organizacao administrativa. 1.1 Centralizacao, descentralizacao, concentracao e desconcentracao. 1.2 Administracao direta e indireta. 1.3 Autarquias, fundacoes, empresas publicas e sociedades de economia mista.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
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
    titulo: "6a RODADA (Missoes 52 a 62)",
    missoes: [
      {
        numero: "52",
        materia: "Raciocinio Logico",
        assunto: "Analise Combinatoria e probabilidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "53",
        materia: "Portugues",
        assunto: "5.5 Concordancia verbal e nominal.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "54",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Informatica",
        assunto: "Nocoes de virus, worms, phishing e pragas virtuais",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "55",
        materia: "Legislacao de Transito",
        assunto: "CTB: Habilitacao + Res. 789 (Anexo I - Habilitacao)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 140 ao 160 do CTB + Resolucao citada"
      },
      {
        numero: "56",
        materia: "Direito Administrativo",
        assunto: "2 Ato administrativo. 2.1 Conceito, requisitos, atributos, classificacao e especies.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "57",
        materia: "Legislacao de Transito",
        assunto: "CTB: Infracoes de Transito.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 161 ao 255 do CTB."
      },
      {
        numero: "58",
        materia: "Direito Administrativo",
        assunto: "3 Agentes publicos. 3.1 Legislacao pertinente. 3.1.1 Lei no 8.112/1990 e suas alteracoes. 3.1.2 Disposicoes constitucionais aplicaveis. 3.2 Disposicoes doutrinarias. 3.2.1 Conceito. 3.2.2 Especies. 3.2.3 Cargo, emprego e funcao publica. 3.3 Carreira de policial rodoviario federal.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "59",
        materia: "Legislacao de Transito",
        assunto: "CTB: Penalidades.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 256 ao 268-A do CTB.",
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
    titulo: "7a RODADA (Missoes 63 a 74)",
    missoes: [
      {
        numero: "63",
        materia: "Raciocinio Logico",
        assunto: "Modelagem de situacoes - problema por meio de equacoes do 1o e 2o graus e sistemas lineares.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "64",
        materia: "Legislacao de Transito",
        assunto: "Medidas Administrativas.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 269 ao 279 do CTB."
      },
      {
        numero: "65",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Informatica",
        assunto: "Aplicativos para seguranca (antivirus, firewall, anti-spyware, VPN, etc.)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "66",
        materia: "Direito Administrativo",
        assunto: "3.3.1 Lei no 9.654/1998 e suas alteracoes (carreira de PRF). 3.3.2 Lei no 12.855/2013 (indenizacao fronteiras). 3.3.3 Lei no 13.712/2018 (indenizacao PRF). 3.3.4 Decreto no 8.282/2014 (carreira de PRF).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "67",
        materia: "Legislacao de Transito",
        assunto: "Processo Administrativo.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 280 ao 290 do CTB."
      },
      {
        numero: "68",
        materia: "Direito Administrativo",
        assunto: "4 Poderes administrativos. 4.1 Hierarquico, disciplinar, regulamentar e de policia. 4.2 Uso e abuso do poder.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "69",
        materia: "Legislacao de Transito",
        assunto: "Crimes de Transito + Res. 432 (CONSUMO DE ALCOOL OU DE OUTRA SUBSTANCIA PSICOATIVA)",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 291 ao 312-B do CTB."
      },
      {
        numero: "70",
        tema: "Revisao: Parte 2 - Direito Constitucional (4 missoes)",
        materia: "Portugues",
        assunto: "5.6 Regencia verbal e nominal. Emprego do sinal indicativo de crase",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "71",
        materia: "Legislacao de Transito",
        assunto: "Anexo I do CTB",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "72",
        materia: "Legislacao de Transito",
        assunto: "Lei no 5.970/1973",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "73",
        materia: "Legislacao de Transito",
        assunto: "Revisao: Anexo I do CTB e Lei no 5.970/1973",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "74",
        acao: "REVISAO OUSE PASSAR + APLICAR AS TECNICAS OUSE PASSAR / SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO"
      }
    ]
  },
  {
    numero: 8,
    titulo: "8a RODADA (Missoes 75 a 86)",
    missoes: [
      {
        numero: "75",
        materia: "Raciocinio Logico",
        assunto: "Nocao de funcao. Analise grafica. Funcao afim, quadratica, exponencial e logaritmica. Aplicacoes",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "76",
        tema: "Revisao: Transito - CTB - Parte 1 (4 missoes)",
        materia: "Legislacao de Transito",
        assunto: "911/2022; 912/2022 36/1998; 970/2022; 938/2022",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "77",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Informatica",
        assunto: "5 Computacao na nuvem (cloud computing).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "78",
        materia: "Direito Administrativo",
        assunto: "5 Licitacao. 5.1 Principios. 5.2 Contratacao direta: dispensa e inexigibilidade. 5.3 Modalidades. 5.4 Tipos. 5.5 Procedimento.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "79",
        materia: "Raciocinio Logico",
        assunto: "Descricao e analise de dados. Leitura e interpretacao de tabelas e graficos apresentados em diferentes linguagens e representacoes. Calculo de medias e analise de desvios de conjuntos de dados",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "80",
        materia: "Direito Administrativo",
        assunto: "6 Controle da Administracao Publica. 6.1 Controle exercido pela Administracao Publica. 6.2 Controle judicial. 6.3 Controle legislativo.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "81",
        materia: "Portugues",
        assunto: "5.8 Colocacao dos pronomes atonos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "82",
        materia: "Legislacao de Transito",
        assunto: "Resolucoes do Contran: 968/2022; 110/2000; 969/2022",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "83",
        materia: "Legislacao de Transito",
        assunto: "Resolucao 882/21 (revoga a 210, 211, 290, 520 e 803);",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
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
    titulo: "9a RODADA (Missoes 87 a 97)",
    missoes: [
      {
        numero: "87",
        materia: "Raciocinio Logico",
        assunto: "Metrica. Areas e volumes. Estimativa. Aplicacoes. Analise e interpretacao de diferentes representacoes de figuras planas, como desenhos, mapas e plantas. Utilizacao de escalas. Visualizacao de figuras espaciais em diferentes posicoes. Representacoes bidimensionais de projecoes, planificacao e cortes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "88",
        tema: "Revisao: Informatica - Parte 1 (4 missoes)",
        materia: "Legislacao de Transito",
        assunto: "Resolucoes do Contran: 960 (REVOGOU A 216/2006; 253/2007; 254/2007) e 955/2022",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "89",
        tema: "Revisao: Parte 1 - Direito Constitucional (5 missoes)",
        materia: "Portugues",
        assunto: "6 Reescrita de frases e paragrafos do texto. 6.1 Significacao das palavras. 6.2 Substituicao de palavras ou de trechos de texto. 6.3 Reorganizacao da estrutura de oracoes e de periodos do texto. 6.4 Reescrita de textos de diferentes generos e niveis de formalidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
      },
      {
        numero: "90",
        tema: "Revisao: Informatica - Parte 2 (4 missoes)",
        materia: "Direito Administrativo",
        assunto: "7 Responsabilidade civil do Estado. 7.1 Responsabilidade civil do Estado no direito brasileiro. 7.1.1 Responsabilidade por ato comissivo do Estado. 7.1.2 Responsabilidade por omissao do Estado. 7.2 Requisitos para a demonstracao da responsabilidade do Estado. 7.3 Causas excludentes e atenuantes da responsabilidade do Estado.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "91",
        materia: "Legislacao de Transito",
        assunto: "Resolucoes do Contran: 946/2022; 508/2014; 945/2022, exceto os anexos; 735/2018, exceto os anexos;",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "92",
        materia: "Direito Administrativo",
        assunto: "8 Regime juridico-administrativo. 8.1 Conceito. 8.2 Principios expressos e implicitos da Administracao Publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "93",
        materia: "Portugues",
        assunto: "7 Correspondencia oficial (conforme Manual de Redacao da Presidencia da Republica). 7.1 Aspectos gerais da redacao oficial. 7.2 Finalidade dos expedientes oficiais. 7.3 Adequacao da linguagem ao tipo de documento. 7.4 Adequacao do formato do texto ao genero.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "94",
        materia: "Legislacao de Transito",
        assunto: "Resolucoes do Contran: 925/2022; 909/20252 e 561/2015, exceto as fichas;",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "95",
        materia: "Legislacao de Transito",
        assunto: "Resolucoes do Contran: 870/21 (740/2018 FOI REVOGADA); 871/21 (REVOGA A 806/2020);",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes."
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
    titulo: "10a RODADA (Missoes 98 a 109)",
    missoes: [
      {
        numero: "98",
        materia: "Legislacao de Transito",
        assunto: "Resolucao do Contran: 798/2020;",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "99",
        materia: "Direito Penal",
        assunto: "1 Principios basicos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Raciocinio Logico - Parte 1 (5 missoes)", "Revisao: Informatica - Parte 1 (4 missoes)"]
      },
      {
        numero: "100",
        materia: "Legislacao de Transito",
        assunto: "Resolucoes do Contran: 809/2020; 810/2020.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Administrativo - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "101",
        materia: "Direito Penal",
        assunto: "2 Aplicacao da lei penal. 2.1 Lei penal no tempo. 2.1.1 Tempo do crime. 2.1.2 Conflito de leis penais no tempo. 2.2 Lei penal no espaco. 2.2.1 Lugar do crime. 2.2.2 Territorialidade. 2.2.3 Extraterritorialidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 1 ao 12 do Codigo Penal.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "102",
        materia: "Legislacao Especial",
        assunto: "1 Lei no 5.553/1968 e Lei no 12.037/2009.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)"]
      },
      {
        numero: "103",
        materia: "Direito Penal",
        assunto: "3 Tipicidade. 3.1 Crime doloso e crime culposo. 3.2 Erro de tipo. 3.3 Crime consumado e tentado. 3.4 Crime impossivel. 3.5 Punibilidade e causas de extincao. 4 Ilicitude. 4.1 Causas de exclusao da ilicitude. 4.2 Excesso punivel. e 5.3 Erro de proibicao.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do art, 13 ao 25 do Codigo Penal.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "104",
        materia: "Legislacao Especial",
        assunto: "2 Lei no 8.069/1990 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Informatica - Parte 2 (4 missoes)", "Revisao: Raciocinio Logico - Parte 2 (5 missoes)"]
      },
      {
        numero: "105",
        materia: "Fisica",
        assunto: "1 Cinematica escalar, cinematica vetorial.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Direito Administrativo - Parte 2 (5 missoes)"]
      },
      {
        numero: "106",
        materia: "Legislacao Especial",
        assunto: "3 Lei no 8.072/1990 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver 20 questoes"
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
    titulo: "11a RODADA (Missoes 110 a 119)",
    missoes: [
      {
        numero: "110",
        materia: "Direito Penal",
        assunto: "5 Culpabilidade. 5.1 Causas de exclusao da culpabilidade. 5.2 Imputabilidade.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do art, 26 ao 28 do Codigo Penal.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Informatica - Parte 1 (4 missoes)"]
      },
      {
        numero: "111",
        materia: "Legislacao Especial",
        assunto: "4 Decreto no 1.655/1995 e art. 47 do Decreto no 9.662/2019.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Raciocinio Logico - Parte 1 (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "112",
        materia: "Direito Penal",
        assunto: "6.1 Crimes contra a pessoa.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 121 ao 154-B do Codigo Penal.",
        extra: ["Revisao: Transito - Resolucoes - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "113",
        materia: "Fisica",
        assunto: "2 Movimento circular.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Administrativo - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "114",
        materia: "Direito Penal",
        assunto: "6.2 Crimes contra o patrimonio",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 155 ao 183 do Codigo Penal.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)"]
      },
      {
        numero: "115",
        materia: "Fisica",
        assunto: "3 Leis de Newton e suas aplicacoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Raciocinio Logico - Parte 2 (5 missoes)"]
      },
      {
        numero: "116",
        materia: "Direito Penal",
        assunto: "6.3 Crimes contra a dignidade sexual.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 213 ao 234-B do Codigo Penal.",
        extra: ["Revisao: Informatica - Parte 2 (4 missoes)", "Revisao: Direito Administrativo - Parte 2 (5 missoes)"]
      },
      {
        numero: "117",
        materia: "Legislacao Especial",
        assunto: "5 Lei no 9.099/1995 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Transito - Resolucoes - Parte 2 (5 missoes)"]
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
    titulo: "12a RODADA (Missoes 120 a 130)",
    missoes: [
      {
        numero: "120",
        materia: "Direito Penal",
        assunto: "6.4 Crimes contra a incolumidade publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 250 a 285 do Codigo Penal.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Direito Administrativo - Parte 1 (4 missoes)"]
      },
      {
        numero: "121",
        materia: "Fisica",
        assunto: "4 Trabalho. 5 Potencia.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Raciocinio Logico - Parte 1 (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "122",
        materia: "Direito Penal",
        assunto: "6.5 Crimes contra a fe publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Informatica - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "123",
        materia: "Legislacao Especial",
        assunto: "6 Lei no 9.455/1997 e suas alteracoes. 7 Lei no 9.605/1998 e suas alteracoes: Capitulos III e V.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - Resolucoes - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 3 (4 missoes)"]
      },
      {
        numero: "124",
        materia: "Direito Penal",
        assunto: "6.6 Crimes contra a Administracao Publica.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura arts. 312 a 359-H do Codigo Penal",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Informatica - Parte 2 (4 missoes)"]
      },
      {
        numero: "125",
        materia: "Fisica",
        assunto: "6 Energia cinetica, energia potencial, atrito. 7 Conservacao de energia e suas transformacoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)", "Revisao: Raciocinio Logico - Parte 2 (5 missoes)"]
      },
      {
        numero: "126",
        materia: "Legislacao Especial",
        assunto: "8 Lei no 10.826/2003 e suas alteracoes: Capitulo IV. 9 Lei no 11.343/2006 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "127",
        tema: "Revisao: Transito - Resolucoes - Parte 2 (5 missoes)"
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
    titulo: "13a RODADA (Missoes 131 a 140)",
    missoes: [
      {
        numero: "131",
        materia: "Legislacao Especial",
        assunto: "10 Lei no 12.850/2013 e suas alteracoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Informatica - Parte 1 (4 missoes)", "Revisao: Direito Penal - Parte 1 (5 missoes)"]
      },
      {
        numero: "132",
        materia: "Fisica",
        assunto: "8 Quantidade de movimento e conservacao da quantidade de movimento, impulso. 9 Colisoes.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "133",
        materia: "Legislacao Especial",
        assunto: "11 Lei no 13.675/2018. 12 Lei no 13.869/2019.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Informatica - Parte 2 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)", "Revisao: Direito Administrativo - Parte 1 (4 missoes)"]
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
        assunto: "1 Direitos humanos na Constituicao Federal. 1.1 A Constituicao Federal e os tratados internacionais de direitos humanos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - Resolucoes - Parte 1 (4 missoes)", "Revisao: Raciocinio Logico - Parte 1 (5 missoes)"]
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
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Transito - CTB - Parte 4 (4 missoes)"]
      },
      {
        numero: "138",
        materia: "Direito Processual Penal",
        assunto: "4 Prisao. 4.1 Conceito, formalidades, especies e mandado de prisao e cumprimento. 4.2 Prisao em flagrante. 5 Identificacao Criminal (art. 5o, LVIII, da Constituicao Federal e art. 3o da Lei no 12.037/2009).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 282 ao 350 do Codigo de Processo Penal.",
        extra: ["Revisao: Raciocinio Logico - Parte 2 (5 missoes)", "Revisao: Transito - Resolucoes - Parte 1 (4 missoes)"]
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
    titulo: "14a RODADA (Missoes 141 a 151)",
    missoes: [
      {
        numero: "141",
        materia: "Direitos Humanos",
        assunto: "3 Convencao Americana sobre Direitos Humanos (Decreto no 678/1992).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Informatica - Parte 1 (4 missoes)"]
      },
      {
        numero: "142",
        materia: "Etica e cidadania",
        assunto: "Etica e moral",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 1 - Direito Constitucional (5 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "143",
        materia: "Geopolitica",
        assunto: "1 O Brasil politico: nacao e territorio.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Informatica - Parte 2 (4 missoes)", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "144",
        materia: "Etica e cidadania",
        assunto: "Etica, principios e valores",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Fisica", "Revisao: Transito - CTB - Parte 3 (4 missoes)", "Revisao: Legislacao Especial - Parte 1 (4 missoes)"]
      },
      {
        numero: "145",
        materia: "Etica e cidadania",
        assunto: "Etica e funcao publica: integridade Etica no setor publico. 4.1 Principios da Administracao Publica: moralidade (art. 37 da CF). 4.2. Deveres dos servidores publicos: moralidade administrativa (Lei no 8.112/1990, art. 116, IX).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - Resolucoes - Parte 1 (4 missoes)", "Revisao: Raciocinio Logico - Parte 1 (5 missoes)", "Revisao: Direito Penal - Parte 1 (5 missoes)"]
      },
      {
        numero: "146",
        materia: "Geopolitica",
        assunto: "2 Organizacao do Estado Brasileiro.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Administrativo - Parte 1 (4 missoes)", "Revisao: Parte 2 - Direito Constitucional (4 missoes)", "Revisao: Direito Penal - Parte 2 (5 missoes)"]
      },
      {
        numero: "147",
        tema: "Revisao: Direito Penal e Direito Processual Penal",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Legislacao Especial - Parte 2 (5 missoes)"]
      },
      {
        numero: "148",
        materia: "Geopolitica",
        assunto: "3 A divisao interregional do trabalho e da producao no Brasil.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Raciocinio Logico - Parte 2 (5 missoes)", "Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Transito - Resolucoes - Parte 2 (5 missoes)"]
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
    titulo: "15a RODADA (Missoes 152 a 169)",
    missoes: [
      {
        numero: "152",
        materia: "Etica e Cidadania",
        assunto: "Politica de governanca da administracao publica federal (Decreto no 9.203/2017). 4.4. Promocao da etica e de regras de conduta para servidores. 4.4.1. Codigo de Etica Profissional do Servidor Publico Civil do Poder Executivo Federal (Decreto no 1.171/1994).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Fazer uma prova de portugues", "Revisao: Direito Administrativo - Parte 1 (4 missoes)"]
      },
      {
        numero: "153",
        materia: "Geopolitica",
        assunto: "4 A estrutura urbana brasileira e as grandes metropoles.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Raciocinio Logico - Parte 1 (5 missoes)", "Revisao: Parte 1 - Direito Constitucional (5 missoes)"]
      },
      {
        numero: "154",
        materia: "Etica e cidadania",
        assunto: "Sistema de Gestao da Etica do Poder Executivo Federal e Comissoes de Etica (Decreto no 6.029/2007). Codigo de Conduta da Alta Administracao Federal (Exposicao de Motivos no 37/2000).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Informatica - Parte 1 (4 missoes)", "Revisao: Transito - CTB - Parte 1 (4 missoes)"]
      },
      {
        numero: "155",
        materia: "Geopolitica",
        assunto: "5 Distribuicao espacial da populacao no Brasil e movimentos migratorios internos.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Fisica", "Revisao: Transito - CTB - Parte 2 (5 missoes)"]
      },
      {
        numero: "156",
        materia: "Ingles OU Espanhol",
        assunto: "BASES PARA A INTERPRETACAO TEXTUAL",
        instrucoes: "Assistir as videoaulas e resolver a lista de questoes.",
        obs: "o aluno deve escolher entre Ingles ou Espanhol.",
        extra: ["Revisao: Informatica - Parte 2 (4 missoes)"]
      },
      {
        numero: "157",
        materia: "Geopolitica",
        assunto: "6 Integracao entre industria e estrutura urbana e setor agricola no Brasil.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Administrativo - Parte 2 (5 missoes)", "Revisao: Legislacao Especial - Parte 1 (4 missoes)"]
      },
      {
        numero: "158",
        materia: "Ingles OU Espanhol",
        assunto: "VERBOS",
        instrucoes: "Assistir as videoaulas e resolver a lista de questoes.",
        obs: "o aluno deve escolher entre Ingles ou Espanhol.",
        extra: ["Revisao: Transito - CTB - Parte 3 (4 missoes)", "Revisao: Direitos Humanos"]
      },
      {
        numero: "159",
        materia: "Etica e cidadania",
        assunto: "Etica e democracia: exercicio da cidadania. 5.1 Promocao da transparencia ativa e do acesso a informacao (Lei no 12.527/2011 e Decreto no 7.724/2012). 5.2. Tratamento de conflitos de interesses e nepotismo (Lei no 12.813/2013 e Decreto no 7.203/2010).",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Penal"]
      },
      {
        numero: "160",
        materia: "Geopolitica",
        assunto: "7 Rede de transporte no Brasil: modais e principais infraestruturas",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Transito - Resolucoes - Parte 1 (4 missoes)"]
      },
      {
        numero: "161",
        materia: "Ingles OU Espanhol",
        assunto: "VOCABULARIO",
        instrucoes: "Assistir as videoaulas e resolver questoes",
        obs: "o aluno deve escolher entre Ingles ou Espanhol.",
        extra: ["Revisao: Raciocinio Logico - Parte 2 (5 missoes)"]
      },
      {
        numero: "162",
        materia: "Geopolitica",
        assunto: "8 A integracao do Brasil ao processo de internacionalizacao da economia.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Parte 2 - Direito Constitucional (4 missoes)"]
      },
      {
        numero: "163",
        materia: "Ingles OU Espanhol",
        assunto: "REVISAO FINAL",
        instrucoes: "Assistir as videoaulas e resolver a lista de questoes.",
        obs: "o aluno deve escolher entre Ingles ou Espanhol.",
        extra: ["Revisao: Direito Penal - Parte 1 (5 missoes)"]
      },
      {
        numero: "164",
        materia: "Geopolitica",
        assunto: "10 Macrodivisao natural do espaco brasileiro: biomas, dominios e ecossistemas.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Legislacao Especial"]
      },
      {
        numero: "165",
        tema: "Revisao: Transito - Resolucoes - Parte 2 (5 missoes)"
      },
      {
        numero: "166",
        tema: "Revisao: Direito Penal - Parte 2 (5 missoes)"
      },
      {
        numero: "167",
        materia: "Geopolitica",
        assunto: "9 Geografia e gestao ambiental.",
        instrucoes: "Estudar a teoria pontual e resolver a lista de questoes.",
        extra: ["Revisao: Direito Processual Penal", "Revisao: Transito - CTB - Parte 4 (4 missoes)", "Revisao: Legislacao Especial - Parte 2 (5 missoes)"]
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
    titulo: "16a RODADA - SOMENTE PARA REVISAO (Missoes 170 a 184)",
    missoes: [
      { numero: "170", tema: "REVISAO: Materia: Portugues" },
      { numero: "171", tema: "REVISAO: Materia: Raciocinio Logico" },
      { numero: "172", tema: "REVISAO: Materia: Informatica" },
      { numero: "173", tema: "REVISAO: Materia: Transito - CTB" },
      { numero: "174", tema: "REVISAO: Materia: Direito Administrativo" },
      { numero: "175", tema: "REVISAO: Materia: Direito Constitucional" },
      { numero: "176", tema: "REVISAO: Materia: Direito Penal" },
      { numero: "177", tema: "REVISAO: Materia: Transito - Resolucoes" },
      { numero: "178", tema: "REVISAO: Materia: Fisica" },
      { numero: "179", tema: "REVISAO: Materia: Direito Processual Penal" },
      { numero: "180", tema: "REVISAO: Materia: Legislacao Especial" },
      { numero: "181", tema: "REVISAO: Materia: Direitos Humanos" },
      { numero: "182", tema: "REVISAO: Materia: Etica e Cidadania" },
      { numero: "183", tema: "REVISAO: Materia: Geopolitica" },
      { numero: "184", tema: "REVISAO: Materia: Ingles ou Espanhol" }
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
