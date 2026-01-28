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
  LayoutGrid,
  Lock,
  BarChart2,
  CreditCard,
  FolderOpen,
  Play,
  Pause,
  Clock,
  ExternalLink,
  Power,
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

// Defining locally as they are missing in database.types
interface PlanejamentoConquista {
  id: string;
  nome: string;
  descricao?: string;
  icone: string;
  cor: string;
  requisito_tipo: string;
  requisito_valor: number;
  xp_recompensa: number;
  moedas_recompensa: number;
  is_active: boolean;
  is_hidden: boolean;
}
type PlanejamentoConquistaRequisitoTipo = string;

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
import * as tecScraperService from '../../services/tecScraperService';
import {
  TecAccount,
  TecCaderno,
  TecScrapingLog,
  TecScraperSettings,
  getStatusColor,
  getStatusBgColor,
  getStatusLabel,
  getLoginStatusColor,
  getLoginStatusLabel,
  getLogTypeColor,
  formatProgress,
  formatNumber,
  formatDateTime,
  calculateElapsedTime,
} from '../../services/tecScraperService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import Agentes from './Agentes';

// Extracted section components
import {
  GamificationSection,
  EmailsSection,
  LegalTextsSection,
  ModulesSection,
  AssinaturaSection,
  ScrapingSection,
  BlogSettingsSection,
} from '../../components/admin/settings';

// ============================================================================
// TYPES
// ============================================================================

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
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
    description: 'Configuracoes dos simulados e provas',
  },
  gamification: {
    label: 'Gamificacao',
    icon: Gamepad2,
    description: 'XP, moedas, niveis, ligas e conquistas',
  },
  store: {
    label: 'Loja',
    icon: ShoppingBag,
    description: 'Precos e configuracoes da loja',
  },
  trail: {
    label: 'Trilha',
    icon: MapIcon,
    description: 'Configuracoes das missoes e rodadas',
  },
  rodadas: {
    label: 'Distribuicao de Missoes',
    icon: Target,
    description: 'Configuracoes de topicos por missao e revisao de materias',
  },
  reta_final: {
    label: 'Reta Final',
    icon: Flame,
    description: 'Modo de estudo intensivo para provas proximas',
  },
  battery: {
    label: 'Bateria',
    icon: Battery,
    description: 'Sistema de energia para usuarios gratuitos',
  },
  affiliates: {
    label: 'Afiliacao',
    icon: Users,
    description: 'Sistema de indicacao e comissoes para afiliados',
  },
  emails: {
    label: 'E-mails',
    icon: Mail,
    description: 'Templates e configuracoes de e-mails de boas-vindas',
  },
  legal_texts: {
    label: 'Textos Legais',
    icon: FileText,
    description: 'Termos de Uso e Politica de Privacidade',
  },
  modules: {
    label: 'Modulos',
    icon: LayoutGrid,
    description: 'Habilitar/desabilitar modulos do app',
  },
  assinatura: {
    label: 'Assinatura',
    icon: CreditCard,
    description: 'Configuracoes da assinatura anual Ouse Questoes',
  },
  general: {
    label: 'Geral',
    icon: Globe,
    description: 'Configuracoes gerais do sistema',
  },
  blog: {
    label: 'Blog',
    icon: Newspaper,
    description: 'Configuracoes do blog e SEO',
  },
  agentes: {
    label: 'Agentes IA',
    icon: Brain,
    description: 'Monitoramento e gestao dos agentes de processamento',
  },
};

