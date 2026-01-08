// Re-export all constants
export * from './levelConfig';
export * from './theme';

// Initial states
import {
  UserStats,
  RawQuestion,
  Course,
  Comment,
  CommunityStats,
  Achievement,
  LeagueUser,
  StoreItem,
  Friend,
  LeagueTier,
} from '../types';

// Colors
export const COLORS = {
  BRAND: '#FFB800',
  BG_MAIN: '#1A1A1A',
  BG_CARD: '#252525',
  TEXT_MAIN: '#FFFFFF',
  TEXT_SEC: '#6E6E6E',
  SUCCESS: '#2ECC71',
  ERROR: '#E74C3C',
};


export const LOGO_FOR_LIGHT_THEME = "https://i.ibb.co/gZfHDygW/logo-ouse-claro.png";
export const LOGO_FOR_DARK_THEME = "https://i.ibb.co/27GBPsgN/logo-ouse-escuro2.png";
// Default to dark for fallback
export const LOGO_URL = LOGO_FOR_DARK_THEME;
export const USER_AVATAR_URL = "https://i.pravatar.cc/150?u=ousepassar";

export const INITIAL_USER_STATS: UserStats = {
  xp: 0,
  streak: 0,
  level: 1,
  correctAnswers: 0,
  totalAnswered: 0,
  coins: 0,
  avatarId: 'default',

};

// Onboarding steps (conforme documentação)
// 0. Início (Já tem conta? ou Criar conta)
// 1. Cadastro (Nome, Email, Celular, Senha)
// 2. Concurso (escolha do concurso alvo)
// 3. Nivelamento (Iniciante, Intermediário, Avançado)
// 4. Disponibilidade (dias + horas por dia)
// 5. Loading (geração da trilha) -> Redireciona para Home com Tour Guiado
export const ONBOARDING_STEPS = [
  'inicio',
  'cadastro',
  'concurso',
  'nivel',
  'disponibilidade',
  'loading',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

// Opções de nível
export const NIVEL_OPTIONS = [
  {
    id: 'iniciante',
    emoji: '🌱',
    title: 'Iniciante',
    desc: 'Estou começando do zero ou nunca fiz esse concurso.',
    config: 'Carga leve de questões'
  },
  {
    id: 'intermediario',
    emoji: '📖',
    title: 'Intermediário',
    desc: 'Já tenho uma base teórica e estudo regularmente.',
    config: 'Carga média de questões'
  },
  {
    id: 'avancado',
    emoji: '🎯',
    title: 'Avançado',
    desc: 'Já bati o edital e foco em alta performance e revisão.',
    config: 'Carga pesada de questões'
  },
];

// Tour steps para o guia inicial
export const TOUR_STEPS = [
  {
    id: 'trilha',
    title: 'Sua Trilha Visual',
    description: 'Este é seu mapa de estudos. Cada círculo é uma missão. Comece sempre pela próxima missão disponível!',
    emoji: '🗺️',
  },
  {
    id: 'gamificacao',
    title: 'XP e Moedas',
    description: 'Ganhe XP para subir de nível e moedas para trocar na loja. Você ganha automaticamente ao completar questões.',
    emoji: '💰',
  },
  {
    id: 'missao',
    title: 'Estrutura da Missão',
    description: 'Cada missão tem duas partes: Primeiro você aprende o Conteúdo, depois detona nas Questões.',
    emoji: '🎯',
  },
];

// Navigation items
export const NAV_ITEMS = [
  { id: 'home', label: 'Trilha', icon: 'Map' },
  { id: 'practice', label: 'Praticar', icon: 'Target' },
  { id: 'simulados', label: 'Simulados', icon: 'FileText' },
  { id: 'stats', label: 'Raio-X', icon: 'BarChart2' },
  { id: 'store', label: 'Loja', icon: 'ShoppingBag' },
] as const;

// Local storage keys
export const STORAGE_KEYS = {
  STATS: 'ousepassar_stats',
  HISTORY: 'ousepassar_history',
  INVENTORY: 'ousepassar_inventory',
  OWNED_COURSES: 'ousepassar_owned_courses',
  FLASHCARDS: 'ousepassar_flashcards',
  REVIEWS: 'ousepassar_reviews',
  ONBOARDING_COMPLETED: 'ousepassar_onboarding_completed',
  CURRENT_TRAIL: 'ousepassar_current_trail',
} as const;

// Courses
export const COURSES: Course[] = [
  {
    id: 'pf',
    title: 'Polícia Federal',
    subtitle: 'Agente',
    icon: '🕵️',
    image: 'https://i.ibb.co/vxyfpjFS/Gemini-Generated-Image-f8rt2kf8rt2kf8rt.png',
    isOwned: true
  },
  {
    id: 'prf',
    title: 'Polícia Rodoviária',
    subtitle: 'PRF - Policial',
    icon: '🚔',
    image: 'https://i.ibb.co/hxVQbCDs/Gemini-Generated-Image-9oquq19oquq19oqu.png',
    isOwned: true
  },
  {
    id: 'pc',
    title: 'Polícia Civil',
    subtitle: 'Investigador',
    icon: '🔍',
    image: 'https://i.ibb.co/0ybJHY41/Gemini-Generated-Image-x4an14x4an14x4an.png',
    isOwned: true
  },
  {
    id: 'perito',
    title: 'Perito Criminal',
    subtitle: 'Geral',
    icon: '🔬',
    image: 'https://i.ibb.co/DDHwtgzN/Gemini-Generated-Image-mu3a3omu3a3omu3a.png',
    isOwned: true
  },
  {
    id: 'tjsp',
    title: 'TJ-SP',
    subtitle: 'Escrevente Técnico',
    icon: '⚖️',
    image: 'https://i.ibb.co/vxyfpjFS/Gemini-Generated-Image-f8rt2kf8rt2kf8rt.png',
    isOwned: false,
    price: 'R$ 49,90'
  },
  {
    id: 'inss',
    title: 'INSS',
    subtitle: 'Técnico do Seguro Social',
    icon: '👴',
    image: 'https://i.ibb.co/0ybJHY41/Gemini-Generated-Image-x4an14x4an14x4an.png',
    isOwned: false,
    price: 'R$ 39,90'
  },
  {
    id: 'receita',
    title: 'Receita Federal',
    subtitle: 'Auditor Fiscal',
    icon: '🦁',
    image: 'https://i.ibb.co/DDHwtgzN/Gemini-Generated-Image-mu3a3omu3a3omu3a.png',
    isOwned: false,
    price: 'R$ 89,90'
  },
];

// Mock Statistics for questions
export const MOCK_STATS: Record<string, CommunityStats[]> = {
  default: [
    { alternative: 'A', percentage: 15 },
    { alternative: 'B', percentage: 10 },
    { alternative: 'C', percentage: 60 },
    { alternative: 'D', percentage: 10 },
    { alternative: 'E', percentage: 5 },
  ]
};

// Mock Comments
export const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Carlos Concurseiro',
    text: 'A pegadinha aqui está na palavra "exceto". Muita gente cai nisso!',
    likes: 45,
    dislikes: 2,
    timeAgo: '2h',
    replies: [
      {
        id: '1-1',
        author: 'Ana Paula',
        text: 'Verdade, Carlos! Eu quase marquei a B por falta de atenção.',
        likes: 12,
        dislikes: 0,
        timeAgo: '1h'
      }
    ]
  },
  {
    id: '2',
    author: 'Marcos Silva',
    text: 'Alguém tem o mnemônico para essa regra?',
    likes: 8,
    dislikes: 0,
    timeAgo: '5h',
    replies: []
  }
];

