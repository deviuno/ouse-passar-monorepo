/**
 * Utilitário para calcular o número de questões por missão
 * baseado na disponibilidade de tempo do usuário
 */

import { WeeklySchedule } from '../types';

// Constantes de configuração
const MINUTOS_POR_QUESTAO = 2.5; // Tempo médio estimado por questão
const MIN_QUESTOES = 20;
const MAX_QUESTOES = 60;
const INCREMENTO = 5; // Arredondar para múltiplos de 5

/**
 * Calcula o número de questões por missão baseado na disponibilidade semanal
 *
 * @param totalMinutosSemana - Total de minutos de estudo por semana
 * @param diasAtivos - Número de dias ativos na semana (1-7)
 * @returns Número de questões por missão (entre 20 e 60, múltiplo de 5)
 *
 * @example
 * // Usuário estuda 60 min/dia, 5 dias/semana
 * calcularQuestoesPorMissao(300, 5) // retorna 25
 *
 * // Usuário estuda 120 min/dia, 3 dias/semana
 * calcularQuestoesPorMissao(360, 3) // retorna 50
 */
export function calcularQuestoesPorMissao(
  totalMinutosSemana: number,
  diasAtivos: number
): number {
  // Evitar divisão por zero
  if (diasAtivos <= 0 || totalMinutosSemana <= 0) {
    return MIN_QUESTOES;
  }

  // Calcular média diária de estudo
  const mediaDiariaMinutos = totalMinutosSemana / diasAtivos;

  // Calcular quantidade base de questões
  const questoesCalculadas = mediaDiariaMinutos / MINUTOS_POR_QUESTAO;

  // Arredondar para múltiplo de 5
  const questoesArredondadas = Math.round(questoesCalculadas / INCREMENTO) * INCREMENTO;

  // Aplicar limites mínimo e máximo
  return Math.min(MAX_QUESTOES, Math.max(MIN_QUESTOES, questoesArredondadas));
}

/**
 * Calcula questões a partir do schedule do onboarding
 *
 * @param schedule - Objeto WeeklySchedule com minutos por dia da semana
 * @returns Número de questões por missão
 */
export function calcularQuestoesPorSchedule(
  schedule: WeeklySchedule
): number {
  // Calcular total semanal e dias ativos
  const dias = [
    schedule.domingo,
    schedule.segunda,
    schedule.terca,
    schedule.quarta,
    schedule.quinta,
    schedule.sexta,
    schedule.sabado,
  ];
  const totalMinutos = dias.reduce((sum, min) => sum + min, 0);
  const diasAtivos = dias.filter(min => min > 0).length;

  return calcularQuestoesPorMissao(totalMinutos, diasAtivos);
}

/**
 * Retorna uma descrição do cálculo para debug/exibição
 */
export function descreverCalculoQuestoes(
  totalMinutosSemana: number,
  diasAtivos: number
): {
  mediaDiaria: number;
  questoesCalculadas: number;
  questoesFinal: number;
  descricao: string;
} {
  const mediaDiaria = diasAtivos > 0 ? totalMinutosSemana / diasAtivos : 0;
  const questoesCalculadas = mediaDiaria / MINUTOS_POR_QUESTAO;
  const questoesFinal = calcularQuestoesPorMissao(totalMinutosSemana, diasAtivos);

  return {
    mediaDiaria: Math.round(mediaDiaria),
    questoesCalculadas: Math.round(questoesCalculadas),
    questoesFinal,
    descricao: `${Math.round(mediaDiaria)} min/dia ÷ ${MINUTOS_POR_QUESTAO} min/questão = ${Math.round(questoesCalculadas)} → ${questoesFinal} questões`,
  };
}

export default {
  calcularQuestoesPorMissao,
  calcularQuestoesPorSchedule,
  descreverCalculoQuestoes,
  MIN_QUESTOES,
  MAX_QUESTOES,
};
