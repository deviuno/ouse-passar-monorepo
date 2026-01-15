import { RevisaoCriterio } from './types';

export const REVISAO_CRITERIOS_OPTIONS: { value: RevisaoCriterio; label: string; description: string }[] = [
  { value: 'erradas', label: 'Questões erradas', description: 'Questões que o aluno errou' },
  { value: 'dificil', label: 'Marcadas como difícil', description: 'Acertou, mas marcou como difícil' },
  { value: 'medio', label: 'Marcadas como médio', description: 'Acertou e marcou como médio' },
  { value: 'facil', label: 'Marcadas como fácil', description: 'Acertou e marcou como fácil' },
];
