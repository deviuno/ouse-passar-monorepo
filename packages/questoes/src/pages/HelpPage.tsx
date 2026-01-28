import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Target,
  Trophy,
  BarChart3,
  Sparkles,
  ExternalLink,
  Ticket,
  Play,
  Battery,
  User,
  Rocket,
  Shield,
} from 'lucide-react';
import { CreateTicketForm } from '../components/support/CreateTicketForm';
import { useUIStore } from '../stores';

// Types
interface HelpSection {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  items: HelpItem[];
}

interface HelpItem {
  title: string;
  content: string;
  highlight?: string;
}

// Help content data
const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    icon: Rocket,
    iconColor: '#FFB800',
    title: 'Primeiros Passos',
    description: 'Como começar a usar o Ouse Questões',
    items: [
      {
        title: 'O que é a Trilha?',
        content: 'A Trilha é seu caminho personalizado de estudos. Ela organiza as questões em rodadas e missões, guiando você de forma progressiva pelo conteúdo.',
      },
      {
        title: 'Como funciona uma Missão?',
        content: 'Cada missão é um conjunto de questões sobre um tema específico. Comece lendo o conteúdo explicativo, depois responda as questões. Você precisa atingir 70% de aproveitamento para completar a missão.',
        highlight: '70% para passar',
      },
      {
        title: 'Modo Praticar',
        content: 'Além da Trilha, você pode praticar questões avulsas. Escolha matérias, bancas e filtros para personalizar seu treino. Ideal para revisar conteúdos específicos.',
      },
    ],
  },
  {
    id: 'gamification',
    icon: Trophy,
    iconColor: '#FFD700',
    title: 'Gamificação',
    description: 'Entenda o sistema de recompensas',
    items: [
      {
        title: 'XP e Níveis',
        content: 'Você ganha XP (pontos de experiência) ao acertar questões. A cada 1.000 XP, você sobe de nível. Seu nível aparece no perfil e mostra seu progresso geral.',
        highlight: '1.000 XP = 1 Nível',
      },
      {
        title: 'Moedas',
        content: 'Ganhe moedas ao completar missões e acertar questões. Use-as para desbloquear conquistas e itens especiais na plataforma.',
      },
      {
        title: 'Conquistas',
        content: 'Complete desafios para desbloquear conquistas especiais. Elas ficam visíveis no seu perfil e mostram suas realizações.',
      },
    ],
  },
  {
    id: 'profile',
    icon: User,
    iconColor: '#3498DB',
    title: 'Perfil e Estatísticas',
    description: 'Os números que mostram seu progresso',
    items: [
      {
        title: 'Questões Respondidas',
        content: 'Total de questões que você já respondeu. Quanto mais praticar, melhor será sua preparação para o concurso.',
      },
      {
        title: 'Taxa de Acertos',
        content: 'Porcentagem de questões que você acertou. Busque manter acima de 70% para garantir uma boa preparação.',
        highlight: 'Meta: acima de 70%',
      },
      {
        title: 'Ofensiva (Streak)',
        content: 'Mostra quantos dias seguidos você estudou. Mantenha sua ofensiva estudando pelo menos uma questão por dia. Marcos especiais são celebrados em 7, 14 e 30 dias.',
        highlight: 'Estude todos os dias!',
      },
      {
        title: 'Tempo Médio',
        content: 'Tempo médio que você leva para responder cada questão. Ajuda a entender seu ritmo de estudo.',
      },
    ],
  },
  {
    id: 'leagues',
    icon: Shield,
    iconColor: '#9B59B6',
    title: 'Sistema de Ligas',
    description: 'Compete com outros estudantes',
    items: [
      {
        title: 'Como funcionam as Ligas?',
        content: 'Você é classificado em uma liga baseada no seu desempenho semanal. Suba de liga ao ficar entre os melhores da sua liga atual.',
      },
      {
        title: 'Liga Ferro 🔩',
        content: 'Liga inicial. Todos começam aqui. Estude regularmente para subir!',
      },
      {
        title: 'Liga Bronze 🥉',
        content: 'Segundo nível. Você já demonstrou consistência nos estudos.',
      },
      {
        title: 'Liga Prata 🥈',
        content: 'Terceiro nível. Seus estudos estão dando resultado!',
      },
      {
        title: 'Liga Ouro 🥇',
        content: 'Quarto nível. Você está entre os dedicados!',
      },
      {
        title: 'Liga Diamante 💎',
        content: 'Nível máximo! Reservado para os estudantes mais dedicados.',
      },
    ],
  },
  {
    id: 'battery',
    icon: Battery,
    iconColor: '#2ECC71',
    title: 'Sistema de Bateria',
    description: 'Sua energia diária de estudos',
    items: [
      {
        title: 'O que é a Bateria?',
        content: 'A bateria é sua energia diária para usar os recursos da plataforma. Cada ação consome uma quantidade de energia.',
      },
      {
        title: 'Consumo por Ação',
        content: 'Questão: -2 energia | Iniciar Missão: -5 energia | Chat com IA: -3 energia | Gerar Áudio: -5 energia | Gerar Podcast: -10 energia | Resumo IA: -5 energia',
      },
      {
        title: 'Recarga da Bateria',
        content: 'Sua bateria é recarregada automaticamente todo dia à meia-noite. Planeje seus estudos considerando sua energia disponível.',
        highlight: 'Recarga à meia-noite',
      },
      {
        title: 'Bateria Ilimitada',
        content: 'Com o plano premium, você tem bateria ilimitada para estudar sem restrições, a qualquer hora do dia.',
      },
    ],
  },
  {
    id: 'stats',
    icon: BarChart3,
    iconColor: '#E74C3C',
    title: 'Página de Estatísticas',
    description: 'Acompanhe sua evolução detalhada',
    items: [
      {
        title: 'Mapa de Calor',
        content: 'Mostra seu desempenho por matéria. Cores mais escuras indicam mais acertos. Identifique rapidamente seus pontos fortes e fracos.',
      },
      {
        title: 'Gráfico de Evolução',
        content: 'Visualize seu progresso ao longo do tempo. Veja quantas questões você respondeu e sua taxa de acerto por dia.',
      },
      {
        title: 'Ranking Semanal',
        content: 'Compare seu desempenho com outros estudantes da mesma liga. Os melhores sobem de liga!',
      },
      {
        title: 'Recomendações',
        content: 'Receba sugestões personalizadas de estudo baseadas no seu desempenho. O sistema identifica onde você precisa focar.',
      },
    ],
  },
];