// Mock Achievements
export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'Primeiros Passos', description: 'Complete 10 questões.', icon: '👶', unlocked: true },
  { id: '2', name: 'Sniper', description: 'Acerte 5 questões seguidas.', icon: '🎯', unlocked: true },
  { id: '3', name: 'Dedicação Total', description: 'Estude por 7 dias seguidos.', icon: '🔥', unlocked: false },
  { id: '4', name: 'Mestre da Lei', description: 'Acerte 100 questões de Direito.', icon: '⚖️', unlocked: false },
];

// Mock League
export const MOCK_LEAGUE: LeagueUser[] = [
  { rank: 1, name: 'Ana Souza', xp: '1540 XP', avatar: 'https://i.pravatar.cc/150?u=1', isCurrentUser: false, trend: 'same' },
  { rank: 2, name: 'João Silva', xp: '1420 XP', avatar: 'https://i.pravatar.cc/150?u=2', isCurrentUser: false, trend: 'up' },
  { rank: 3, name: 'Você', xp: '1250 XP', avatar: USER_AVATAR_URL, isCurrentUser: true, trend: 'down' },
  { rank: 4, name: 'Marcos P.', xp: '1100 XP', avatar: 'https://i.pravatar.cc/150?u=4', isCurrentUser: false, trend: 'same' },
];

