import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  MessageCircle,
  ChevronDown,
  BookOpen,
  Target,
  Zap,
  Trophy,
  BarChart3,
  Flame,
  Sparkles,
  ExternalLink,
  Ticket,
  Play,
} from 'lucide-react';
import { CreateTicketForm } from '../components/support/CreateTicketForm';

interface TutorialSection {
  id: string;
  icon: React.ElementType;
  title: string;
  content: string[];
}

const tutorials: TutorialSection[] = [
  {
    id: 'trilha',
    icon: Target,
    title: 'Como funciona a Trilha?',
    content: [
      'A trilha é seu caminho personalizado de estudos, organizada em rodadas e missões.',
      'Cada rodada contém várias missões que você deve completar em ordem.',
      'Complete uma missão para desbloquear a próxima. Algumas missões têm pré-requisitos.',
      'Ao finalizar todas as missões de uma rodada, a próxima rodada é desbloqueada automaticamente.',
    ],
  },
  {
    id: 'missoes',
    icon: BookOpen,
    title: 'O que são as Missões?',
    content: [
      'Missões são conjuntos de questões sobre um tema específico.',
      'Cada missão começa com um conteúdo explicativo para você estudar.',
      'Após ler o conteúdo, você responde as questões da missão.',
      'Você precisa atingir 70% de aproveitamento para completar a missão com sucesso.',
    ],
  },
  {
    id: 'xp',
    icon: Zap,
    title: 'Como ganho XP e subo de nível?',
    content: [
      'Você ganha XP (pontos de experiência) ao responder questões corretamente.',
      'Quanto mais questões você acerta, mais XP você ganha.',
      'Ao acumular XP suficiente, você sobe de nível automaticamente.',
      'Níveis mais altos desbloqueiam conquistas e mostram seu progresso.',
    ],
  },
  {
    id: 'ofensiva',
    icon: Flame,
    title: 'O que é a Ofensiva?',
    content: [
      'A ofensiva mostra quantos dias seguidos você estudou.',
      'Estude pelo menos uma questão por dia para manter sua ofensiva.',
      'Quanto maior sua ofensiva, mais disciplinado você está sendo!',
      'Marcos especiais (7, 14, 30 dias) são celebrados com notificações.',
    ],
  },
  {
    id: 'estatisticas',
    icon: BarChart3,
    title: 'Como acompanho meu progresso?',
    content: [
      'Acesse a página de Estatísticas no menu lateral.',
      'Veja seu desempenho por matéria e identifique pontos fracos.',
      'Acompanhe sua evolução semanal com gráficos.',
      'Compare seu desempenho com outros estudantes no ranking.',
    ],
  },
  {
    id: 'praticar',
    icon: Sparkles,
    title: 'Modo Praticar',
    content: [
      'O modo Praticar permite estudar questões avulsas fora da trilha.',
      'Escolha matérias, bancas e dificuldade para personalizar seu treino.',
      'Ideal para revisar conteúdos específicos ou treinar antes de provas.',
      'As questões praticadas também contam para suas estatísticas.',
    ],
  },
  {
    id: 'conquistas',
    icon: Trophy,
    title: 'Conquistas e Recompensas',
    content: [
      'Complete desafios para desbloquear conquistas especiais.',
      'Ganhe moedas ao completar missões e acertar questões.',
      'Use suas moedas na loja para comprar itens e personalizações.',
      'Acompanhe suas conquistas na página de Perfil.',
    ],
  },
];

function TutorialAccordion({ tutorial }: { tutorial: TutorialSection }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = tutorial.icon;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center">
            <Icon size={20} className="text-[var(--color-brand)]" />
          </div>
          <span className="text-[var(--color-text-main)] font-medium text-left">{tutorial.title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-0">
              <div className="pl-[52px] space-y-2">
                {tutorial.content.map((paragraph, index) => (
                  <p key={index} className="text-[var(--color-text-sec)] text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const whatsappNumber = '5511989363790';
  const whatsappMessage = encodeURIComponent(
    'Olá! Preciso de ajuda com o Ouse Questões.'
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Iniciar o tour guiado
  const handleStartTour = () => {
    // Limpa a flag de tour completo para permitir refazer
    localStorage.removeItem('ousepassar_tour_completed');
    // Define a flag para iniciar o tour
    localStorage.setItem('ousepassar_start_tour', 'true');
    // Navega para a home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] px-4 py-6 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand)]/10 flex items-center justify-center">
                <HelpCircle size={24} className="text-[var(--color-brand)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Central de Ajuda</h1>
                <p className="text-[var(--color-text-sec)] text-sm">Tire suas dúvidas sobre a plataforma</p>
              </div>
            </div>
            {/* Botão Tour Guiado */}
            <button
              onClick={handleStartTour}
              className="flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-black font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Play size={18} />
              <span className="hidden sm:inline">Tour Guiado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 max-w-2xl mx-auto pt-6">
        {/* Tutorials Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Tutoriais</h2>
          <div className="space-y-3">
            {tutorials.map((tutorial) => (
              <TutorialAccordion key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        </div>

        {/* Ticket Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center">
              <Ticket size={20} className="text-[var(--color-brand)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Abrir um Ticket</h2>
              <p className="text-[var(--color-text-muted)] text-sm">Envie sua dúvida ou problema para nossa equipe</p>
            </div>
          </div>
          <CreateTicketForm />
        </div>

        {/* WhatsApp Contact */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
              <MessageCircle size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[var(--color-text-main)] font-semibold text-lg mb-1">
                Precisa de mais ajuda?
              </h3>
              <p className="text-[var(--color-text-sec)] text-sm mb-4">
                Nossa equipe de suporte está pronta para te ajudar.
                Fale conosco pelo WhatsApp!
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A]
                  text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <MessageCircle size={20} />
                Chamar no WhatsApp
                <ExternalLink size={16} className="opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            Horário de atendimento: Segunda a Sexta, 9h às 18h
          </p>
        </div>
      </div>
    </div>
  );
}
