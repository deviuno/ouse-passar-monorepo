import { ContextualTourStep } from '../ContextualTour';

export const QUESTION_FEEDBACK_TOUR_ID = 'question_feedback';

export const questionFeedbackTourConfig = {
  tourId: QUESTION_FEEDBACK_TOUR_ID,
  title: 'Feedback da Questao',
  description: 'Apos responder uma questao, voce tem acesso a varios recursos para aprofundar seu aprendizado.',
  features: [
    'Leia a explicacao detalhada',
    'Salve em seus cadernos',
    'Crie anotacoes personalizadas',
    'Tire duvidas com o mentor IA',
  ],
};

export const questionFeedbackSteps: ContextualTourStep[] = [
  {
    id: 'feedback-tabs',
    target: 'tour-feedback-tabs',
    title: 'Abas de Feedback',
    description: 'Navegue entre as diferentes abas para acessar explicacoes, comentarios, estatisticas e mais.',
    position: 'top',
  },
  {
    id: 'tab-explicacao',
    target: 'tour-tab-explicacao',
    title: 'Explicacao',
    description: 'Leia a explicacao detalhada da questao. Se nao houver, voce pode solicitar uma.',
    position: 'bottom',
  },
  {
    id: 'tab-cadernos',
    target: 'tour-tab-cadernos',
    title: 'Salvar em Cadernos',
    description: 'Salve questoes importantes nos seus cadernos para revisar depois.',
    position: 'bottom',
  },
  {
    id: 'tab-anotacoes',
    target: 'tour-tab-anotacoes',
    title: 'Suas Anotacoes',
    description: 'Crie anotacoes personalizadas sobre a questao no seu Caderno de Ouro.',
    position: 'bottom',
  },
  {
    id: 'tab-duvidas',
    target: 'tour-tab-duvidas',
    title: 'Tirar Duvidas com IA',
    description: 'Converse com o mentor IA para tirar duvidas, gerar audios explicativos ou podcasts sobre o tema.',
    position: 'bottom',
  },
];