const SETTING_LABELS: Record<string, string> = {
  // Simulado
  questions_per_simulado: 'Questoes por Simulado',
  max_attempts: 'Maximo de Tentativas',
  different_exams_per_user: 'Provas Diferentes por Usuario',
  allow_chat: 'Permitir Chat',
  time_limit_minutes: 'Tempo Limite (minutos)',
  show_answers_after: 'Mostrar Respostas Apos',
  allow_review: 'Permitir Revisao',
  randomize_questions: 'Randomizar Questoes',
  randomize_options: 'Randomizar Alternativas',

  // Gamification
  xp_per_correct_answer: 'XP por Resposta Correta',
  xp_per_mission_complete: 'XP por Missao Completa',
  coins_per_correct_answer: 'Moedas por Resposta Correta',
  streak_bonus_multiplier: 'Multiplicador de Ofensiva',
  daily_goal_xp: 'Meta Diaria de XP',

  // Store
  auto_create_simulado_product: 'Criar Simulado Automaticamente',

  // Trail
  questions_per_mission: 'Questoes por Missao',
  missions_per_round: 'Missoes por Rodada',
  min_score_to_pass: 'Pontuacao Minima (%)',
  allow_retry: 'Permitir Refazer',
  show_explanation: 'Mostrar Explicacao',

  // Rodadas
  topicos_por_missao_isolados: 'Topicos Isolados por Missao',
  topicos_por_missao_com_subtopicos: 'Topicos com Sub-entradas por Missao',
  revisao_questoes_base: 'Questoes Base na Revisao',
  revisao_questoes_decremento: 'Decremento por Rodada',
  revisao_questoes_minimo: 'Minimo de Questoes',
  materias_por_rodada: 'Materias por Rodada',
  missoes_extras_repeticao: 'Missoes Extras (Repeticao)',

  // General
  maintenance_mode: 'Modo Manutencao',
  allow_new_registrations: 'Permitir Novos Cadastros',
  require_email_verification: 'Verificacao de Email',
  max_preparatorios_per_user: 'Max Preparatorios por Usuario',

  // Reta Final / Afiliacao
  is_enabled: 'Habilitado',
  question_percentage: 'Porcentagem de Questoes (%)',
  min_questions_per_mission: 'Minimo de Questoes por Missao',

  // Battery
  max_battery: 'Capacidade Maxima',
  daily_recharge: 'Recarga Diaria',
  recharge_hour: 'Hora da Recarga (0-23)',
  cost_per_question: 'Custo por Questao',
  cost_per_mission_start: 'Custo por Iniciar Missao',
  cost_per_chat_message: 'Custo por Mensagem no Chat',
  cost_per_chat_audio: 'Custo por Audio no Chat',
  cost_per_chat_podcast: 'Custo por Podcast no Chat',
  cost_per_chat_summary: 'Custo por Resumo Rapido',
  cost_per_notebook_create: 'Custo por Criar Caderno',
  cost_per_practice_session: 'Custo por Sessao de Pratica',
  max_preparatorios_free: 'Max Preparatorios (Gratuito)',
  chat_enabled_free: 'Chat Habilitado (Gratuito)',
  chat_requires_practice: 'Chat Requer Pratica',
  chat_min_questions: 'Minimo de Questoes para Chat',
  notebooks_enabled_free: 'Cadernos Habilitados (Gratuito)',
  notebooks_max_free: 'Max Cadernos (Gratuito)',
  practice_enabled_free: 'Pratica Habilitada (Gratuito)',
  unlimited_duration_months: 'Duracao Bateria Ilimitada (meses)',

  // Afiliacao
  points_per_referral: 'Pontos por Indicacao',
  commission_rate: 'Taxa de Comissao (%)',
  min_withdrawal: 'Valor Minimo para Saque (R$)',
  battery_reward_per_referral: 'Baterias por Indicacao',

  // Modulos
  trilha_enabled: 'Minhas Trilhas',
  trilha_block_behavior: 'Comportamento quando bloqueado',
  praticar_enabled: 'Praticar Questoes',
  praticar_block_behavior: 'Comportamento quando bloqueado',
  simulados_enabled: 'Meus Simulados',
  simulados_block_behavior: 'Comportamento quando bloqueado',
  cursos_enabled: 'Meus Cursos',
  cursos_block_behavior: 'Comportamento quando bloqueado',
  estatisticas_enabled: 'Estatisticas',
  estatisticas_block_behavior: 'Comportamento quando bloqueado',
  loja_enabled: 'Loja',
  loja_block_behavior: 'Comportamento quando bloqueado',

  // Assinatura Ouse Questoes
  assinatura_preco: 'Preco (R$)',
  assinatura_preco_desconto: 'Preco com Desconto (R$)',
  assinatura_duracao_meses: 'Duracao (meses)',
  assinatura_checkout_url: 'URL de Checkout',
  assinatura_guru_product_id: 'ID do Produto (Guru)',
};

