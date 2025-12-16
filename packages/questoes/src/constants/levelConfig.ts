// Configuracoes de carga por nivel e disciplina
// Baseado no PRD: Tabela de Carga (Payload da Missao)

import { DisciplinaLoadConfig, UserLevel } from '../types';

export const DISCIPLINA_LOAD_CONFIG: DisciplinaLoadConfig = {
  direito: {
    iniciante: 40,
    intermediario: 50,
    avancado: 80,
  },
  informatica: {
    iniciante: 30,
    intermediario: 40,
    avancado: 60,
  },
  portugues: {
    iniciante: 20,
    intermediario: 30,
    avancado: 30,
  },
  exatas: {
    iniciante: 15,
    intermediario: 15,
    avancado: 20,
  },
};

// Mapeia materias para categorias de disciplina
export const MATERIA_TO_DISCIPLINA: Record<string, keyof DisciplinaLoadConfig> = {
  'Direito Constitucional': 'direito',
  'Direito Administrativo': 'direito',
  'Direito Penal': 'direito',
  'Direito Processual Penal': 'direito',
  'Direito Civil': 'direito',
  'Direito Processual Civil': 'direito',
  'Direito do Trabalho': 'direito',
  'Direito Tributario': 'direito',
  'Direito Empresarial': 'direito',
  'Legislacao Especial': 'direito',
  'Informatica': 'informatica',
  'Nocoes de Informatica': 'informatica',
  'Seguranca da Informacao': 'informatica',
  'Lingua Portuguesa': 'portugues',
  'Portugues': 'portugues',
  'Redacao Oficial': 'portugues',
  'Matematica': 'exatas',
  'Raciocinio Logico': 'exatas',
  'Estatistica': 'exatas',
  'Contabilidade': 'exatas',
};

export function getQuestionsLimit(materia: string, nivel: UserLevel): number {
  const disciplina = MATERIA_TO_DISCIPLINA[materia] || 'direito';
  return DISCIPLINA_LOAD_CONFIG[disciplina][nivel];
}

// Score minimo para passar (massificacao)
export const PASSING_SCORE = 50;

// XP por questao correta
export const XP_PER_CORRECT = 10;
export const XP_BONUS_STREAK = 5;
export const XP_BONUS_PERFECT = 50;

// Coins por missao
export const COINS_PER_MISSION = 5;
export const COINS_BONUS_FIRST_TRY = 10;

// Niveis de XP
export const XP_PER_LEVEL = 100;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function calculateXPForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL;
}

export function calculateXPProgress(xp: number): { current: number; needed: number; percentage: number } {
  const level = calculateLevel(xp);
  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const current = xp - xpForCurrentLevel;
  const needed = xpForNextLevel - xpForCurrentLevel;
  return {
    current,
    needed,
    percentage: (current / needed) * 100,
  };
}