// Accordion Item Component
function AccordionSection({ section, isOpen, onToggle }: {
  section: HelpSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${section.iconColor}15` }}
        >
          <Icon size={24} style={{ color: section.iconColor }} />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-[var(--color-text-main)] font-semibold">{section.title}</h3>
          <p className="text-[var(--color-text-muted)] text-sm">{section.description}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
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
            <div className="px-4 pb-4 space-y-3">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[var(--color-brand)] text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[var(--color-text-main)] font-medium mb-1">{item.title}</h4>
                      <p className="text-[var(--color-text-sec)] text-sm leading-relaxed">{item.content}</p>
                      {item.highlight && (
                        <span className="inline-block mt-2 px-3 py-1 bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-xs font-medium rounded-full">
                          {item.highlight}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Link Card Component
function QuickLinkCard({ icon: Icon, title, description, onClick, color }: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 text-left hover:border-[var(--color-border-strong)] transition-all group"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[var(--color-text-main)] font-medium group-hover:text-[var(--color-brand)] transition-colors">{title}</h4>
          <p className="text-[var(--color-text-muted)] text-sm truncate">{description}</p>
        </div>
        <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<string[]>(['getting-started']);
  const [showTicketForm, setShowTicketForm] = useState(false);

  const whatsappNumber = '5511998058119';
  const whatsappMessage = encodeURIComponent(
    'Olá, preciso de ajuda com o App Ouse Questões'
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Iniciar o tour guiado
  const handleStartTour = () => {
    localStorage.removeItem('ousepassar_tour_completed');
    localStorage.setItem('ousepassar_start_tour', 'true');
    useUIStore.setState({ isTourCompleted: false });
    navigate('/');
    setTimeout(() => {
      useUIStore.getState().startTour();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand)]/10 flex items-center justify-center">
                <HelpCircle size={28} className="text-[var(--color-brand)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Central de Ajuda</h1>
                <p className="text-[var(--color-text-sec)] text-sm">Aprenda a usar todos os recursos</p>
              </div>
            </div>
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
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLinkCard
              icon={Target}
              title="Trilha de Estudos"
              description="Sua jornada de aprendizado"
              onClick={() => navigate('/trilha')}
              color="#FFB800"
            />
            <QuickLinkCard
              icon={Sparkles}
              title="Praticar Questões"
              description="Estude no seu ritmo"
              onClick={() => navigate('/praticar')}
              color="#9B59B6"
            />
            <QuickLinkCard
              icon={BarChart3}
              title="Estatísticas"
              description="Seu desempenho detalhado"
              onClick={() => navigate('/estatisticas')}
              color="#3498DB"
            />
            <QuickLinkCard
              icon={User}
              title="Seu Perfil"
              description="Configurações e progresso"
              onClick={() => navigate('/perfil')}
              color="#2ECC71"
            />
          </div>
        </div>

        {/* Tutorial Sections */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Tutoriais
          </h2>
          <div className="space-y-3">
            {helpSections.map((section) => (
              <AccordionSection
                key={section.id}
                section={section}
                isOpen={openSections.includes(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Suporte
          </h2>

          {/* Ticket Toggle */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden mb-3">
            <button
              onClick={() => setShowTicketForm(!showTicketForm)}
              className="w-full p-4 flex items-center gap-4 hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center flex-shrink-0">
                <Ticket size={24} className="text-[var(--color-brand)]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[var(--color-text-main)] font-semibold">Abrir um Ticket</h3>
                <p className="text-[var(--color-text-muted)] text-sm">Envie sua dúvida ou problema</p>
              </div>
              <motion.div
                animate={{ rotate: showTicketForm ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showTicketForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4">
                    <CreateTicketForm />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* WhatsApp Contact */}
          <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--color-text-main)] font-semibold mb-1">
                  Precisa de ajuda?
                </h3>
                <p className="text-[var(--color-text-sec)] text-sm mb-3">
                  Nossa equipe está pronta para te ajudar pelo WhatsApp!
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <MessageCircle size={18} />
                  Chamar no WhatsApp
                  <ExternalLink size={14} className="opacity-70" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center pb-6">
          <p className="text-[var(--color-text-muted)] text-sm">
            Atendimento: Segunda a Sexta, 9h às 18h
          </p>
        </div>
      </div>
    </div>
  );
}
