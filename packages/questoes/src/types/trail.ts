// Types para o sistema de trilha estilo Duolingo

export type MissionStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'massification' | 'needs_massificacao';
export type MissionType = 'normal' | 'revisao' | 'simulado_rodada' | 'massificacao';
export type RoundStatus = 'locked' | 'active' | 'completed';
export type RoundType = 'normal' | 'revisao' | 'simulado';
export type UserLevel = 'iniciante' | 'intermediario' | 'avancado';

export interface Preparatorio {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  banca?: string;
  orgao?: string;
  ano_previsto?: number;
  edital_url?: string;
  raio_x?: RaioXConcurso;
  is_active: boolean;
  ordem?: number;
  imagem_capa?: string;
  logo_url?: string; // Logo quadrada do órgão (ex: PRF, PF)
  created_at?: string;
  updated_at?: string;
}

export interface RaioXConcurso {
  materias: RaioXMateria[];
  total_questoes_previstas?: number;
  dicas?: string[];
}

export interface RaioXMateria {
  materia: string;
  peso: number;
  percentual_prova: number;
  assuntos_prioritarios: string[];
}

export interface PreparatorioMateria {
  id: string;
  preparatorio_id: string;
  materia: string;
  peso: number;
  ordem: number;
  total_assuntos: number;
  created_at: string;
}

export interface Assunto {
  id: string;
  materia_id: string;
  nome: string;
  ordem: number;
  nivel_dificuldade: UserLevel;
  created_at: string;
}

export interface Conteudo {
  id: string;
  assunto_id: string;
  nivel: UserLevel;
  texto_content?: string;
  audio_url?: string;
  visual_url?: string;
  created_at: string;
}

export interface UserTrail {
  id: string;
  user_id: string;
  preparatorio_id: string;
  nivel_usuario: UserLevel;
  slot_a_materia_id?: string;
  slot_b_materia_id?: string;
  current_round: number;
  created_at: string;
}

export interface TrailRound {
  id: string;
  trail_id: string;
  round_number: number;
  status: RoundStatus;
  tipo: RoundType;
  created_at: string;
  completed_at?: string;
}

export interface TrailMission {
  id: string;
  round_id: string;
  assunto_id?: string;
  materia_id: string;
  ordem: number;
  status: MissionStatus;
  tipo: MissionType;
  score?: number;
  attempts: number;
  created_at: string;
  completed_at?: string;
  // Campos de massificação
  massificacao_de?: string; // ID da missão original que gerou esta massificação
  tentativa_massificacao?: number; // Número da tentativa (1, 2, 3...)
  questoes_ids?: string[]; // IDs das questões originais para repetir exatamente as mesmas
  // Campos populated
  assunto?: Assunto;
  materia?: PreparatorioMateria;
  missao_original?: TrailMission; // Missão original populada (para massificação)
}

export interface MissionAnswer {
  id: string;
  mission_id: string;
  user_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_spent?: number;
  attempt_number: number;
  created_at: string;
}

export interface RevisionPoolItem {
  id: string;
  trail_id: string;
  materia_id: string;
  added_at: string;
}

// Tipos para o algoritmo de trilha
export interface TrailSlots {
  slotA: PreparatorioMateria | null;
  slotB: PreparatorioMateria | null;
}

export interface GeneratedMission {
  assunto: Assunto;
  materia: PreparatorioMateria;
  slot: 'A' | 'B';
  tipo: MissionType;
}

// Tipos para o mapa visual
export interface TrailMapData {
  trail: UserTrail;
  rounds: TrailRoundWithMissions[];
  currentMissionId?: string;
}

export interface TrailRoundWithMissions extends TrailRound {
  missions: TrailMission[];
}

// Config de carga por nivel
export interface LevelLoadConfig {
  iniciante: number;
  intermediario: number;
  avancado: number;
}

export interface DisciplinaLoadConfig {
  direito: LevelLoadConfig;
  informatica: LevelLoadConfig;
  portugues: LevelLoadConfig;
  exatas: LevelLoadConfig;
}

// Resultado de missao
export interface MissionResult {
  missionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  answers: MissionAnswer[];
}

export interface MassificationCheck {
  passed: boolean;
  score: number;
  requiredScore: number;
  action: 'unlock_next' | 'massification_required';
  massificacaoId?: string; // ID da missão de massificação criada (se action = 'massification_required')
}

// Estatísticas de massificação
export interface MassificacaoStats {
  id: string;
  user_id: string;
  missao_original_id: string;
  missao_massificacao_id: string;
  tentativa: number;
  score_original: number;
  score_massificacao?: number;
  passou: boolean;
  created_at: string;
  completed_at?: string;
}

// Preparatório do usuário (com dados da trilha)
export interface UserPreparatorio {
  id: string; // ID do user_trail
  user_id: string;
  preparatorio_id: string;
  nivel_usuario: UserLevel;
  current_round: number;
  questoes_por_missao?: number; // Quantidade de questões por missão (20-60)
  created_at: string;
  // Dados do preparatório populados
  preparatorio: Preparatorio;
  // Estatísticas calculadas
  totalMissions?: number;
  completedMissions?: number;
  progressPercent?: number;
}

// ==================== SISTEMA DE PLANEJAMENTO ====================

// Tipos de missão do planejamento
export type MissaoTipo = 'padrao' | 'revisao' | 'acao';

// Rodada do planejamento (tabela rodadas)
export interface Rodada {
  id: string;
  preparatorio_id: string;
  numero: number;
  titulo: string;
  nota?: string;
  ordem: number;
  created_at: string;
  updated_at?: string;
  // Campos populados
  missoes?: Missao[];
}

// Missão do planejamento (tabela missoes)
export interface Missao {
  id: string;
  rodada_id: string;
  numero: string;
  tipo: MissaoTipo;
  materia?: string;
  assunto?: string;
  instrucoes?: string;
  tema?: string;
  acao?: string;
  extra?: string[];
  obs?: string;
  ordem: number;
  created_at: string;
  updated_at?: string;
}

// Progresso do usuário em uma missão
export interface UserMissaoProgress {
  id: string;
  user_id: string;
  missao_id: string;
  status: MissionStatus;
  score?: number;
  attempts: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  // Campos para massificação
  massificacao_attempts?: number;
  questoes_ids?: string[];
  last_attempt_at?: string;
}

// Rodada com missões e progresso do usuário
export interface RodadaComProgresso extends Rodada {
  missoes: MissaoComProgresso[];
}

// Missão com progresso do usuário
export interface MissaoComProgresso extends Missao {
  progress?: UserMissaoProgress;
  // Campos calculados para a UI
  status: MissionStatus;
  isCurrentMission?: boolean;
}
