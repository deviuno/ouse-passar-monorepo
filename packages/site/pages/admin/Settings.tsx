import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  FileText,
  Gamepad2,
  ShoppingBag,
  Globe,
  Map as MapIcon,
  RefreshCw,
  CheckCircle,
  Info,
  Newspaper,
  Zap,
  Star,
  Medal,
  Trophy,
  Target,
  Calendar,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  TrendingUp,
  AlertCircle,
  Coins,
  Flame,
  Brain,
  Award,
  EyeOff,
  ChevronDown,
  BookOpen,
  Battery,
  HelpCircle,
  Users,
  Mail,
  Send,
  Eye,
  Key,
  TestTube,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

// Gamification services
import {
  getGamificationSettings,
  updateGamificationSettings,
  GamificationSettings,
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  Level,
  getLeagueTiers,
  createLeagueTier,
  updateLeagueTier,
  deleteLeagueTier,
  LeagueTier,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  Achievement,
} from '../../services/gamificationService';
import {
  planejamentoConquistasService,
  REQUISITO_TIPO_LABELS,
} from '../../services/planejamentoConquistasService';
import {
  PlanejamentoConquista,
  PlanejamentoConquistaRequisitoTipo,
} from '../../lib/database.types';
import {
  getAllLegalTexts,
  updateLegalText,
  LegalText,
  LegalTextId,
} from '../../services/legalTextsService';
import {
  getEmailTemplates,
  updateEmailTemplate,
  getEmailSettings,
  updateEmailSettings,
  getEmailLogs,
  testEmailConnection,
  replaceTemplateVariables,
  EmailTemplate,
  EmailSettings,
  EmailLog,
  PRODUTOS_EMAIL,
} from '../../services/emailService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// ============================================================================
// TYPES
// ============================================================================

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogSettings {
  id?: string;
  blog_name: string;
  blog_description: string;
  posts_per_page: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function parseSettingValue(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      if (value === 'true') return true;
      if (value === 'false') return false;
      const num = Number(value);
      if (!isNaN(num)) return num;
      return value;
    }
  }
  return value;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  simulado: {
    label: 'Simulados',
    icon: FileText,
    description: 'Configurações dos simulados e provas',
  },
  gamification: {
    label: 'Gamificação',
    icon: Gamepad2,
    description: 'XP, moedas, níveis, ligas e conquistas',
  },
  store: {
    label: 'Loja',
    icon: ShoppingBag,
    description: 'Preços e configurações da loja',
  },
  trail: {
    label: 'Trilha',
    icon: MapIcon,
    description: 'Configurações das missões e rodadas',
  },
  rodadas: {
    label: 'Distribuição de Missões',
    icon: Target,
    description: 'Configurações de tópicos por missão e revisão de matérias',
  },
  reta_final: {
    label: 'Reta Final',
    icon: Flame,
    description: 'Modo de estudo intensivo para provas próximas',
  },
  battery: {
    label: 'Bateria',
    icon: Battery,
    description: 'Sistema de energia para usuarios gratuitos',
  },
  affiliates: {
    label: 'Afiliação',
    icon: Users,
    description: 'Sistema de indicação e comissões para afiliados',
  },
  emails: {
    label: 'E-mails',
    icon: Mail,
    description: 'Templates e configurações de e-mails de boas-vindas',
  },
  legal_texts: {
    label: 'Textos Legais',
    icon: FileText,
    description: 'Termos de Uso e Politica de Privacidade',
  },
  general: {
    label: 'Geral',
    icon: Globe,
    description: 'Configurações gerais do sistema',
  },
  blog: {
    label: 'Blog',
    icon: Newspaper,
    description: 'Configurações do blog e SEO',
  },
};

const SETTING_LABELS: Record<string, string> = {
  // Simulado
  questions_per_simulado: 'Questões por Simulado',
  max_attempts: 'Máximo de Tentativas',
  different_exams_per_user: 'Provas Diferentes por Usuário',
  allow_chat: 'Permitir Chat',
  time_limit_minutes: 'Tempo Limite (minutos)',
  show_answers_after: 'Mostrar Respostas Após',
  allow_review: 'Permitir Revisão',
  randomize_questions: 'Randomizar Questões',
  randomize_options: 'Randomizar Alternativas',

  // Gamification
  xp_per_correct_answer: 'XP por Resposta Correta',
  xp_per_mission_complete: 'XP por Missão Completa',
  coins_per_correct_answer: 'Moedas por Resposta Correta',
  streak_bonus_multiplier: 'Multiplicador de Ofensiva',
  daily_goal_xp: 'Meta Diária de XP',

  // Store
  auto_create_simulado_product: 'Criar Simulado Automaticamente',

  // Trail
  questions_per_mission: 'Questões por Missão',
  missions_per_round: 'Missões por Rodada',
  min_score_to_pass: 'Pontuação Mínima (%)',
  allow_retry: 'Permitir Refazer',
  show_explanation: 'Mostrar Explicação',

  // Rodadas
  topicos_por_missao_isolados: 'Tópicos Isolados por Missão',
  topicos_por_missao_com_subtopicos: 'Tópicos com Sub-entradas por Missão',
  revisao_questoes_base: 'Questões Base na Revisão',
  revisao_questoes_decremento: 'Decremento por Rodada',
  revisao_questoes_minimo: 'Mínimo de Questões',
  materias_por_rodada: 'Matérias por Rodada',
  missoes_extras_repeticao: 'Missões Extras (Repetição)',

  // General
  maintenance_mode: 'Modo Manutenção',
  allow_new_registrations: 'Permitir Novos Cadastros',
  require_email_verification: 'Verificação de Email',
  max_preparatorios_per_user: 'Max Preparatórios por Usuário',

  // Reta Final / Afiliação
  is_enabled: 'Habilitado',
  question_percentage: 'Porcentagem de Questões (%)',
  min_questions_per_mission: 'Mínimo de Questões por Missão',

  // Battery
  max_battery: 'Capacidade Máxima',
  daily_recharge: 'Recarga Diária',
  recharge_hour: 'Hora da Recarga (0-23)',
  cost_per_question: 'Custo por Questão',
  cost_per_mission_start: 'Custo por Iniciar Missão',
  cost_per_chat_message: 'Custo por Mensagem no Chat',
  cost_per_chat_audio: 'Custo por Áudio no Chat',
  cost_per_chat_podcast: 'Custo por Podcast no Chat',
  cost_per_chat_summary: 'Custo por Resumo Rápido',
  cost_per_notebook_create: 'Custo por Criar Caderno',
  cost_per_practice_session: 'Custo por Sessão de Prática',
  max_preparatorios_free: 'Max Preparatórios (Gratuito)',
  chat_enabled_free: 'Chat Habilitado (Gratuito)',
  chat_requires_practice: 'Chat Requer Prática',
  chat_min_questions: 'Mínimo de Questões para Chat',
  notebooks_enabled_free: 'Cadernos Habilitados (Gratuito)',
  notebooks_max_free: 'Max Cadernos (Gratuito)',
  practice_enabled_free: 'Prática Habilitada (Gratuito)',
  unlimited_duration_months: 'Duração Bateria Ilimitada (meses)',

  // Afiliação
  points_per_referral: 'Pontos por Indicação',
  commission_rate: 'Taxa de Comissão (%)',
  min_withdrawal: 'Valor Mínimo para Saque (R$)',
  battery_reward_per_referral: 'Baterias por Indicação',
};

