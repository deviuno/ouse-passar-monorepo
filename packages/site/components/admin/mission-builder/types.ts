export interface Materia {
  id: string;
  materia: string;
  ordem: number;
  total_topicos: number;
  topicos_disponiveis: number;
}

export interface Topico {
  id: string;
  nome: string;
  ordem: number;
  nivel_dificuldade: string | null;
}

export interface Missao {
  id: string;
  rodada_id: string;
  numero: string;
  tipo: string;
  materia: string | null;
  materia_id: string | null;
  assunto: string | null;
  tema: string | null;
  acao: string | null;
  assuntos_ids: string[];
  revisao_parte: number | null;
  ordem: number;
  revisao_criterios?: RevisaoCriterio[];
}

export type RevisaoCriterio = 'erradas' | 'dificil' | 'medio' | 'facil';

export interface Rodada {
  id: string;
  preparatorio_id: string;
  numero: number;
  titulo: string;
  ordem: number;
  missoes: Missao[];
}

export interface BuilderState {
  preparatorio: {
    id: string;
    nome: string;
    cargo: string | null;
    montagem_status: string;
  };
  rodadas: Rodada[];
  materias: Materia[];
  topicos_usados: string[];
}
