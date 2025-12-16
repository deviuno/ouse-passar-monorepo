// Types para o sistema de trilha estilo Duolingo

export type MissionStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'massification';
export type MissionType = 'normal' | 'revisao' | 'simulado_rodada';
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
  // Campos populated
  assunto?: Assunto;
  materia?: PreparatorioMateria;
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
}

// Preparatório do usuário (com dados da trilha)
export interface UserPreparatorio {
  id: string; // ID do user_trail
  user_id: string;
  preparatorio_id: string;
  nivel_usuario: UserLevel;
  current_round: number;
  created_at: string;
  // Dados do preparatório populados
  preparatorio: Preparatorio;
  // Estatísticas calculadas
  totalMissions?: number;
  completedMissions?: number;
  progressPercent?: number;
}