// Mock Ranking Data by League Tier
export const MOCK_RANKING_DATA: Record<LeagueTier, LeagueUser[]> = {
  ferro: [
    { rank: 1, name: 'Novato 01', xp: '500 XP', avatar: 'https://i.pravatar.cc/150?u=10', isCurrentUser: false, trend: 'same' },
    { rank: 2, name: 'Iniciante B', xp: '450 XP', avatar: 'https://i.pravatar.cc/150?u=11', isCurrentUser: false, trend: 'up' },
    { rank: 3, name: 'Estudante C', xp: '300 XP', avatar: 'https://i.pravatar.cc/150?u=12', isCurrentUser: false, trend: 'down' },
  ],
  bronze: [
    { rank: 1, name: 'Carlos D.', xp: '800 XP', avatar: 'https://i.pravatar.cc/150?u=13', isCurrentUser: false, trend: 'up' },
    { rank: 2, name: 'Fernanda L.', xp: '750 XP', avatar: 'https://i.pravatar.cc/150?u=14', isCurrentUser: false, trend: 'same' },
    { rank: 3, name: 'Bruno M.', xp: '700 XP', avatar: 'https://i.pravatar.cc/150?u=15', isCurrentUser: false, trend: 'down' },
  ],
  prata: [
    { rank: 1, name: 'Rafael S.', xp: '1200 XP', avatar: 'https://i.pravatar.cc/150?u=16', isCurrentUser: false, trend: 'up' },
    { rank: 2, name: 'Julia T.', xp: '1150 XP', avatar: 'https://i.pravatar.cc/150?u=17', isCurrentUser: false, trend: 'same' },
    { rank: 3, name: 'Lucas P.', xp: '1100 XP', avatar: 'https://i.pravatar.cc/150?u=18', isCurrentUser: false, trend: 'same' },
  ],
  ouro: MOCK_LEAGUE,
  diamante: [
    { rank: 1, name: 'Mestre Yoda', xp: '5000 XP', avatar: 'https://i.pravatar.cc/150?u=20', isCurrentUser: false, trend: 'same' },
    { rank: 2, name: 'Darth Vader', xp: '4800 XP', avatar: 'https://i.pravatar.cc/150?u=21', isCurrentUser: false, trend: 'up' },
    { rank: 3, name: 'Obi Wan', xp: '4500 XP', avatar: 'https://i.pravatar.cc/150?u=22', isCurrentUser: false, trend: 'down' },
  ]
};

// Mock Friends
export const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Juliana Paiva', avatar: 'https://i.pravatar.cc/150?u=juliana', courses: ['PRF', 'PF'], online: true },
  { id: 'f2', name: 'Pedro Henrique', avatar: 'https://i.pravatar.cc/150?u=pedro', courses: ['TJ-SP'], online: true },
  { id: 'f3', name: 'Mariana Lima', avatar: 'https://i.pravatar.cc/150?u=mariana', courses: ['INSS', 'Receita Federal'], online: false },
  { id: 'f4', name: 'Lucas Berti', avatar: 'https://i.pravatar.cc/150?u=lucas', courses: ['PF', 'PC-RJ'], online: true },
];

// Store Items
export const STORE_ITEMS: StoreItem[] = [
  { id: 'avatar_lion', name: 'Leão da Lei', description: 'Para quem domina a selva dos concursos.', price: 500, type: 'avatar', icon: '🦁', value: 'https://i.pravatar.cc/150?u=lion_king_law' },
  { id: 'avatar_robot', name: 'Robô Focado', description: 'Programado para não errar.', price: 800, type: 'avatar', icon: '🤖', value: 'https://i.pravatar.cc/150?u=robot_focus_ai' },
  { id: 'avatar_police', name: 'Agente Federal', description: 'O distintivo já é quase seu.', price: 1200, type: 'avatar', icon: '👮', value: 'https://i.pravatar.cc/150?u=police_agent_br' },
  { id: 'theme_cyber', name: 'Cyberpunk Neon', description: 'Visual futurista roxo e azul.', price: 1000, type: 'theme', icon: '🌃', value: 'cyberpunk' },
  { id: 'theme_darkblue', name: 'Azul Tático', description: 'Foco total com tons de azul.', price: 500, type: 'theme', icon: '🔵', value: 'darkblue' },
  { id: 'freeze_streak', name: 'Congelar Ofensiva', description: 'Protege seus dias seguidos por 24h.', price: 300, type: 'powerup', icon: '❄️' },
];