// Tooltips de ajuda para todos os campos de configuração
const SETTING_TOOLTIPS: Record<string, string> = {
  // ===== SIMULADO =====
  questions_per_simulado: 'Quantidade total de questões em cada simulado gerado. Recomendado: entre 60 e 120 questões.',
  max_attempts: 'Número máximo de vezes que o usuário pode refazer o simulado. Use -1 para tentativas ilimitadas.',
  different_exams_per_user: 'Quantidade de versões diferentes do simulado disponíveis para cada usuário.',
  allow_chat: 'Se ativado, o usuário poderá usar o chat com IA durante o simulado para tirar dúvidas.',
  time_limit_minutes: 'Tempo máximo para completar o simulado. 0 = sem limite de tempo.',
  show_answers_after: 'Quando mostrar o gabarito: "always" (sempre), "never" (nunca), ou "after_submit" (após enviar).',
  allow_review: 'Se ativado, o usuário pode revisar suas respostas antes de finalizar o simulado.',
  randomize_questions: 'Se ativado, a ordem das questões será diferente para cada tentativa.',
  randomize_options: 'Se ativado, a ordem das alternativas (A, B, C, D, E) será embaralhada.',

  // ===== GAMIFICAÇÃO =====
  xp_per_correct_answer: 'Pontos de XP ganhos por cada questão respondida corretamente.',
  xp_per_mission_complete: 'Bônus de XP ao completar uma missão inteira.',
  coins_per_correct_answer: 'Moedas ganhas por cada questão respondida corretamente.',
  streak_bonus_multiplier: 'Multiplicador aplicado às recompensas durante sequências de acertos.',
  daily_goal_xp: 'Meta diária de XP para manter a ofensiva (streak) ativa.',

  // ===== LOJA =====
  auto_create_simulado_product: 'Se ativado, um produto de simulado será criado automaticamente ao criar um novo preparatório.',

  // ===== TRILHA =====
  questions_per_mission: 'Quantidade padrão de questões em cada missão da trilha.',
  missions_per_round: 'Número de missões que compõem uma rodada de estudos.',
  min_score_to_pass: 'Porcentagem mínima de acertos para passar na missão (ex: 70 = 70%).',
  allow_retry: 'Se ativado, o usuário pode refazer missões que já completou.',
  show_explanation: 'Se ativado, mostra a explicação da questão após responder.',

  // ===== RODADAS =====
  topicos_por_missao_isolados: 'Quantidade máxima de tópicos isolados (sem sub-entradas) que podem ser agrupados em uma única missão. Tópicos isolados são aqueles que não possuem subtópicos.',
  topicos_por_missao_com_subtopicos: 'Quantidade máxima de itens (tópico pai + subtópicos) que podem ser agrupados em uma única missão quando o tópico possui sub-entradas.',
  revisao_questoes_base: 'Quantidade inicial de questões por matéria na primeira revisão após finalizar todos os tópicos. Exemplo: 25 questões.',
  revisao_questoes_decremento: 'Quantidade de questões a subtrair da revisão a cada rodada. Exemplo: se for 5, a sequência será 25→20→15→10→5.',
  revisao_questoes_minimo: 'Quantidade mínima de questões por matéria na revisão, independente do decremento. Quando atingir este valor, permanece fixo.',
  materias_por_rodada: 'Quantidade de matérias diferentes que serão estudadas em cada rodada. As matérias são escolhidas por ordem de prioridade.',
  missoes_extras_repeticao: 'Quantidade de missões extras por rodada que repetem as matérias mais relevantes (com mais tópicos restantes).',

  // ===== GERAL =====
  maintenance_mode: 'Se ativado, apenas administradores podem acessar o sistema. Usuários veem uma tela de manutenção.',
  allow_new_registrations: 'Se desativado, novos usuários não poderão se cadastrar na plataforma.',
  require_email_verification: 'Se ativado, o usuário precisa confirmar o email antes de acessar a plataforma.',
  max_preparatorios_per_user: 'Limite máximo de preparatórios por usuário (para usuários premium). 0 = ilimitado.',

  // ===== RETA FINAL =====
  is_enabled: 'Habilita ou desabilita o modo Reta Final globalmente para todos os preparatórios.',
  question_percentage: 'Porcentagem de questões no modo Reta Final em relação ao modo normal (ex: 50 = metade).',
  min_questions_per_mission: 'Número mínimo de questões por missão no modo Reta Final, independente da porcentagem.',

  // ===== BATERIA =====
  max_battery: 'Quantidade máxima de energia que um usuário gratuito pode ter. A energia é consumida ao realizar ações.',
  daily_recharge: 'Quantidade de energia restaurada automaticamente a cada dia. Não ultrapassa a capacidade máxima.',
  recharge_hour: 'Hora do dia em que a recarga automática acontece (formato 24h, ex: 0 = meia-noite, 12 = meio-dia).',
  cost_per_question: 'Energia consumida cada vez que o usuário responde uma questão.',
  cost_per_mission_start: 'Energia consumida ao iniciar uma missão de estudo.',
  cost_per_chat_message: 'Energia consumida ao enviar uma mensagem no chat com IA.',
  cost_per_chat_audio: 'Energia consumida ao solicitar geração de áudio no chat.',
  cost_per_chat_podcast: 'Energia consumida ao solicitar geração de podcast no chat.',
  cost_per_chat_summary: 'Energia consumida ao solicitar um resumo rápido no chat.',
  cost_per_notebook_create: 'Energia consumida ao criar um novo caderno de questões.',
  cost_per_practice_session: 'Energia consumida ao iniciar uma sessão de prática.',
  max_preparatorios_free: 'Número máximo de preparatórios que um usuário gratuito pode ter ativos simultaneamente.',
  chat_enabled_free: 'Se desativado, usuários gratuitos não terão acesso ao chat com IA.',
  chat_requires_practice: 'Se ativado, o usuário precisa praticar questões antes de poder usar o chat.',
  chat_min_questions: 'Número mínimo de questões que o usuário deve responder antes de liberar o chat.',
  notebooks_enabled_free: 'Se desativado, usuários gratuitos não poderão criar cadernos de questões.',
  notebooks_max_free: 'Número máximo de cadernos que um usuário gratuito pode criar.',
  practice_enabled_free: 'Se desativado, usuários gratuitos não terão acesso ao modo prática.',
  unlimited_duration_months: 'Tempo de validade da bateria ilimitada após a compra do Ouse Questões. Padrão: 12 meses.',

  // ===== AFILIAÇÃO =====
  points_per_referral: 'Quantidade de pontos que o usuário ganha quando alguém se cadastra usando seu link de indicação.',
  commission_rate: 'Porcentagem do valor da venda que o afiliado recebe como comissão quando um indicado faz uma compra.',
  min_withdrawal: 'Valor mínimo em reais que o afiliado precisa acumular para poder solicitar o saque das comissões.',
  battery_reward_per_referral: 'Quantidade de baterias extras que o usuário ganha por cada indicação confirmada.',
};

// Gamification sub-tabs
const GAMIFICATION_TABS = [
  { id: 'questoes', label: 'Questões', icon: Zap },
  { id: 'niveis', label: 'Níveis', icon: Star },
  { id: 'ligas', label: 'Ligas', icon: Medal },
  { id: 'conquistas', label: 'Conquistas', icon: Award },
  { id: 'conquistas-planejamento', label: 'Planejamento', icon: Calendar },
];

// Tutorial content for each gamification tab
const GAMIFICATION_TUTORIALS: Record<string, { title: string; content: string[] }> = {
  questoes: {
    title: 'Como funcionam as Recompensas de Questões',
    content: [
      'O sistema de XP e Moedas recompensa os alunos por cada atividade realizada na plataforma.',
      'XP por Resposta Correta: Quantidade de XP que o aluno ganha ao acertar uma questão no modo normal.',
      'XP por Acerto Hard Mode: Bônus adicional para questões respondidas no modo desafio (simulado).',
      'XP por Vitória/Derrota PvP: Recompensas para partidas no modo Player vs Player.',
      'Moedas: Podem ser usadas na loja para comprar itens, avatares e outros benefícios.',
      'XP por Nível: Define quantos pontos de XP são necessários para subir de nível.',
      'Fórmula de Nível: Linear (XP fixo por nível) ou Exponencial (XP aumenta a cada nível).',
    ],
  },
  niveis: {
    title: 'Como funciona o Sistema de Níveis',
    content: [
      'Os níveis representam o progresso do aluno na plataforma.',
      'Número do Nível: Identificador único do nível (1, 2, 3, etc.).',
      'Título: Nome exibido para o nível (ex: Iniciante, Estudante, Mestre).',
      'XP Mínimo: Quantidade de XP necessária para atingir este nível.',
      'Ícone e Cor: Personalização visual do nível.',
      'Recompensas: XP e Moedas bônus que o aluno recebe ao atingir o nível.',
      'Dica: Crie níveis com títulos motivacionais relacionados a concursos públicos!',
    ],
  },
  ligas: {
    title: 'Como funciona o Sistema de Ligas',
    content: [
      'As ligas criam competição saudável entre os alunos.',
      'Ferro, Bronze, Prata, Ouro, Diamante: Hierarquia das ligas.',
      'Ranking Semanal: Os alunos competem pelo XP ganho durante a semana.',
      'Promoção: Os 3 primeiros colocados sobem para a liga superior.',
      'Rebaixamento: Os 3 últimos colocados descem para a liga inferior.',
      'Reset Semanal: O ranking reinicia toda semana (configurável).',
      'Bônus de Promoção: XP e Moedas extras ao subir de liga.',
    ],
  },
  conquistas: {
    title: 'Como funcionam as Conquistas',
    content: [
      'Conquistas são prêmios que os alunos desbloqueiam ao atingir marcos.',
      'Categorias: Estudo, Streak, PvP, Nível, Social, Especial.',
      'Tipos de Requisito: Questões respondidas, Acertos, Dias de sequência, Nível, XP, etc.',
      'Valor do Requisito: Número que define a meta (ex: 100 questões, 7 dias de streak).',
      'Recompensas: XP e Moedas que o aluno ganha ao desbloquear.',
      'Conquistas Ocultas: Não aparecem na lista até serem desbloqueadas (surpresa!).',
      'Dica: Crie conquistas variadas para diferentes perfis de alunos.',
    ],
  },
  'conquistas-planejamento': {
    title: 'Como funcionam as Conquistas de Planejamento',
    content: [
      'Conquistas específicas para o sistema de planejamento de estudos.',
      'Missões Completadas: Número de missões finalizadas pelo aluno.',
      'Rodadas Completadas: Número de rodadas de estudo finalizadas.',
      'Dias Consecutivos: Sequência de dias estudando sem interrupção.',
      '% do Edital: Porcentagem do conteúdo do edital coberta.',
      'Esses achievements incentivam o uso do planejador de estudos.',
      'Dica: Crie conquistas progressivas (10, 50, 100 missões) para manter engajamento.',
    ],
  },
};

