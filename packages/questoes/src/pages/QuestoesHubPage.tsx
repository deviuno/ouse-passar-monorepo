import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, BookOpen, Map, ChevronRight, BookMarked, XCircle, Sparkles } from 'lucide-react';

interface HubCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgGradient: string;
}

const hubCards: HubCard[] = [
  {
    id: 'praticar',
    title: 'Praticar Questões',
    description: 'Resolva questões com filtros personalizados por banca, matéria, assunto e mais.',
    icon: <Play size={32} fill="currentColor" />,
    path: '/praticar?showFilters=true',
    color: '#8B5CF6',
    bgGradient: 'from-violet-500/20 to-violet-500/5',
  },
  {
    id: 'cadernos',
    title: 'Meus Cadernos',
    description: 'Acesse e gerencie seus cadernos de questões salvos para revisão.',
    icon: <BookOpen size={32} />,
    path: '/cadernos',
    color: '#3B82F6',
    bgGradient: 'from-blue-500/20 to-blue-500/5',
  },
  {
    id: 'trilhas',
    title: 'Trilhas de Questões',
    description: 'Pratique seguindo o edital verticalizado do seu preparatório.',
    icon: <Map size={32} />,
    path: '/trilhas',
    color: '#10B981',
    bgGradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    id: 'minhas-anotacoes',
    title: 'Minhas Anotações',
    description: 'Organize suas anotações por temas e revise o que é mais importante.',
    icon: <BookMarked size={32} />,
    path: '/minhas-anotacoes',
    color: '#F59E0B',
    bgGradient: 'from-amber-500/20 to-amber-500/5',
  },
  {
    id: 'meus-erros',
    title: 'Meus Erros',
    description: 'Revise as questões que você errou, agrupadas por matéria e assunto.',
    icon: <XCircle size={32} />,
    path: '/meus-erros',
    color: '#EF4444',
    bgGradient: 'from-red-500/20 to-red-500/5',
  },
  {
    id: 'meus-conteudos',
    title: 'Meus Conteúdos',
    description: 'Acesse resumos, podcasts e áudios gerados pela IA para você.',
    icon: <Sparkles size={32} />,
    path: '/meus-conteudos',
    color: '#06B6D4',
    bgGradient: 'from-cyan-500/20 to-cyan-500/5',
  },
];

export const QuestoesHubPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-4 py-8 md:py-12 theme-transition">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)] mb-3">
            Ouse Questões
          </h1>
          <p className="text-[var(--color-text-sec)] text-lg">
            Escolha como deseja praticar hoje
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hubCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(card.path)}
              className={`
                relative overflow-hidden rounded-2xl cursor-pointer
                bg-gradient-to-br ${card.bgGradient}
                border border-[var(--color-border)] hover:border-[var(--color-bg-elevated)]
                transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                group theme-transition
              `}
            >
              {/* Background Glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-30"
                style={{ backgroundColor: card.color }}
              />

              <div className="relative p-6">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  {card.icon}
                </div>

                {/* Title */}
                <h2
                  className="text-xl font-bold text-[var(--color-text-main)] mb-2 transition-colors group-hover:[color:var(--hover-color)]"
                  style={{ '--hover-color': card.color } as React.CSSProperties}
                >
                  {card.title}
                </h2>

                {/* Description */}
                <p className="text-[var(--color-text-sec)] text-sm leading-relaxed mb-4">
                  {card.description}
                </p>

                {/* Action */}
                <div
                  className="flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2"
                  style={{ color: card.color }}
                >
                  Acessar
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats or Tips Section (optional future enhancement) */}
        <div className="mt-12 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            Dica: Use as <span className="text-[var(--color-brand)]">Trilhas</span> para seguir o edital do seu concurso
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestoesHubPage;
