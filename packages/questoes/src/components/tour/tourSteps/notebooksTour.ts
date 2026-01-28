import { ContextualTourStep } from '../ContextualTour';

export const NOTEBOOKS_TOUR_ID = 'notebooks';

export const notebooksTourConfig = {
  tourId: NOTEBOOKS_TOUR_ID,
  title: 'Meus Cadernos',
  description: 'Organize suas questoes em cadernos personalizados para revisar quando quiser.',
  features: [
    'Crie cadernos com filtros especificos',
    'Salve questoes manualmente',
    'Configure modo de estudo por caderno',
    'Pratique suas questoes favoritas',
  ],
};

export const notebooksSteps: ContextualTourStep[] = [
  {
    id: 'create-notebook',
    target: 'tour-create-notebook',
    title: 'Criar Novo Caderno',
    description: 'Clique aqui para criar um novo caderno. Voce pode criar cadernos com filtros automaticos ou para salvar questoes manualmente.',
    position: 'bottom',
  },
  {
    id: 'notebook-card',
    target: 'tour-notebook-card',
    title: 'Seus Cadernos',
    description: 'Cada caderno mostra quantas questoes estao salvas e quantas correspondem aos filtros. Configure o modo de estudo e a quantidade de questoes.',
    position: 'bottom',
  },
  {
    id: 'notebook-start',
    target: 'tour-notebook-start',
    title: 'Iniciar Pratica',
    description: 'Clique para comecar a praticar as questoes deste caderno. As questoes serao sorteadas de acordo com suas configuracoes.',
    position: 'top',
  },
];
