import { ContextualTourStep } from '../ContextualTour';

export const PRACTICE_FILTERS_TOUR_ID = 'practice_filters';

export const practiceFiltersTourConfig = {
  tourId: PRACTICE_FILTERS_TOUR_ID,
  title: 'Praticar Questoes',
  description: 'Aqui voce pode filtrar e praticar questoes de concursos de forma personalizada.',
  features: [
    'Filtre por materia, assunto e banca',
    'Configure o modo de estudo (Zen ou Simulado)',
    'Salve seus filtros em cadernos',
    'Pratique questoes que voce errou',
  ],
};

export const practiceFiltersSteps: ContextualTourStep[] = [
  {
    id: 'filters-panel',
    target: 'tour-filters-panel',
    title: 'Painel de Filtros',
    description: 'Use os filtros para encontrar questoes especificas. Voce pode combinar varios filtros para uma busca mais precisa.',
    position: 'bottom',
  },
  {
    id: 'materias',
    target: 'tour-materias',
    title: 'Selecione Materias',
    description: 'Escolha uma ou mais materias para praticar. As opcoes de assunto serao atualizadas automaticamente.',
    position: 'bottom',
  },
  {
    id: 'assuntos',
    target: 'tour-assuntos',
    title: 'Assuntos Hierarquicos',
    description: 'Navegue pelos assuntos de forma hierarquica. Voce pode selecionar temas especificos ou categorias inteiras.',
    position: 'bottom',
  },
  {
    id: 'bancas',
    target: 'tour-bancas',
    title: 'Filtrar por Banca',
    description: 'Pratique questoes de bancas especificas como CESPE, FCC, FGV e outras. Ideal para focar no estilo da sua prova.',
    position: 'bottom',
  },
  {
    id: 'toggle-filters',
    target: 'tour-toggle-filters',
    title: 'Filtros Rapidos',
    description: 'Use esses toggles para filtrar rapidamente: questoes revisadas, com comentarios, ou ineditaas da Ouse.',
    position: 'top',
  },
  {
    id: 'study-settings',
    target: 'tour-study-settings',
    title: 'Configuracoes de Estudo',
    description: 'Escolha o modo Zen (sem tempo) ou Simulado (com cronometro). Defina quantas questoes quer praticar por sessao.',
    position: 'top',
  },
];