// Tutorial component
function TutorialSection({ tabId }: { tabId: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const tutorial = GAMIFICATION_TUTORIALS[tabId];

  if (!tutorial) return null;

  return (
    <div className="mt-8 border border-white/10 rounded-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-dark/50 hover:bg-brand-dark transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-yellow" />
          <span className="text-white font-bold uppercase text-sm tracking-wide">
            {tutorial.title}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="p-4 bg-brand-card border-t border-white/10">
          <ul className="space-y-3">
            {tutorial.content.map((item, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="text-brand-yellow font-bold">{index + 1}.</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SMALL COMPONENTS
// ============================================================================

interface SettingInputProps {
  setting: SystemSetting;
  value: any;
  onChange: (value: any) => void;
}

function SettingInput({ setting, value, onChange }: SettingInputProps) {
  const parsedValue = parseSettingValue(value);
  const isBoolean = typeof parsedValue === 'boolean' || value === 'true' || value === 'false';
  const isNumber = typeof parsedValue === 'number' && !isBoolean;

  if (isBoolean) {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={parsedValue === true || value === 'true'}
          onChange={(e) => onChange(e.target.checked.toString())}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
        <span className="ml-3 text-sm text-gray-400">
          {parsedValue ? 'Ativado' : 'Desativado'}
        </span>
      </label>
    );
  }

  if (isNumber) {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-xs bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
    />
  );
}

// ============================================================================
// BLOG SETTINGS SECTION
// ============================================================================

function BlogSettingsSection({
  blogSettings,
  setBlogSettings,
  onSave,
  saving,
}: {
  blogSettings: BlogSettings;
  setBlogSettings: (settings: BlogSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* General */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          Configurações Gerais do Blog
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome do Blog</label>
            <input
              type="text"
              value={blogSettings.blog_name}
              onChange={(e) => setBlogSettings({ ...blogSettings, blog_name: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Posts por Pagina</label>
            <input
              type="number"
              value={blogSettings.posts_per_page}
              onChange={(e) => setBlogSettings({ ...blogSettings, posts_per_page: parseInt(e.target.value) || 10 })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descricao do Blog</label>
            <textarea
              value={blogSettings.blog_description}
              onChange={(e) => setBlogSettings({ ...blogSettings, blog_description: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-24 rounded-sm"
            />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          SEO Padrao
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Title</label>
            <input
              type="text"
              value={blogSettings.meta_title}
              onChange={(e) => setBlogSettings({ ...blogSettings, meta_title: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Description</label>
            <textarea
              value={blogSettings.meta_description}
              onChange={(e) => setBlogSettings({ ...blogSettings, meta_description: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-24 rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Meta Keywords</label>
            <input
              type="text"
              value={blogSettings.meta_keywords}
              onChange={(e) => setBlogSettings({ ...blogSettings, meta_keywords: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
              placeholder="Separadas por virgula"
            />
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="bg-brand-card border border-white/10 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-white uppercase mb-6 border-b border-white/10 pb-2">
          Redes Sociais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Facebook URL</label>
            <input
              type="text"
              value={blogSettings.facebook_url}
              onChange={(e) => setBlogSettings({ ...blogSettings, facebook_url: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Instagram URL</label>
            <input
              type="text"
              value={blogSettings.instagram_url}
              onChange={(e) => setBlogSettings({ ...blogSettings, instagram_url: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">LinkedIn URL</label>
            <input
              type="text"
              value={blogSettings.linkedin_url}
              onChange={(e) => setBlogSettings({ ...blogSettings, linkedin_url: e.target.value })}
              className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors rounded-sm"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase tracking-wide hover:bg-brand-yellow/90 transition-colors flex items-center disabled:opacity-50 rounded-sm"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-3" />
          )}
          {saving ? 'Salvando...' : 'Salvar Blog'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// GAMIFICATION SECTION WITH HORIZONTAL TABS
// ============================================================================

const DEFAULT_GAMIFICATION_SETTINGS: GamificationSettings = {
  id: 'main',
  xp_per_correct_answer: 50,
  xp_per_correct_hard_mode: 100,
  xp_per_pvp_win: 200,
  xp_per_pvp_loss: 20,
  xp_per_flashcard_review: 50,
  xp_per_flashcard_remembered: 10,
  coins_per_correct_answer: 10,
  coins_per_correct_hard_mode: 20,
  coins_per_pvp_win: 50,
  coins_per_pvp_loss: 5,
  xp_per_level: 1000,
  level_formula: 'linear',
  daily_goal_questions: 50,
  daily_goal_xp_bonus: 100,
  daily_goal_coins_bonus: 50,
  streak_freeze_cost: 300,
  streak_7_day_xp_bonus: 200,
  streak_30_day_xp_bonus: 500,
  league_promotion_top: 5,
  league_demotion_bottom: 3,
  league_reset_day: 'sunday',
  srs_interval_easy: 7,
  srs_interval_medium: 3,
  srs_interval_hard: 0,
  srs_progression_steps: [1, 3, 7, 14, 30],
  is_gamification_enabled: true,
  show_xp_animations: true,
  show_level_up_modal: true,
};

const ACHIEVEMENT_CATEGORIES = ['estudo', 'streak', 'pvp', 'nivel', 'social', 'especial'];

const REQUIREMENT_TYPES = [
  { value: 'questions_answered', label: 'Questões Respondidas' },
  { value: 'correct_answers', label: 'Respostas Corretas' },
  { value: 'streak_days', label: 'Dias de Streak' },
  { value: 'pvp_wins', label: 'Vitórias PvP' },
  { value: 'level_reached', label: 'Nível Alcançado' },
  { value: 'xp_earned', label: 'XP Total' },
  { value: 'coins_earned', label: 'Moedas Total' },
  { value: 'flashcards_reviewed', label: 'Flashcards Revisados' },
  { value: 'subjects_mastered', label: 'Matérias Dominadas' },
  { value: 'custom', label: 'Personalizado' },
];

const REQUISITO_TIPOS: { value: PlanejamentoConquistaRequisitoTipo; label: string }[] = [
  { value: 'missoes_completadas', label: 'Missões Completadas' },
  { value: 'rodadas_completadas', label: 'Rodadas Completadas' },
  { value: 'dias_consecutivos', label: 'Dias Consecutivos' },
  { value: 'porcentagem_edital', label: '% do Edital' },
  { value: 'missoes_por_dia', label: 'Missões por Dia' },
  { value: 'tempo_estudo', label: 'Tempo de Estudo (min)' },
  { value: 'primeiro_acesso', label: 'Primeiro Acesso' },
  { value: 'semana_perfeita', label: 'Semana Perfeita' },
  { value: 'mes_perfeito', label: 'Mês Perfeito' },
  { value: 'custom', label: 'Personalizado' },
];

// Number Input Component
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, min = 0, max, suffix }) => (
  <div>
    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{suffix}</span>}
    </div>
  </div>
);

// Toggle Input Component
interface ToggleInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

const ToggleInput: React.FC<ToggleInputProps> = ({ label, checked, onChange, description }) => (
  <div className="flex items-center justify-between p-4 bg-brand-dark/50 rounded-sm">
    <div>
      <span className="text-white font-medium">{label}</span>
      {description && <p className="text-gray-500 text-xs mt-1">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-brand-yellow' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

// Setting Section Component
interface SettingSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, icon, children }) => (
  <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
    <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-6 flex items-center gap-3">
      {icon}
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  </div>
);

// ============================================================================
// LEGAL TEXTS SECTION
// ============================================================================

// ============================================================================
// EMAILS SECTION
// ============================================================================

const EMAIL_TABS = [
  { id: 'config', label: 'Configurações', icon: Key },
  { id: 'templates', label: 'Templates', icon: Mail },
  { id: 'logs', label: 'Histórico', icon: FileText },
];

function EmailsSection() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Config
  const [settings, setSettings] = useState<EmailSettings>({
    resend_api_key: '',
    remetente_email: '',
    remetente_nome: '',
    emails_ativos: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);

  // Quill editor config
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'align',
    'blockquote', 'link', 'color', 'background'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, templatesData, logsData] = await Promise.all([
        getEmailSettings(),
        getEmailTemplates(),
        getEmailLogs(50),
      ]);
      setSettings(settingsData);
      setTemplates(templatesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações de e-mail');
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateEmailSettings(settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!settings.resend_api_key) {
      toast.error('Configure a API Key do Resend primeiro');
      return;
    }

    setTesting(true);
    try {
      const result = await testEmailConnection();
      if (result.success) {
        toast.success('Conexão com Resend funcionando!');
      } else {
        toast.error(result.error || 'Falha na conexão');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar conexão');
    }
    setTesting(false);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      await updateEmailTemplate(editingTemplate.id, {
        assunto: editingTemplate.assunto,
        corpo_html: editingTemplate.corpo_html,
        corpo_texto: editingTemplate.corpo_texto,
        ativo: editingTemplate.ativo,
      });
      toast.success('Template salvo com sucesso!');
      setEditingTemplate(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto pb-px">
        {EMAIL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-brand-yellow border-brand-yellow'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Configurações */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-brand-card border border-white/10 rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold uppercase">Status do Serviço</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-gray-400 text-sm">E-mails ativos</span>
                <div
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.emails_ativos ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                  onClick={() => setSettings({ ...settings, emails_ativos: !settings.emails_ativos })}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.emails_ativos ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>
            <p className="text-gray-500 text-sm">
              {settings.emails_ativos
                ? 'Os e-mails de boas-vindas serão enviados automaticamente após cada compra.'
                : 'Os e-mails de boas-vindas estão desativados.'}
            </p>
          </div>

          {/* API Key */}
          <div className="bg-brand-card border border-white/10 rounded-sm p-6">
            <h3 className="text-white font-bold uppercase mb-4">Integração Resend</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  API Key do Resend
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.resend_api_key}
                      onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                      placeholder="re_xxxxxxxxxxxxxxxxx"
                      className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white placeholder-gray-600 focus:border-brand-yellow focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing || !settings.resend_api_key}
                    className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                    Testar
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-2">
                  Obtenha sua API Key em{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:underline">
                    resend.com/api-keys
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Remetente */}
          <div className="bg-brand-card border border-white/10 rounded-sm p-6">
            <h3 className="text-white font-bold uppercase mb-4">Remetente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  Nome do Remetente
                </label>
                <input
                  type="text"
                  value={settings.remetente_nome}
                  onChange={(e) => setSettings({ ...settings, remetente_nome: e.target.value })}
                  placeholder="Ouse Passar"
                  className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white placeholder-gray-600 focus:border-brand-yellow focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  E-mail do Remetente
                </label>
                <input
                  type="email"
                  value={settings.remetente_email}
                  onChange={(e) => setSettings({ ...settings, remetente_email: e.target.value })}
                  placeholder="noreply@ousepassar.com.br"
                  className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white placeholder-gray-600 focus:border-brand-yellow focus:outline-none"
                />
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-3">
              O domínio do e-mail deve estar verificado no Resend para funcionar corretamente.
            </p>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Tab: Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-brand-card border border-white/10 rounded-sm overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${template.ativo ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <div>
                    <h4 className="text-white font-bold">{template.nome_produto}</h4>
                    <p className="text-gray-500 text-xs">{template.produto}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(previewTemplate?.id === template.id ? null : template)}
                    className={`p-2 rounded transition-colors ${
                      previewTemplate?.id === template.id
                        ? 'bg-brand-yellow/20 text-brand-yellow'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTemplate(editingTemplate?.id === template.id ? null : template)}
                    className={`p-2 rounded transition-colors ${
                      editingTemplate?.id === template.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview */}
              {previewTemplate?.id === template.id && (
                <div className="p-4 bg-white">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: replaceTemplateVariables(template.corpo_html, {
                        nome: 'João Silva',
                        email: 'joao@exemplo.com',
                        produto: template.nome_produto,
                      }),
                    }}
                  />
                </div>
              )}

              {/* Editor */}
              {editingTemplate?.id === template.id && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Assunto do E-mail
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.assunto}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, assunto: e.target.value })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white focus:border-brand-yellow focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Corpo do E-mail (HTML)
                    </label>
                    <div className="email-editor">
                      <ReactQuill
                        theme="snow"
                        value={editingTemplate.corpo_html}
                        onChange={(value) => setEditingTemplate({ ...editingTemplate, corpo_html: value })}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Escreva o conteúdo do e-mail aqui..."
                      />
                    </div>
                    <p className="text-gray-600 text-xs mt-2">
                      Variáveis disponíveis: {'{{nome}}'}, {'{{email}}'}, {'{{produto}}'}
                    </p>
                    <style>{`
                      .email-editor {
                        background: #1a1a1a;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 2px;
                      }
                      .email-editor .ql-toolbar {
                        background: #2a2a2a;
                        border: none !important;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                        padding: 12px;
                      }
                      .email-editor .ql-container {
                        border: none !important;
                        font-size: 14px;
                        min-height: 250px;
                      }
                      .email-editor .ql-editor {
                        color: #ffffff;
                        min-height: 250px;
                        padding: 16px;
                      }
                      .email-editor .ql-editor.ql-blank::before {
                        color: rgba(255, 255, 255, 0.4);
                        font-style: normal;
                      }
                      .email-editor .ql-toolbar button {
                        color: #ffffff;
                      }
                      .email-editor .ql-toolbar button:hover {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar button.ql-active {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-stroke {
                        stroke: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-stroke:hover {
                        stroke: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-fill {
                        fill: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-fill:hover {
                        fill: #fbbf24;
                      }
                      .email-editor .ql-toolbar button:hover .ql-stroke {
                        stroke: #fbbf24;
                      }
                      .email-editor .ql-toolbar button:hover .ql-fill {
                        fill: #fbbf24;
                      }
                      .email-editor .ql-toolbar button.ql-active .ql-stroke {
                        stroke: #fbbf24;
                      }
                      .email-editor .ql-toolbar button.ql-active .ql-fill {
                        fill: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-picker-label {
                        color: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-picker-label:hover {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-picker-label.ql-active {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-picker-options {
                        background: #2a2a2a;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                      }
                      .email-editor .ql-toolbar .ql-picker-item {
                        color: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-picker-item:hover {
                        color: #fbbf24;
                      }
                      .email-editor .ql-editor h1,
                      .email-editor .ql-editor h2,
                      .email-editor .ql-editor h3,
                      .email-editor .ql-editor h4,
                      .email-editor .ql-editor h5,
                      .email-editor .ql-editor h6 {
                        color: #ffffff;
                      }
                      .email-editor .ql-editor a {
                        color: #fbbf24;
                      }
                      .email-editor .ql-editor blockquote {
                        border-left: 4px solid #fbbf24;
                        padding-left: 16px;
                        color: #a0a0a0;
                      }
                    `}</style>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Corpo do E-mail (Texto Puro)
                    </label>
                    <textarea
                      value={editingTemplate.corpo_texto}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, corpo_texto: e.target.value })}
                      rows={6}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white font-mono text-sm focus:border-brand-yellow focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTemplate.ativo}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, ativo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-brand-dark text-brand-yellow focus:ring-brand-yellow"
                      />
                      <span className="text-gray-400 text-sm">Template ativo</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={saving}
                        className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Histórico */}
      {activeTab === 'logs' && (
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold uppercase">Últimos E-mails Enviados</h3>
            <button
              onClick={loadData}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum e-mail enviado ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {log.status === 'sent' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{log.destinatario_email}</p>
                    <p className="text-gray-500 text-sm truncate">{log.assunto}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${
                      log.status === 'sent' ? 'text-green-500' :
                      log.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Falhou' : 'Pendente'}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEGAL TEXTS SECTION
// ============================================================================

const LEGAL_TEXT_LABELS: Record<LegalTextId, string> = {
  terms_of_service: 'Termos de Uso',
  privacy_policy: 'Politica de Privacidade',
};

function LegalTextsSection() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [texts, setTexts] = useState<LegalText[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    setLoading(true);
    setError(null);
    const { texts: data, error: err } = await getAllLegalTexts();
    if (err) {
      setError(err);
    } else {
      setTexts(data);
    }
    setLoading(false);
  };

  const handleEdit = (text: LegalText) => {
    setEditingId(text.id);
    setPreviewId(null);
    setFormData({
      title: text.title,
      content: text.content,
    });
  };

  const handlePreview = (text: LegalText) => {
    setPreviewId(previewId === text.id ? null : text.id);
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const { success, error: err } = await updateLegalText(id as LegalTextId, formData);

    if (err) {
      toast.error(err);
    } else if (success) {
      toast.success('Texto legal atualizado com sucesso!');
      setTexts(
        texts.map((t) =>
          t.id === id
            ? { ...t, ...formData, last_updated: new Date().toISOString() }
            : t
        )
      );
      setEditingId(null);
    }
    setSaving(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', content: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-500">
            Erro ao carregar textos legais. Execute a migracao SQL primeiro.
          </p>
        </div>
      )}

      {/* Legal Texts List */}
      {texts.map((text) => (
        <div
          key={text.id}
          className="bg-brand-card border border-white/5 rounded-sm overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {LEGAL_TEXT_LABELS[text.id as LegalTextId] || text.title}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Ultima atualizacao:{' '}
                  {new Date(text.last_updated).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                {editingId !== text.id && (
                  <>
                    <button
                      onClick={() => handlePreview(text)}
                      className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2"
                    >
                      <EyeOff className="w-4 h-4" />
                      {previewId === text.id ? 'Ocultar' : 'Visualizar'}
                    </button>
                    <button
                      onClick={() => handleEdit(text)}
                      className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm tracking-wide hover:bg-white transition-colors flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content - Preview Mode */}
          {previewId === text.id && editingId !== text.id && (
            <div className="p-6 bg-brand-dark/30">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                  {text.content}
                </div>
              </div>
            </div>
          )}

          {/* Content - Edit Mode */}
          {editingId === text.id && (
            <div className="p-6">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Titulo
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Conteudo (Markdown)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={20}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow font-mono text-sm"
                    placeholder="Digite o conteudo em Markdown..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Suporta Markdown: # Titulo, ## Subtitulo, **negrito**,
                    *italico*, - lista
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleSave(text.id)}
                    disabled={saving === text.id}
                    className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving === text.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Alteracoes
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving === text.id}
                    className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-bold mb-2">Sobre os Textos Legais</h3>
            <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
              <li>Os textos sao exibidos para os usuarios durante o cadastro</li>
              <li>Use Markdown para formatacao (titulos, listas, negrito, etc.)</li>
              <li>
                Sempre atualize a data no topo do documento ao fazer alteracoes
                significativas
              </li>
              <li>
                Consulte um advogado para garantir conformidade com LGPD e outras leis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function GamificationSection() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('questoes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Questoes (Settings)
  const [gamSettings, setGamSettings] = useState<GamificationSettings>(DEFAULT_GAMIFICATION_SETTINGS);

  // Niveis
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelEditingId, setLevelEditingId] = useState<number | null>(null);
  const [levelCreating, setLevelCreating] = useState(false);
  const [levelForm, setLevelForm] = useState<Partial<Level>>({});

  // Ligas
  const [tiers, setTiers] = useState<LeagueTier[]>([]);
  const [tierEditingId, setTierEditingId] = useState<string | null>(null);
  const [tierCreating, setTierCreating] = useState(false);
  const [tierForm, setTierForm] = useState<Partial<LeagueTier>>({});


  // Conquistas
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementEditingId, setAchievementEditingId] = useState<string | null>(null);
  const [achievementCreating, setAchievementCreating] = useState(false);
  const [achievementForm, setAchievementForm] = useState<Partial<Achievement>>({});
  const [achievementFilter, setAchievementFilter] = useState('');

  // Conquistas Planejamento
  const [planejamentoConquistas, setPlanejamentoConquistas] = useState<PlanejamentoConquista[]>([]);
  const [planejamentoEditingId, setPlanejamentoEditingId] = useState<string | null>(null);
  const [planejamentoCreating, setPlanejamentoCreating] = useState(false);
  const [planejamentoForm, setPlanejamentoForm] = useState<any>({});
  const [planejamentoFilter, setPlanejamentoFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load gamification settings
      const { settings: gamData } = await getGamificationSettings();
      if (gamData) setGamSettings(gamData);

      // Load levels
      const { levels: levelsData } = await getLevels();
      setLevels(levelsData);

      // Load tiers
      const { tiers: tiersData } = await getLeagueTiers();
      setTiers(tiersData);

      // Load achievements
      const { achievements: achievementsData } = await getAchievements();
      setAchievements(achievementsData);

      // Load planejamento conquistas
      try {
        const planejamentoData = await planejamentoConquistasService.getAll(true);
        setPlanejamentoConquistas(planejamentoData);
      } catch (e) {
        console.error('Error loading planejamento conquistas:', e);
      }
    } catch (e) {
      setError('Erro ao carregar dados');
      console.error(e);
    }

    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const { success, error: err } = await updateGamificationSettings(gamSettings);
    if (success) {
      toast.success('Configurações salvas com sucesso!');
    } else {
      toast.error(err || 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleResetSettings = () => {
    setGamSettings(DEFAULT_GAMIFICATION_SETTINGS);
    toast.info('Configurações restauradas para o padrão');
  };

  const updateSetting = <K extends keyof GamificationSettings>(key: K, value: GamificationSettings[K]) => {
    setGamSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  // Render horizontal tabs
  return (
    <div>
      {/* Horizontal Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto pb-px">
        {GAMIFICATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-brand-yellow border-brand-yellow'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-500">
            Algumas tabelas nao foram encontradas. Execute as migrations SQL primeiro.
          </p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'questoes' && (
        <div>
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={handleResetSettings}
              className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>

          <SettingSection title="Sistema de XP" icon={<Zap className="w-5 h-5 text-brand-yellow" />}>
            <NumberInput label="XP por Acerto (Normal)" value={gamSettings.xp_per_correct_answer} onChange={(v) => updateSetting('xp_per_correct_answer', v)} suffix="XP" />
            <NumberInput label="XP por Acerto (Desafio)" value={gamSettings.xp_per_correct_hard_mode} onChange={(v) => updateSetting('xp_per_correct_hard_mode', v)} suffix="XP" />
            <NumberInput label="XP por Vitoria PvP" value={gamSettings.xp_per_pvp_win} onChange={(v) => updateSetting('xp_per_pvp_win', v)} suffix="XP" />
            <NumberInput label="XP por Derrota PvP" value={gamSettings.xp_per_pvp_loss} onChange={(v) => updateSetting('xp_per_pvp_loss', v)} suffix="XP" />
            <NumberInput label="XP por Revisao Flashcard" value={gamSettings.xp_per_flashcard_review} onChange={(v) => updateSetting('xp_per_flashcard_review', v)} suffix="XP" />
            <NumberInput label="XP por Card Lembrado" value={gamSettings.xp_per_flashcard_remembered} onChange={(v) => updateSetting('xp_per_flashcard_remembered', v)} suffix="XP" />
          </SettingSection>

          <SettingSection title="Sistema de Moedas" icon={<Coins className="w-5 h-5 text-yellow-500" />}>
            <NumberInput label="Moedas por Acerto (Normal)" value={gamSettings.coins_per_correct_answer} onChange={(v) => updateSetting('coins_per_correct_answer', v)} />
            <NumberInput label="Moedas por Acerto (Desafio)" value={gamSettings.coins_per_correct_hard_mode} onChange={(v) => updateSetting('coins_per_correct_hard_mode', v)} />
            <NumberInput label="Moedas por Vitoria PvP" value={gamSettings.coins_per_pvp_win} onChange={(v) => updateSetting('coins_per_pvp_win', v)} />
            <NumberInput label="Moedas por Derrota PvP" value={gamSettings.coins_per_pvp_loss} onChange={(v) => updateSetting('coins_per_pvp_loss', v)} />
          </SettingSection>

          <SettingSection title="Sistema de Níveis" icon={<TrendingUp className="w-5 h-5 text-green-500" />}>
            <NumberInput label="XP por Nivel" value={gamSettings.xp_per_level} onChange={(v) => updateSetting('xp_per_level', v)} suffix="XP" />
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Formula de Progressao</label>
              <select
                value={gamSettings.level_formula}
                onChange={(e) => updateSetting('level_formula', e.target.value as 'linear' | 'exponential')}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
              >
                <option value="linear">Linear (XP fixo por nivel)</option>
                <option value="exponential">Exponencial (XP aumenta)</option>
              </select>
            </div>
          </SettingSection>

          <SettingSection title="Meta Diaria" icon={<Target className="w-5 h-5 text-blue-500" />}>
            <NumberInput label="Questões por Dia" value={gamSettings.daily_goal_questions} onChange={(v) => updateSetting('daily_goal_questions', v)} />
            <NumberInput label="Bonus XP ao Completar" value={gamSettings.daily_goal_xp_bonus} onChange={(v) => updateSetting('daily_goal_xp_bonus', v)} suffix="XP" />
            <NumberInput label="Bonus Moedas ao Completar" value={gamSettings.daily_goal_coins_bonus} onChange={(v) => updateSetting('daily_goal_coins_bonus', v)} />
          </SettingSection>

          <SettingSection title="Sistema de Streak" icon={<Flame className="w-5 h-5 text-orange-500" />}>
            <NumberInput label="Custo do Congelamento" value={gamSettings.streak_freeze_cost} onChange={(v) => updateSetting('streak_freeze_cost', v)} suffix="moedas" />
            <NumberInput label="Bonus 7 Dias Seguidos" value={gamSettings.streak_7_day_xp_bonus} onChange={(v) => updateSetting('streak_7_day_xp_bonus', v)} suffix="XP" />
            <NumberInput label="Bonus 30 Dias Seguidos" value={gamSettings.streak_30_day_xp_bonus} onChange={(v) => updateSetting('streak_30_day_xp_bonus', v)} suffix="XP" />
          </SettingSection>

          <SettingSection title="Liga / Ranking" icon={<Trophy className="w-5 h-5 text-purple-500" />}>
            <NumberInput label="Top N Promovidos" value={gamSettings.league_promotion_top} onChange={(v) => updateSetting('league_promotion_top', v)} />
            <NumberInput label="Ultimos N Rebaixados" value={gamSettings.league_demotion_bottom} onChange={(v) => updateSetting('league_demotion_bottom', v)} />
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dia do Reset Semanal</label>
              <select
                value={gamSettings.league_reset_day}
                onChange={(e) => updateSetting('league_reset_day', e.target.value)}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
              >
                <option value="sunday">Domingo</option>
                <option value="monday">Segunda-feira</option>
                <option value="saturday">Sabado</option>
              </select>
            </div>
          </SettingSection>

          <SettingSection title="Repeticao Espacada (SRS)" icon={<Brain className="w-5 h-5 text-pink-500" />}>
            <NumberInput label="Intervalo Facil" value={gamSettings.srs_interval_easy} onChange={(v) => updateSetting('srs_interval_easy', v)} suffix="dias" />
            <NumberInput label="Intervalo Medio" value={gamSettings.srs_interval_medium} onChange={(v) => updateSetting('srs_interval_medium', v)} suffix="dias" />
            <NumberInput label="Intervalo Dificil" value={gamSettings.srs_interval_hard} onChange={(v) => updateSetting('srs_interval_hard', v)} suffix="dias" />
          </SettingSection>

          <div className="bg-brand-card border border-white/5 rounded-sm p-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-6 flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
              Configurações Gerais
            </h2>
            <div className="space-y-4">
              <ToggleInput label="Gamificação Ativa" checked={gamSettings.is_gamification_enabled} onChange={(v) => updateSetting('is_gamification_enabled', v)} description="Desativar remove todo o sistema de XP, moedas e níveis do app" />
              <ToggleInput label="Mostrar Animacoes de XP" checked={gamSettings.show_xp_animations} onChange={(v) => updateSetting('show_xp_animations', v)} description="Animacoes visuais ao ganhar XP" />
              <ToggleInput label="Mostrar Modal de Level Up" checked={gamSettings.show_level_up_modal} onChange={(v) => updateSetting('show_level_up_modal', v)} description="Modal de celebracao ao subir de nivel" />
            </div>
          </div>

          <TutorialSection tabId="questoes" />
        </div>
      )}

      {activeTab === 'niveis' && (
        <div>
          <LevelsTab
          levels={levels}
          setLevels={setLevels}
          editingId={levelEditingId}
          setEditingId={setLevelEditingId}
          isCreating={levelCreating}
          setIsCreating={setLevelCreating}
          formData={levelForm}
          setFormData={setLevelForm}
          />
          <TutorialSection tabId="niveis" />
        </div>
      )}

      {activeTab === 'ligas' && (
        <div>
          <LeaguesTab
          tiers={tiers}
          setTiers={setTiers}
          editingId={tierEditingId}
          setEditingId={setTierEditingId}
          isCreating={tierCreating}
          setIsCreating={setTierCreating}
          formData={tierForm}
          setFormData={setTierForm}
          />
          <TutorialSection tabId="ligas" />
        </div>
      )}

      {activeTab === 'conquistas' && (
        <div>
          <AchievementsTab
          achievements={achievements}
          setAchievements={setAchievements}
          editingId={achievementEditingId}
          setEditingId={setAchievementEditingId}
          isCreating={achievementCreating}
          setIsCreating={setAchievementCreating}
          formData={achievementForm}
          setFormData={setAchievementForm}
          filterCategory={achievementFilter}
          setFilterCategory={setAchievementFilter}
          />
          <TutorialSection tabId="conquistas" />
        </div>
      )}

      {activeTab === 'conquistas-planejamento' && (
        <div>
          <PlanejamentoConquistasTab
          conquistas={planejamentoConquistas}
          setConquistas={setPlanejamentoConquistas}
          editingId={planejamentoEditingId}
          setEditingId={setPlanejamentoEditingId}
          isCreating={planejamentoCreating}
          setIsCreating={setPlanejamentoCreating}
          formData={planejamentoForm}
          setFormData={setPlanejamentoForm}
          filterTipo={planejamentoFilter}
          setFilterTipo={setPlanejamentoFilter}
          />
          <TutorialSection tabId="conquistas-planejamento" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEVELS TAB
// ============================================================================

function LevelsTab({
  levels, setLevels, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData,
}: {
  levels: Level[];
  setLevels: (l: Level[]) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  isCreating: boolean;
  setIsCreating: (v: boolean) => void;
  formData: Partial<Level>;
  setFormData: (d: Partial<Level>) => void;
}) {
  const toast = useToast();

  const resetForm = () => {
    setFormData({
      level_number: levels.length + 1,
      title: '',
      min_xp: levels.length > 0 ? (levels[levels.length - 1]?.min_xp || 0) + 1000 : 0,
      icon: '',
      color: '#FFB800',
      rewards_xp: 0,
      rewards_coins: 0,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error('Titulo e obrigatorio');
      return;
    }
    const { level, error } = await createLevel({
      level_number: formData.level_number || levels.length + 1,
      title: formData.title,
      min_xp: formData.min_xp || 0,
      icon: formData.icon || '',
      color: formData.color || '#FFB800',
      rewards_xp: formData.rewards_xp || 0,
      rewards_coins: formData.rewards_coins || 0,
      is_active: formData.is_active ?? true,
    });
    if (error) {
      toast.error(error);
    } else if (level) {
      setLevels([...levels, level].sort((a, b) => a.level_number - b.level_number));
      setIsCreating(false);
      resetForm();
      toast.success('Nivel criado!');
    }
  };

  const handleUpdate = async (id: number) => {
    const { success, error } = await updateLevel(id, formData);
    if (error) {
      toast.error(error);
    } else if (success) {
      setLevels(levels.map((l) => (l.id === id ? { ...l, ...formData } : l)).sort((a, b) => a.level_number - b.level_number));
      setEditingId(null);
      resetForm();
      toast.success('Nivel atualizado!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este nivel?')) return;
    const { success, error } = await deleteLevel(id);
    if (error) {
      toast.error(error);
    } else if (success) {
      setLevels(levels.filter((l) => l.id !== id));
      toast.success('Nivel excluido!');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setIsCreating(true); resetForm(); }}
          disabled={isCreating}
          className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Novo Nivel
        </button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Novo Nivel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Numero</label>
              <input type="number" min="1" value={formData.level_number} onChange={(e) => setFormData({ ...formData, level_number: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Titulo</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP Minimo</label>
              <input type="number" min="0" value={formData.min_xp} onChange={(e) => setFormData({ ...formData, min_xp: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icone</label>
              <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cor</label>
              <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 bg-transparent border border-white/10 rounded-sm cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus XP</label>
              <input type="number" min="0" value={formData.rewards_xp} onChange={(e) => setFormData({ ...formData, rewards_xp: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus Moedas</label>
              <input type="number" min="0" value={formData.rewards_coins} onChange={(e) => setFormData({ ...formData, rewards_coins: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                <span className="text-white">Ativo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-dark/50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Nivel</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Titulo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">XP Min</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Icone</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Cor</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Bonus</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {levels.map((level) => (
              <tr key={level.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white font-bold">{level.level_number}</td>
                <td className="px-4 py-3 text-white">{level.title}</td>
                <td className="px-4 py-3 text-gray-400">{level.min_xp.toLocaleString()}</td>
                <td className="px-4 py-3 text-lg">{level.icon}</td>
                <td className="px-4 py-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: level.color }} /></td>
                <td className="px-4 py-3 text-brand-yellow text-sm">{level.rewards_xp} XP {level.rewards_coins > 0 && <span className="text-yellow-500">+ {level.rewards_coins}</span>}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${level.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>{level.is_active ? 'Ativo' : 'Inativo'}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingId(level.id); setFormData({ ...level }); }} className="p-1.5 text-gray-400 hover:text-brand-yellow"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(level.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {levels.length === 0 && <div className="text-center py-12 text-gray-400">Nenhum nivel cadastrado</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEAGUES TAB (Simplified)
// ============================================================================

function LeaguesTab({ tiers, setTiers, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData }: any) {
  const toast = useToast();
  const resetForm = () => setFormData({ id: '', name: '', display_order: tiers.length + 1, icon: '', color: '#FFB800', bg_color: '#1a1a1a', promotion_bonus_xp: 0, promotion_bonus_coins: 0, is_active: true });

  const handleCreate = async () => {
    if (!formData.id || !formData.name) { toast.error('ID e Nome obrigatorios'); return; }
    const { tier, error } = await createLeagueTier({ ...formData, min_xp_to_enter: null });
    if (error) toast.error(error);
    else if (tier) { setTiers([...tiers, tier].sort((a: any, b: any) => a.display_order - b.display_order)); setIsCreating(false); resetForm(); toast.success('Liga criada!'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir liga?')) return;
    const { success, error } = await deleteLeagueTier(id);
    if (error) toast.error(error);
    else if (success) { setTiers(tiers.filter((t: any) => t.id !== id)); toast.success('Liga excluida!'); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Liga</button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Liga</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm text-gray-400 mb-1">ID</label><input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Ordem</label><input type="number" min="1" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Icone</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Cor</label><input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 bg-transparent border border-white/10 rounded-sm" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Bonus XP</label><input type="number" min="0" value={formData.promotion_bonus_xp} onChange={(e) => setFormData({ ...formData, promotion_bonus_xp: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Bonus Moedas</label><input type="number" min="0" value={formData.promotion_bonus_coins} onChange={(e) => setFormData({ ...formData, promotion_bonus_coins: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((tier: LeagueTier) => (
          <div key={tier.id} className="bg-brand-card border border-white/5 rounded-sm overflow-hidden" style={{ borderColor: tier.is_active ? `${tier.color}30` : undefined }}>
            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: tier.bg_color }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: tier.color }}>{tier.icon}</div>
              <div>
                <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                <p className="text-gray-400 text-xs uppercase">Ordem: {tier.display_order}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-500 text-xs">Bonus XP</span><p className="text-brand-yellow font-bold">{tier.promotion_bonus_xp}</p></div>
                <div><span className="text-gray-500 text-xs">Bonus Moedas</span><p className="text-yellow-500 font-bold">{tier.promotion_bonus_coins}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(tier.id)} className="flex-1 px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {tiers.length === 0 && <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm text-gray-400">Nenhuma liga cadastrada</div>}
    </div>
  );
}

// ============================================================================
// ACHIEVEMENTS TAB (Simplified)
// ============================================================================

function AchievementsTab({ achievements, setAchievements, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData, filterCategory, setFilterCategory }: any) {
  const toast = useToast();
  const resetForm = () => setFormData({ id: '', name: '', description: '', icon: '', category: 'estudo', requirement_type: 'questions_answered', requirement_value: 1, xp_reward: 0, coins_reward: 0, is_active: true, is_hidden: false });

  const handleCreate = async () => {
    if (!formData.id || !formData.name) { toast.error('ID e Nome obrigatorios'); return; }
    const { achievement, error } = await createAchievement({ ...formData, display_order: achievements.length, unlock_message: null });
    if (error) toast.error(error);
    else if (achievement) { setAchievements([...achievements, achievement]); setIsCreating(false); resetForm(); toast.success('Conquista criada!'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir conquista?')) return;
    const { success, error } = await deleteAchievement(id);
    if (error) toast.error(error);
    else if (success) { setAchievements(achievements.filter((a: any) => a.id !== id)); toast.success('Conquista excluida!'); }
  };

  const filtered = filterCategory ? achievements.filter((a: any) => a.category === filterCategory) : achievements;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory('')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterCategory === '' ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>Todas ({achievements.length})</button>
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const count = achievements.filter((a: any) => a.category === cat).length;
            return <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterCategory === cat ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>{cat} ({count})</button>;
          })}
        </div>
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Nova</button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Conquista</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm text-gray-400 mb-1">ID</label><input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Icone</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Categoria</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white">{ACHIEVEMENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Tipo Requisito</label><select value={formData.requirement_type} onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white">{REQUIREMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Valor</label><input type="number" min="1" value={formData.requirement_value} onChange={(e) => setFormData({ ...formData, requirement_value: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">XP</label><input type="number" min="0" value={formData.xp_reward} onChange={(e) => setFormData({ ...formData, xp_reward: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Moedas</label><input type="number" min="0" value={formData.coins_reward} onChange={(e) => setFormData({ ...formData, coins_reward: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((achievement: Achievement) => (
          <div key={achievement.id} className={`bg-brand-card border rounded-sm overflow-hidden ${achievement.is_active ? 'border-white/5' : 'border-gray-700/50 opacity-60'}`}>
            <div className="p-4 flex items-center gap-4 bg-brand-dark/30">
              <div className="w-14 h-14 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-3xl">{achievement.icon || '?'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{achievement.name}</h3>
                  {achievement.is_hidden && <EyeOff className="w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-gray-500 text-xs uppercase">{achievement.category}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{achievement.description || 'Sem descricao'}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-500 text-xs block">Requisito</span><p className="text-white">{REQUIREMENT_TYPES.find((t) => t.value === achievement.requirement_type)?.label}: <span className="text-brand-yellow font-bold">{achievement.requirement_value}</span></p></div>
                <div><span className="text-gray-500 text-xs block">Recompensa</span><p className="text-brand-yellow font-bold">{achievement.xp_reward} XP {achievement.coins_reward > 0 && <span className="text-yellow-500">+ {achievement.coins_reward}</span>}</p></div>
              </div>
              <button onClick={() => handleDelete(achievement.id)} className="w-full px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm text-gray-400">Nenhuma conquista {filterCategory && `na categoria "${filterCategory}"`}</div>}
    </div>
  );
}

// ============================================================================
// PLANEJAMENTO CONQUISTAS TAB (Simplified)
// ============================================================================

function PlanejamentoConquistasTab({ conquistas, setConquistas, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData, filterTipo, setFilterTipo }: any) {
  const toast = useToast();
  const resetForm = () => setFormData({ id: '', nome: '', descricao: '', icone: '', requisito_tipo: 'missoes_completadas', requisito_valor: 1, xp_recompensa: 0, moedas_recompensa: 0, is_active: true, is_hidden: false, ordem: conquistas.length });

  const handleCreate = async () => {
    if (!formData.id || !formData.nome) { toast.error('ID e Nome obrigatorios'); return; }
    try {
      const conquista = await planejamentoConquistasService.create({ ...formData, icone: formData.icone || '🏆', mensagem_desbloqueio: null });
      setConquistas([...conquistas, conquista]);
      setIsCreating(false);
      resetForm();
      toast.success('Conquista criada!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir conquista?')) return;
    try {
      await planejamentoConquistasService.delete(id);
      setConquistas(conquistas.filter((c: any) => c.id !== id));
      toast.success('Conquista excluida!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const tipoCounts = conquistas.reduce((acc: any, c: any) => { acc[c.requisito_tipo] = (acc[c.requisito_tipo] || 0) + 1; return acc; }, {});
  const filtered = filterTipo ? conquistas.filter((c: any) => c.requisito_tipo === filterTipo) : conquistas;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterTipo('')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterTipo === '' ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>Todas ({conquistas.length})</button>
          {REQUISITO_TIPOS.filter((t) => tipoCounts[t.value]).map((tipo) => (
            <button key={tipo.value} onClick={() => setFilterTipo(tipo.value)} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterTipo === tipo.value ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>{tipo.label} ({tipoCounts[tipo.value] || 0})</button>
          ))}
        </div>
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Nova</button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Conquista de Planejamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm text-gray-400 mb-1">ID</label><input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Icone</label><input type="text" value={formData.icone} onChange={(e) => setFormData({ ...formData, icone: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Tipo Requisito</label><select value={formData.requisito_tipo} onChange={(e) => setFormData({ ...formData, requisito_tipo: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white">{REQUISITO_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Valor</label><input type="number" min="0" value={formData.requisito_valor} onChange={(e) => setFormData({ ...formData, requisito_valor: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">XP</label><input type="number" min="0" value={formData.xp_recompensa} onChange={(e) => setFormData({ ...formData, xp_recompensa: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Moedas</label><input type="number" min="0" value={formData.moedas_recompensa} onChange={(e) => setFormData({ ...formData, moedas_recompensa: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm text-gray-400 mb-1">Descricao</label><input type="text" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((conquista: PlanejamentoConquista) => (
          <div key={conquista.id} className={`bg-brand-card border rounded-sm overflow-hidden ${conquista.is_active ? 'border-white/5' : 'border-gray-700/50 opacity-60'}`}>
            <div className="p-4 flex items-center gap-4 bg-brand-dark/30">
              <div className="w-14 h-14 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-3xl">{conquista.icone || '?'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{conquista.nome}</h3>
                  {conquista.is_hidden && <EyeOff className="w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-gray-500 text-xs uppercase">{REQUISITO_TIPO_LABELS[conquista.requisito_tipo]}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{conquista.descricao || 'Sem descricao'}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-500 text-xs block">Requisito</span><p className="text-brand-yellow font-bold">{conquista.requisito_valor}</p></div>
                <div><span className="text-gray-500 text-xs block">Recompensa</span><p className="text-brand-yellow font-bold">{conquista.xp_recompensa} XP {conquista.moedas_recompensa > 0 && <span className="text-yellow-500">+ {conquista.moedas_recompensa}</span>}</p></div>
              </div>
              <button onClick={() => handleDelete(conquista.id)} className="w-full px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm text-gray-400">Nenhuma conquista {filterTipo && `do tipo "${REQUISITO_TIPO_LABELS[filterTipo as PlanejamentoConquistaRequisitoTipo]}"`}</div>}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Settings: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [modifiedSettings, setModifiedSettings] = useState<Map<string, any>>(new Map());
  const [activeCategory, setActiveCategory] = useState<string>('simulado');

  // Blog settings
  const [blogSettings, setBlogSettings] = useState<BlogSettings>({
    blog_name: '',
    blog_description: '',
    posts_per_page: 10,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
  });

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // Load system settings
      const { data: systemData, error: systemError } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (!systemError && systemData) {
        setSettings(systemData);
      }

      // Load blog settings
      const { data: blogData, error: blogError } = await (supabase as any)
        .from('admin_settings')
        .select('*')
        .maybeSingle();

      if (!blogError && blogData) {
        setBlogSettings({
          id: blogData.id,
          blog_name: blogData.blog_name || '',
          blog_description: blogData.blog_description || '',
          posts_per_page: blogData.posts_per_page || 10,
          meta_title: blogData.meta_title || '',
          meta_description: blogData.meta_description || '',
          meta_keywords: blogData.meta_keywords || '',
          facebook_url: blogData.facebook_url || '',
          instagram_url: blogData.instagram_url || '',
          linkedin_url: blogData.linkedin_url || '',
        });
      }

      setModifiedSettings(new Map());
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configuracoes');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (setting: SystemSetting, newValue: any) => {
    const key = `${setting.category}:${setting.key}`;
    setModifiedSettings((prev) => {
      const next = new Map(prev);
      next.set(key, newValue);
      return next;
    });
  };

  const getValue = (setting: SystemSetting) => {
    const key = `${setting.category}:${setting.key}`;
    if (modifiedSettings.has(key)) {
      return modifiedSettings.get(key);
    }
    return setting.value;
  };

  const handleSaveSystemSettings = async () => {
    if (modifiedSettings.size === 0) {
      toast.info('Nenhuma alteracao para salvar');
      return;
    }

    setSaving(true);
    try {
      for (const [key, value] of modifiedSettings.entries()) {
        const [category, settingKey] = key.split(':');
        const { error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('category', category)
          .eq('key', settingKey);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
      await loadAllSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBlogSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        blog_name: blogSettings.blog_name,
        blog_description: blogSettings.blog_description,
        posts_per_page: blogSettings.posts_per_page,
        meta_title: blogSettings.meta_title,
        meta_description: blogSettings.meta_description,
        meta_keywords: blogSettings.meta_keywords,
        facebook_url: blogSettings.facebook_url,
        instagram_url: blogSettings.instagram_url,
        linkedin_url: blogSettings.linkedin_url,
        updated_at: new Date().toISOString(),
      };

      if (blogSettings.id) {
        const { error } = await (supabase as any)
          .from('admin_settings')
          .update(settingsData)
          .eq('id', blogSettings.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('admin_settings')
          .insert({
            ...settingsData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success('Configurações do blog salvas!');
      await loadAllSettings();
    } catch (error) {
      console.error('Error saving blog settings:', error);
      toast.error('Erro ao salvar configurações do blog');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['simulado', 'gamification', 'store', 'trail', 'rodadas', 'reta_final', 'battery', 'affiliates', 'emails', 'legal_texts', 'general', 'blog'];
  const filteredSettings = settings.filter((s) => s.category === activeCategory);
  const hasChanges = modifiedSettings.size > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-brand-yellow" />
            Configurações
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie todas as configurações do sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllSettings}
            className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-white/10 rounded-sm text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          {activeCategory !== 'blog' && activeCategory !== 'gamification' && activeCategory !== 'legal_texts' && (
            <button
              onClick={handleSaveSystemSettings}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm font-bold transition-colors ${
                hasChanges
                  ? 'bg-brand-yellow text-black hover:bg-brand-yellow/90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Alteracoes
            </button>
          )}
        </div>
      </div>

      {hasChanges && activeCategory !== 'blog' && activeCategory !== 'gamification' && activeCategory !== 'legal_texts' && (
        <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-sm p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-brand-yellow flex-shrink-0" />
          <p className="text-brand-yellow text-sm">
            Voce tem {modifiedSettings.size} alteracao(oes) nao salva(s). Clique em "Salvar Alteracoes" para aplicar.
          </p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - Categories */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
            {categories.map((category) => {
              const config = CATEGORY_CONFIG[category] || {
                label: category,
                icon: SettingsIcon,
                description: '',
              };
              const Icon = config.icon;
              const isActive = activeCategory === category;
              const categorySettings = settings.filter((s) => s.category === category);
              const hasModified = categorySettings.some((s) =>
                modifiedSettings.has(`${s.category}:${s.key}`)
              );

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-brand-yellow/10 text-brand-yellow border-l-2 border-brand-yellow'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{config.label}</span>
                  {hasModified && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-brand-yellow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeCategory === 'blog' ? (
            <BlogSettingsSection
              blogSettings={blogSettings}
              setBlogSettings={setBlogSettings}
              onSave={handleSaveBlogSettings}
              saving={saving}
            />
          ) : activeCategory === 'gamification' ? (
            <GamificationSection />
          ) : activeCategory === 'emails' ? (
            <EmailsSection />
          ) : activeCategory === 'legal_texts' ? (
            <LegalTextsSection />
          ) : (
            <>
              <div className="bg-brand-card border border-white/10 rounded-sm">
                {/* Category Header */}
                <div className="p-6 border-b border-white/10">
                  {(() => {
                    const config = CATEGORY_CONFIG[activeCategory] || {
                      label: activeCategory,
                      icon: SettingsIcon,
                      description: '',
                    };
                    const Icon = config.icon;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-sm bg-brand-yellow/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-brand-yellow" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{config.label}</h2>
                          <p className="text-gray-400 text-sm">{config.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Settings List */}
                <div className="divide-y divide-white/5">
                  {filteredSettings.map((setting) => {
                    const label = SETTING_LABELS[setting.key] || setting.key;
                    const value = getValue(setting);
                    const isModified = modifiedSettings.has(`${setting.category}:${setting.key}`);
                    const tooltip = SETTING_TOOLTIPS[setting.key];

                    return (
                      <div
                        key={setting.id}
                        className={`p-4 flex items-center justify-between ${
                          isModified ? 'bg-brand-yellow/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{label}</span>
                            {tooltip && (
                              <div className="group relative">
                                <HelpCircle className="w-4 h-4 text-gray-500 hover:text-brand-yellow cursor-help transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10 w-64 text-center">
                                    {tooltip}
                                  </div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                            {isModified && (
                              <CheckCircle className="w-4 h-4 text-brand-yellow" />
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-gray-500 text-sm mt-0.5">{setting.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <SettingInput
                            setting={setting}
                            value={value}
                            onChange={(newValue) => handleValueChange(setting, newValue)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {filteredSettings.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma configuracao nesta categoria</p>
                      <p className="text-sm mt-2">
                        Execute a migration 020_create_system_settings.sql para criar as configuracoes
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Help Sections */}
              {activeCategory === 'simulado' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
                  <h3 className="text-blue-400 font-bold mb-2">Sobre Simulados</h3>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• <strong>Maximo de Tentativas:</strong> Use -1 para ilimitado</li>
                    <li>• <strong>Provas Diferentes:</strong> Quantidade de versoes diferentes da prova que o usuario pode fazer</li>
                    <li>• <strong>Permitir Chat:</strong> Se habilitado, o usuario pode usar o chat durante o simulado</li>
                    <li>• A estrutura de cada simulado (questoes por materia) vem da analise do edital</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'store' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-sm p-4">
                  <h3 className="text-green-400 font-bold mb-2">Sobre a Loja</h3>
                  <ul className="text-green-300 text-sm space-y-1">
                    <li>• <strong>Criar Simulado Automaticamente:</strong> Quando ativado, um produto simulado será criado automaticamente ao criar um preparatório</li>
                    <li>• <strong>Os preços são definidos por preparatório</strong> na etapa "Vendas" ao criar/editar um preparatório</li>
                    <li>• Cada preparatório tem preços individuais para: Planejador, 8 Questões, Simulados, Reta Final e Plataforma Completa</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'reta_final' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-sm p-4">
                  <h3 className="text-orange-400 font-bold mb-2">Sobre o Modo Reta Final</h3>
                  <ul className="text-orange-300 text-sm space-y-1">
                    <li>• <strong>Porcentagem de Questões:</strong> Define quantas questões aparecem em relação ao modo normal. Ex: 50% = metade das questões</li>
                    <li>• <strong>Mínimo de Questões:</strong> Garante um número mínimo de questões mesmo com a redução percentual</li>
                    <li>• O conteúdo teórico também é resumido no modo Reta Final</li>
                    <li>• O usuário pode alternar entre os modos se tiver acesso a ambos</li>
                    <li>• Visual com tema de urgência (amarelo/laranja) para indicar a reta final</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