// Tooltips de ajuda para todos os campos de configuracao
const SETTING_TOOLTIPS: Record<string, string> = {
  // ===== SIMULADO =====
  questions_per_simulado: 'Quantidade total de questoes em cada simulado gerado. Recomendado: entre 60 e 120 questoes.',
  max_attempts: 'Numero maximo de vezes que o usuario pode refazer o simulado. Use -1 para tentativas ilimitadas.',
  different_exams_per_user: 'Quantidade de versoes diferentes do simulado disponiveis para cada usuario.',
  allow_chat: 'Se ativado, o usuario podera usar o chat com IA durante o simulado para tirar duvidas.',
  time_limit_minutes: 'Tempo maximo para completar o simulado. 0 = sem limite de tempo.',
  show_answers_after: 'Quando mostrar o gabarito: "always" (sempre), "never" (nunca), ou "after_submit" (apos enviar).',
  allow_review: 'Se ativado, o usuario pode revisar suas respostas antes de finalizar o simulado.',
  randomize_questions: 'Se ativado, a ordem das questoes sera diferente para cada tentativa.',
  randomize_options: 'Se ativado, a ordem das alternativas (A, B, C, D, E) sera embaralhada.',

  // ===== GAMIFICACAO =====
  xp_per_correct_answer: 'Pontos de XP ganhos por cada questao respondida corretamente.',
  xp_per_mission_complete: 'Bonus de XP ao completar uma missao inteira.',
  coins_per_correct_answer: 'Moedas ganhas por cada questao respondida corretamente.',
  streak_bonus_multiplier: 'Multiplicador aplicado as recompensas durante sequencias de acertos.',
  daily_goal_xp: 'Meta diaria de XP para manter a ofensiva (streak) ativa.',

  // ===== LOJA =====
  auto_create_simulado_product: 'Se ativado, um produto de simulado sera criado automaticamente ao criar um novo preparatorio.',

  // ===== TRILHA =====
  questions_per_mission: 'Quantidade padrao de questoes em cada missao da trilha.',
  missions_per_round: 'Numero de missoes que compoem uma rodada de estudos.',
  min_score_to_pass: 'Porcentagem minima de acertos para passar na missao (ex: 70 = 70%).',
  allow_retry: 'Se ativado, o usuario pode refazer missoes que ja completou.',
  show_explanation: 'Se ativado, mostra a explicacao da questao apos responder.',

  // ===== RODADAS =====
  topicos_por_missao_isolados: 'Quantidade maxima de topicos isolados (sem sub-entradas) que podem ser agrupados em uma unica missao. Topicos isolados sao aqueles que nao possuem subtopicos.',
  topicos_por_missao_com_subtopicos: 'Quantidade maxima de itens (topico pai + subtopicos) que podem ser agrupados em uma unica missao quando o topico possui sub-entradas.',
  revisao_questoes_base: 'Quantidade inicial de questoes por materia na primeira revisao apos finalizar todos os topicos. Exemplo: 25 questoes.',
  revisao_questoes_decremento: 'Quantidade de questoes a subtrair da revisao a cada rodada. Exemplo: se for 5, a sequencia sera 25-20-15-10-5.',
  revisao_questoes_minimo: 'Quantidade minima de questoes por materia na revisao, independente do decremento. Quando atingir este valor, permanece fixo.',
  materias_por_rodada: 'Quantidade de materias diferentes que serao estudadas em cada rodada. As materias sao escolhidas por ordem de prioridade.',
  missoes_extras_repeticao: 'Quantidade de missoes extras por rodada que repetem as materias mais relevantes (com mais topicos restantes).',

  // ===== GERAL =====
  maintenance_mode: 'Se ativado, apenas administradores podem acessar o sistema. Usuarios veem uma tela de manutencao.',
  allow_new_registrations: 'Se desativado, novos usuarios nao poderao se cadastrar na plataforma.',
  require_email_verification: 'Se ativado, o usuario precisa confirmar o email antes de acessar a plataforma.',
  max_preparatorios_per_user: 'Limite maximo de preparatorios por usuario (para usuarios premium). 0 = ilimitado.',

  // ===== RETA FINAL =====
  is_enabled: 'Habilita ou desabilita o modo Reta Final globalmente para todos os preparatorios.',
  question_percentage: 'Porcentagem de questoes no modo Reta Final em relacao ao modo normal (ex: 50 = metade).',
  min_questions_per_mission: 'Numero minimo de questoes por missao no modo Reta Final, independente da porcentagem.',

  // ===== BATERIA =====
  max_battery: 'Quantidade maxima de energia que um usuario gratuito pode ter. A energia e consumida ao realizar acoes.',
  daily_recharge: 'Quantidade de energia restaurada automaticamente a cada dia. Nao ultrapassa a capacidade maxima.',
  recharge_hour: 'Hora do dia em que a recarga automatica acontece (formato 24h, ex: 0 = meia-noite, 12 = meio-dia).',
  cost_per_question: 'Energia consumida cada vez que o usuario responde uma questao.',
  cost_per_mission_start: 'Energia consumida ao iniciar uma missao de estudo.',
  cost_per_chat_message: 'Energia consumida ao enviar uma mensagem no chat com IA.',
  cost_per_chat_audio: 'Energia consumida ao solicitar geracao de audio no chat.',
  cost_per_chat_podcast: 'Energia consumida ao solicitar geracao de podcast no chat.',
  cost_per_chat_summary: 'Energia consumida ao solicitar um resumo rapido no chat.',
  cost_per_notebook_create: 'Energia consumida ao criar um novo caderno de questoes.',
  cost_per_practice_session: 'Energia consumida ao iniciar uma sessao de pratica.',
  max_preparatorios_free: 'Numero maximo de preparatorios que um usuario gratuito pode ter ativos simultaneamente.',
  chat_enabled_free: 'Se desativado, usuarios gratuitos nao terao acesso ao chat com IA.',
  chat_requires_practice: 'Se ativado, o usuario precisa praticar questoes antes de poder usar o chat.',
  chat_min_questions: 'Numero minimo de questoes que o usuario deve responder antes de liberar o chat.',
  notebooks_enabled_free: 'Se desativado, usuarios gratuitos nao poderao criar cadernos de questoes.',
  notebooks_max_free: 'Numero maximo de cadernos que um usuario gratuito pode criar.',
  practice_enabled_free: 'Se desativado, usuarios gratuitos nao terao acesso ao modo pratica.',
  unlimited_duration_months: 'Tempo de validade da bateria ilimitada apos a compra da Turma de Elite. Padrao: 12 meses.',

  // ===== AFILIACAO =====
  points_per_referral: 'Quantidade de pontos que o usuario ganha quando alguem se cadastra usando seu link de indicacao.',
  commission_rate: 'Porcentagem do valor da venda que o afiliado recebe como comissao quando um indicado faz uma compra.',
  min_withdrawal: 'Valor minimo em reais que o afiliado precisa acumular para poder solicitar o saque das comissoes.',
  battery_reward_per_referral: 'Quantidade de baterias extras que o usuario ganha por cada indicacao confirmada.',

  // ===== MODULOS =====
  trilha_enabled: 'Habilita ou desabilita o modulo "Minhas Trilhas" para usuarios comuns. Admins e usuarios com "Ver Respostas" sempre tem acesso.',
  trilha_block_behavior: 'Como o modulo aparece quando bloqueado: "hidden" (oculto), "disabled" (desabilitado com cadeado), "modal" (mostra modal ao clicar).',
  praticar_enabled: 'Habilita ou desabilita o modulo "Praticar Questoes". Este e o modulo principal, recomendado mante-lo sempre ativo.',
  praticar_block_behavior: 'Como o modulo aparece quando bloqueado: "hidden" (oculto), "disabled" (desabilitado com cadeado), "modal" (mostra modal ao clicar).',
  simulados_enabled: 'Habilita ou desabilita o modulo "Meus Simulados" para usuarios comuns.',
  simulados_block_behavior: 'Como o modulo aparece quando bloqueado: "hidden" (oculto), "disabled" (desabilitado com cadeado), "modal" (mostra modal ao clicar).',
  cursos_enabled: 'Habilita ou desabilita o modulo "Meus Cursos" para usuarios comuns. Exibe os cursos em video adquiridos.',
  cursos_block_behavior: 'Como o modulo aparece quando bloqueado: "hidden" (oculto), "disabled" (desabilitado com cadeado), "modal" (mostra modal ao clicar).',
  estatisticas_enabled: 'Habilita ou desabilita o modulo "Estatisticas" (Raio-X) para usuarios comuns.',
  estatisticas_block_behavior: 'Como o modulo aparece quando bloqueado: "hidden" (oculto), "disabled" (desabilitado com cadeado), "modal" (mostra modal ao clicar).',
  loja_enabled: 'Habilita ou desabilita o modulo "Loja" para usuarios comuns.',
  loja_block_behavior: 'Como o modulo aparece quando bloqueado: "hidden" (oculto), "disabled" (desabilitado com cadeado), "modal" (mostra modal ao clicar).',

  // ===== ASSINATURA OUSE QUESTOES =====
  assinatura_preco: 'Preco da assinatura anual Ouse Questoes em reais. Esta assinatura da acesso ao modulo "Praticar Questoes" sem vinculacao a preparatorio.',
  assinatura_preco_desconto: 'Preco promocional com desconto. Deixe 0 se nao houver desconto.',
  assinatura_duracao_meses: 'Duracao da assinatura em meses. Padrao: 12 meses (anual).',
  assinatura_checkout_url: 'URL de checkout do Guru para a assinatura Ouse Questoes.',
  assinatura_guru_product_id: 'ID do produto no Guru Manager para integracao de pagamentos.',
};

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

      toast.success('Configuracoes salvas com sucesso!');
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

      toast.success('Configuracoes do blog salvas!');
      await loadAllSettings();
    } catch (error) {
      console.error('Error saving blog settings:', error);
      toast.error('Erro ao salvar configuracoes do blog');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['simulado', 'gamification', 'store', 'trail', 'rodadas', 'reta_final', 'battery', 'affiliates', 'assinatura', 'emails', 'legal_texts', 'modules', 'agentes', 'general', 'blog'];
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
            Configuracoes
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie todas as configuracoes do sistema
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
              className={`flex items-center gap-2 px-4 py-2 rounded-sm font-bold transition-colors ${hasChanges
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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive
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
          ) : activeCategory === 'modules' ? (
            <ModulesSection
              settings={settings}
              onValueChange={handleValueChange}
              modifiedSettings={modifiedSettings}
            />
          ) : activeCategory === 'assinatura' ? (
            <AssinaturaSection
              settings={settings}
              onValueChange={handleValueChange}
              modifiedSettings={modifiedSettings}
            />
          ) : activeCategory === 'agentes' ? (
            <Agentes showHeader={false} />
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
                        className={`p-4 flex items-center justify-between ${isModified ? 'bg-brand-yellow/5' : ''
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
                    <li>- <strong>Maximo de Tentativas:</strong> Use -1 para ilimitado</li>
                    <li>- <strong>Provas Diferentes:</strong> Quantidade de versoes diferentes da prova que o usuario pode fazer</li>
                    <li>- <strong>Permitir Chat:</strong> Se habilitado, o usuario pode usar o chat durante o simulado</li>
                    <li>- A estrutura de cada simulado (questoes por materia) vem da analise do edital</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'store' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-sm p-4">
                  <h3 className="text-green-400 font-bold mb-2">Sobre a Loja</h3>
                  <ul className="text-green-300 text-sm space-y-1">
                    <li>- <strong>Criar Simulado Automaticamente:</strong> Quando ativado, um produto simulado sera criado automaticamente ao criar um preparatorio</li>
                    <li>- <strong>Os precos sao definidos por preparatorio</strong> na etapa "Vendas" ao criar/editar um preparatorio</li>
                    <li>- Cada preparatorio tem precos individuais para: Planejador, 8 Questoes, Simulados, Reta Final e Plataforma Completa</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'reta_final' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-sm p-4">
                  <h3 className="text-orange-400 font-bold mb-2">Sobre o Modo Reta Final</h3>
                  <ul className="text-orange-300 text-sm space-y-1">
                    <li>- <strong>Porcentagem de Questoes:</strong> Define quantas questoes aparecem em relacao ao modo normal. Ex: 50% = metade das questoes</li>
                    <li>- <strong>Minimo de Questoes:</strong> Garante um numero minimo de questoes mesmo com a reducao percentual</li>
                    <li>- O conteudo teorico tambem e resumido no modo Reta Final</li>
                    <li>- O usuario pode alternar entre os modos se tiver acesso a ambos</li>
                    <li>- Visual com tema de urgencia (amarelo/laranja) para indicar a reta final</li>
                  </ul>
                </div>
              )}

              {activeCategory === 'modules' && filteredSettings.length > 0 && (
                <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-sm p-4">
                  <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sobre os Modulos
                  </h3>
                  <ul className="text-purple-300 text-sm space-y-1">
                    <li>- <strong>Acesso Completo:</strong> Administradores e usuarios com "Ver Respostas" ativado sempre tem acesso a todos os modulos</li>
                    <li>- <strong>Comportamento "hidden":</strong> O modulo e completamente oculto da navegacao</li>
                    <li>- <strong>Comportamento "disabled":</strong> O modulo aparece com opacidade reduzida e icone de cadeado, sem permitir clique</li>
                    <li>- <strong>Comportamento "modal":</strong> O modulo aparece normal, mas ao clicar exibe um modal informando que esta indisponivel</li>
                    <li>- <strong>Praticar Questoes:</strong> E recomendado manter este modulo sempre ativo, pois e o fallback quando outros modulos estao bloqueados</li>
                    <li>- Usuarios que tentarem acessar um modulo bloqueado via URL serao redirecionados para "Praticar Questoes"</li>
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
