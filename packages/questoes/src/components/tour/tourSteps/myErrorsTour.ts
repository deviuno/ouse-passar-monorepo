import { ContextualTourStep } from '../ContextualTour';

export const MY_ERRORS_TOUR_ID = 'my_errors';

export const myErrorsTourConfig = {
  tourId: MY_ERRORS_TOUR_ID,
  title: 'Meus Erros',
  description: 'Revise as questoes que voce errou organizadas por materia e assunto.',
  features: [
    'Veja todos os seus erros agrupados',
    'Pratique por materia ou assunto',
    'Acompanhe questoes ja revisadas',
    'Foque nos pontos fracos',
  ],
};

export const myErrorsSteps: ContextualTourStep[] = [
  {
    id: 'errors-practice',
    target: 'tour-errors-practice',
    title: 'Praticar Todos os Erros',
    description: 'Clique aqui para praticar todas as questoes que voce errou de uma vez. Ideal para uma revisao geral.',
    position: 'bottom',
  },
  {
    id: 'errors-materia',
    target: 'tour-errors-materia',
    title: 'Erros por Materia',
    description: 'Seus erros estao organizados por materia. Expanda para ver os assuntos e pratique especificamente o que precisa melhorar.',
    position: 'bottom',
  },
];
