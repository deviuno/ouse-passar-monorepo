import { ContextualTourStep } from '../ContextualTour';

export const MY_CONTENT_TOUR_ID = 'my_content';

export const myContentTourConfig = {
  tourId: MY_CONTENT_TOUR_ID,
  title: 'Meus Conteudos',
  description: 'Acesse todos os conteudos gerados por IA durante seus estudos.',
  features: [
    'Audios explicativos das questoes',
    'Podcasts sobre os temas',
    'Resumos em texto',
    'Musicas favoritadas',
  ],
};

export const myContentSteps: ContextualTourStep[] = [
  {
    id: 'content-tabs',
    target: 'tour-content-tabs',
    title: 'Tipos de Conteudo',
    description: 'Navegue entre audios, podcasts, resumos e musicas. Cada aba mostra um tipo diferente de conteudo gerado.',
    position: 'bottom',
  },
  {
    id: 'content-item',
    target: 'tour-content-item',
    title: 'Seus Conteudos',
    description: 'Clique em qualquer item para ouvir ou ler. Voce pode reproduzir audios diretamente ou ver detalhes do conteudo.',
    position: 'bottom',
  },
];