// Mock Questions
export const MOCK_QUESTIONS: RawQuestion[] = [
  {
    id: 14047,
    materia: "Língua Portuguesa",
    assunto: "Acentuação Gráfica",
    concurso: "IDECAN - 2022 - Oficial (PM MS)",
    enunciado: "Assinale a alternativa em que todas as palavras são acentuadas obedecendo à mesma regra de acentuação gráfica.",
    alternativas: "[{\"letter\":\"A\",\"text\":\"incêndio, mágoa, série\"}, {\"letter\":\"B\",\"text\":\"café, cipó, maracujá\"}, {\"letter\":\"C\",\"text\":\"lâmpada, trânsito, ângulo\"}, {\"letter\":\"D\",\"text\":\"fácil, caráter, tórax\"}, {\"letter\":\"E\",\"text\":\"hífen, pólen, éter\"}]",
    gabarito: "A",
    comentario: "GABARITO: LETRA A.\nIncêndio, mágoa e série são paroxítonas terminadas em ditongo crescente.",
    orgao: "PM MS",
    banca: "IDECAN",
    ano: 2022
  },
  {
    id: 14048,
    materia: "Direito Constitucional",
    assunto: "Direitos Fundamentais",
    concurso: "CEBRASPE - 2023 - PRF",
    enunciado: "Acerca dos direitos e garantias fundamentais, julgue o item a seguir. A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.",
    alternativas: "[{\"letter\":\"C\",\"text\":\"Certo\"}, {\"letter\":\"E\",\"text\":\"Errado\"}]",
    gabarito: "C",
    comentario: null,
    orgao: "PRF",
    banca: "CEBRASPE",
    ano: 2023,
    explicacaoPegadinha: "Muitos candidatos confundem 'durante o dia' com 'a qualquer horário' em caso de mandado judicial. Lembre-se: Determinação judicial APENAS durante o dia. A banca tentou te induzir ao erro omitindo detalhes contextuais comuns em outras questões."
  },
  {
    id: 14049,
    materia: "Informática",
    assunto: "Segurança da Informação",
    concurso: "FGV - 2023 - Receita Federal",
    enunciado: "O tipo de malware que sequestra os dados do usuário através de criptografia e exige pagamento de resgate é conhecido como:",
    alternativas: "[{\"letter\":\"A\",\"text\":\"Spyware\"}, {\"letter\":\"B\",\"text\":\"Ransomware\"}, {\"letter\":\"C\",\"text\":\"Adware\"}, {\"letter\":\"D\",\"text\":\"Worm\"}]",
    gabarito: "B",
    comentario: "Ransomware é o código malicioso que torna inacessíveis os dados armazenados em um equipamento, geralmente usando criptografia, e que exige pagamento de resgate.",
    orgao: "Receita Federal",
    banca: "FGV",
    ano: 2023
  },
  {
    id: 14050,
    materia: "Raciocínio Lógico",
    assunto: "Proposições Lógicas",
    concurso: "VUNESP - 2023 - TJ SP",
    enunciado: "Considere a afirmação: 'Se chove, então a rua molha'. A negação lógica dessa afirmação é:",
    alternativas: "[{\"letter\":\"A\",\"text\":\"Se não chove, a rua não molha.\"}, {\"letter\":\"B\",\"text\":\"Chove e a rua não molha.\"}, {\"letter\":\"C\",\"text\":\"Não chove e a rua molha.\"}, {\"letter\":\"D\",\"text\":\"Se a rua molha, então chove.\"}]",
    gabarito: "B",
    comentario: "A negação de uma condicional (Se P então Q) é dada por 'P e não Q'. Mantém a primeira E nega a segunda.",
    orgao: "TJ SP",
    banca: "VUNESP",
    ano: 2023
  },
  {
    id: 14051,
    materia: "Direito Administrativo",
    assunto: "Poderes Administrativos",
    concurso: "FCC - 2023 - TRT",
    enunciado: "O poder que a Administração Pública possui de punir internamente seus servidores por infrações funcionais é denominado poder:",
    alternativas: "[{\"letter\":\"A\",\"text\":\"Disciplinar\"}, {\"letter\":\"B\",\"text\":\"Hierárquico\"}, {\"letter\":\"C\",\"text\":\"Regulamentar\"}, {\"letter\":\"D\",\"text\":\"De Polícia\"}]",
    gabarito: "A",
    comentario: "Poder Disciplinar é a faculdade de punir as infrações funcionais dos servidores e demais pessoas sujeitas à disciplina dos órgãos públicos.",
    orgao: "TRT",
    banca: "FCC",
    ano: 2023
  },
  {
    id: 14052,
    materia: "Atualidades",
    assunto: "Geopolítica",
    concurso: "CESGRANRIO - 2023 - Banco do Brasil",
    enunciado: "Qual país recentemente ingressou na OTAN, expandindo a aliança militar no norte da Europa?",
    alternativas: "[{\"letter\":\"A\",\"text\":\"Suécia\"}, {\"letter\":\"B\",\"text\":\"Finlândia\"}, {\"letter\":\"C\",\"text\":\"Ucrânia\"}, {\"letter\":\"D\",\"text\":\"Áustria\"}]",
    gabarito: "B",
    comentario: "A Finlândia tornou-se oficialmente o 31º membro da OTAN em abril de 2023.",
    orgao: "BB",
    banca: "CESGRANRIO",
    ano: 2023
  }
];
