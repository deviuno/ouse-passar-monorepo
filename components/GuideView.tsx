import React, { useState } from 'react';
import {
  ArrowLeft,
  Zap,
  Trophy,
  Target,
  Flame,
  Brain,
  Swords,
  BookOpen,
  Layers,
  BookX,
  Award,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Crown,
  Coins,
  Star,
  Shield,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  MessageCircle
} from 'lucide-react';

interface GuideViewProps {
  onBack: () => void;
}

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#252525] hover:bg-[#2A2A2A] transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="text-[#FFB800]">{icon}</div>
          <span className="font-bold text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-[#1E1E1E] border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; color?: string }> = ({
  icon,
  title,
  description,
  color = '#FFB800'
}) => (
  <div className="bg-[#252525] p-4 rounded-xl border border-gray-800">
    <div className="flex items-start space-x-3">
      <div style={{ color }} className="mt-0.5">{icon}</div>
      <div>
        <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
        <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const GuideView: React.FC<GuideViewProps> = ({ onBack }) => {
  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar">
      {/* Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-b from-[#FFB800]/30 via-[#FFB800]/10 to-[#1A1A1A] w-full absolute top-0 left-0 z-0"></div>

        <button
          onClick={onBack}
          className="absolute top-6 left-4 z-20 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="px-4 pt-20 pb-8 relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#FFB800] to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FFB800]/20">
            <Rocket size={40} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Guia do Concurseiro</h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Domine todas as ferramentas e acelere sua aprovação
          </p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-[#FFB800]/20 to-[#FFB800]/5 border border-[#FFB800]/30 rounded-2xl p-5">
          <div className="flex items-start space-x-3">
            <Sparkles className="text-[#FFB800] shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-white mb-2">Bem-vindo ao Ouse Passar!</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Você acabou de dar o primeiro passo rumo à sua <span className="text-[#FFB800] font-bold">aprovação</span>.
                Este guia vai te mostrar como usar cada recurso do app para estudar de forma mais
                <span className="text-[#FFB800] font-bold"> inteligente</span>, não mais difícil.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
            <Brain className="mx-auto mb-2 text-purple-400" size={24} />
            <p className="text-lg font-bold text-white">4</p>
            <p className="text-[10px] text-gray-500 uppercase">Modos de Estudo</p>
          </div>
          <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
            <Trophy className="mx-auto mb-2 text-yellow-400" size={24} />
            <p className="text-lg font-bold text-white">5</p>
            <p className="text-[10px] text-gray-500 uppercase">Ligas</p>
          </div>
          <div className="bg-[#252525] p-3 rounded-xl border border-gray-800 text-center">
            <Award className="mx-auto mb-2 text-green-400" size={24} />
            <p className="text-lg font-bold text-white">10+</p>
            <p className="text-[10px] text-gray-500 uppercase">Conquistas</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center">
          <BookOpen className="mr-2 text-[#FFB800]" size={20} />
          Tudo que Voce Precisa Saber
        </h2>

        {/* Modos de Estudo */}
        <AccordionItem
          title="Modos de Estudo"
          icon={<Brain size={20} />}
          defaultOpen={true}
        >
          <p className="text-gray-400 text-sm mb-4">
            Escolha o modo ideal para cada momento do seu estudo. Cada um foi pensado para uma necessidade específica.
          </p>

          <div className="space-y-3">
            <FeatureCard
              icon={<Zap size={20} />}
              title="Modo Zen"
              description="Estude sem pressão de tempo. Ideal para aprender conceitos novos e fixar conteúdo. Receba feedback imediato após cada questão."
              color="#22C55E"
            />
            <FeatureCard
              icon={<Target size={20} />}
              title="Modo Reta Final"
              description="Foco total nas questões mais cobradas! Questões de alta frequência em provas, com comentários diretos e objetivos. Perfeito para as últimas semanas antes da prova."
              color="#F97316"
            />
            <FeatureCard
              icon={<Clock size={20} />}
              title="Modo Simulado"
              description="Simule as condições reais da prova com cronômetro. Configure o tempo (15 a 240 minutos) e veja seu desempenho só no final, como numa prova de verdade."
              color="#3B82F6"
            />
            <FeatureCard
              icon={<TrendingUp size={20} />}
              title="Modo Revisão Inteligente"
              description="Nossa IA agenda suas revisões no momento perfeito usando espaçamento repetido (SRS). Nunca mais esqueça o que estudou!"
              color="#8B5CF6"
            />
          </div>

          <div className="mt-4 p-3 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-xl">
            <p className="text-xs text-[#FFB800] flex items-start">
              <Sparkles size={14} className="mr-2 mt-0.5 shrink-0" />
              <span><strong>Dica de Ouro:</strong> Comece no Modo Zen para aprender, evolua para Reta Final na revisão, e finalize com Simulados na semana da prova!</span>
            </p>
          </div>
        </AccordionItem>

        {/* Sistema de Gamificação */}
        <AccordionItem
          title="Sistema de Gamificação"
          icon={<Trophy size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Transforme seu estudo em um jogo! Ganhe recompensas, suba de nível e compete com outros concurseiros.
          </p>

          <div className="space-y-3">
            <FeatureCard
              icon={<Zap size={20} />}
              title="XP (Experiência)"
              description="Ganhe XP a cada questão correta (+10 XP), sessão de flashcards (+50 XP) e simulados aprovados (+250 XP bônus). Quanto mais XP, maior seu nível!"
              color="#FFB800"
            />
            <FeatureCard
              icon={<Star size={20} />}
              title="Níveis e Títulos"
              description="Comece como 'Novato' e evolua até 'Lenda dos Concursos'! Cada 500 XP te leva a um novo nível. Mostre seu progresso para todos."
              color="#FFB800"
            />
            <FeatureCard
              icon={<Coins size={20} />}
              title="Moedas"
              description="Acumule moedas completando simulados (+50) e vencendo batalhas PvP (+20). Use para comprar avatares exclusivos, temas e power-ups!"
              color="#FFB800"
            />
            <FeatureCard
              icon={<Flame size={20} />}
              title="Ofensiva (Streak)"
              description="Mantenha dias consecutivos de estudo! Quanto maior sua sequência, mais motivado você fica. Não quebre a corrente!"
              color="#F97316"
            />
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-1 text-xs">Nv.1</div>
              <p className="text-[9px] text-gray-500">Novato</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-1 text-xs">Nv.5</div>
              <p className="text-[9px] text-gray-500">Aprendiz</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center mx-auto mb-1 text-xs">Nv.10</div>
              <p className="text-[9px] text-gray-400">Dedicado</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center mx-auto mb-1 text-xs">Nv.20</div>
              <p className="text-[9px] text-gray-400">Guardiao</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#FFB800]/30 flex items-center justify-center mx-auto mb-1 text-xs border border-[#FFB800]">Nv.50</div>
              <p className="text-[9px] text-[#FFB800]">Lenda</p>
            </div>
          </div>
        </AccordionItem>

        {/* Sistema de Ligas */}
        <AccordionItem
          title="Ligas e Ranking"
          icon={<Crown size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Compete semanalmente com outros concurseiros da sua liga. Os melhores sobem, os ultimos caem!
          </p>

          <div className="space-y-2 mb-4">
            {[
              { name: 'Liga Diamante', icon: '💎', color: '#B9F2FF', desc: 'Elite dos concurseiros' },
              { name: 'Liga Ouro', icon: '🥇', color: '#FFD700', desc: 'Competição acirrada' },
              { name: 'Liga Prata', icon: '🥈', color: '#C0C0C0', desc: 'Crescimento constante' },
              { name: 'Liga Bronze', icon: '🥉', color: '#CD7F32', desc: 'Evoluindo rápido' },
              { name: 'Liga Ferro', icon: '🔩', color: '#6B7280', desc: 'Ponto de partida' },
            ].map((league, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-gray-800">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{league.icon}</span>
                  <div>
                    <p className="font-bold text-white text-sm" style={{ color: league.color }}>{league.name}</p>
                    <p className="text-gray-500 text-xs">{league.desc}</p>
                  </div>
                </div>
                {idx === 4 && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Inicio</span>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <ChevronUp className="mx-auto text-green-500 mb-1" size={20} />
              <p className="text-green-400 text-xs font-bold">Top 3 Sobem</p>
              <p className="text-gray-500 text-[10px]">para próxima liga</p>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
              <ChevronDown className="mx-auto text-red-500 mb-1" size={20} />
              <p className="text-red-400 text-xs font-bold">Últimos 3 Caem</p>
              <p className="text-gray-500 text-[10px]">para liga anterior</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-xl">
            <p className="text-xs text-[#FFB800] flex items-start">
              <Clock size={14} className="mr-2 mt-0.5 shrink-0" />
              <span><strong>Ranking reinicia toda segunda-feira!</strong> Estude consistentemente durante a semana para garantir sua promoção.</span>
            </p>
          </div>
        </AccordionItem>

        {/* PvP */}
        <AccordionItem
          title="Batalhas PvP"
          icon={<Swords size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Desafie outros concurseiros em batalhas em tempo real! Teste seus conhecimentos sob pressão.
          </p>

          <div className="space-y-3">
            <FeatureCard
              icon={<Users size={20} />}
              title="Matchmaking Aleatório"
              description="Enfrente jogadores aleatórios da sua liga. É como um simulado, mas contra uma pessoa real!"
              color="#EF4444"
            />
            <FeatureCard
              icon={<Shield size={20} />}
              title="Desafiar Amigo"
              description="Convide um amigo para uma batalha privada. Ótimo para estudar em grupo de forma competitiva!"
              color="#3B82F6"
            />
          </div>

          <div className="mt-4 p-4 bg-[#252525] rounded-xl border border-gray-800">
            <h4 className="font-bold text-white text-sm mb-3">Como Funciona:</h4>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-[#FFB800] text-black text-xs font-bold flex items-center justify-center mr-2 shrink-0">1</span>
                Escolha matchmaking ou desafie um amigo
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-[#FFB800] text-black text-xs font-bold flex items-center justify-center mr-2 shrink-0">2</span>
                Ambos respondem as mesmas questões simultaneamente
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-[#FFB800] text-black text-xs font-bold flex items-center justify-center mr-2 shrink-0">3</span>
                Quem acertar mais (e mais rápido) vence!
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-[#FFB800] text-black text-xs font-bold flex items-center justify-center mr-2 shrink-0">4</span>
                Ganhe moedas e XP pela vitória
              </li>
            </ol>
          </div>

          <div className="mt-3 flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center text-green-400">
              <Trophy size={16} className="mr-1" />
              <span>+20 moedas</span>
            </div>
            <div className="flex items-center text-[#FFB800]">
              <Zap size={16} className="mr-1" />
              <span>+XP por acerto</span>
            </div>
          </div>
        </AccordionItem>

        {/* Ferramentas de Revisão */}
        <AccordionItem
          title="Ferramentas de Revisão"
          icon={<Layers size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Ferramentas poderosas para garantir que você nunca esqueça o que estudou.
          </p>

          <div className="space-y-3">
            <FeatureCard
              icon={<Layers size={20} />}
              title="Flashcards Inteligentes"
              description="Nossa IA transforma suas questões erradas em flashcards automaticamente! Estude os conceitos de forma rápida e eficiente."
              color="#A855F7"
            />
            <FeatureCard
              icon={<BookX size={20} />}
              title="Caderno de Erros"
              description="Todos os seus erros em um só lugar. Revise exatamente onde você mais precisa melhorar. Transforme fraquezas em pontos fortes!"
              color="#EF4444"
            />
            <FeatureCard
              icon={<AlertTriangle size={20} />}
              title="Zona de Pegadinhas"
              description="Questões que mais reprovam candidatos! Aprenda a identificar armadilhas comuns das bancas e nunca mais caia nelas."
              color="#F97316"
            />
          </div>

          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-xs text-purple-300 flex items-start">
              <Brain size={14} className="mr-2 mt-0.5 shrink-0" />
              <span><strong>Espaçamento Repetido (SRS):</strong> Nossa IA agenda suas revisões no momento ideal - nem cedo demais (desperdício), nem tarde demais (esquecimento).</span>
            </p>
          </div>
        </AccordionItem>

        {/* Redação e IA */}
        <AccordionItem
          title="Correção de Redação com IA"
          icon={<PenTool size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Receba feedback instantâneo e detalhado da sua redação, como se tivesse um professor particular 24h!
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-[#252525] rounded-xl border border-gray-800">
              <h4 className="font-bold text-white text-sm mb-3">O que você recebe:</h4>
              <div className="space-y-2">
                {[
                  { icon: <Target size={14} />, text: 'Nota geral de 0 a 200 pontos' },
                  { icon: <CheckCircle2 size={14} />, text: 'Análise de gramática e ortografia' },
                  { icon: <BookOpen size={14} />, text: 'Avaliação da estrutura textual' },
                  { icon: <Brain size={14} />, text: 'Feedback sobre argumentação' },
                  { icon: <Sparkles size={14} />, text: 'Parágrafo reescrito como exemplo' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                    <span className="text-[#FFB800]">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-blue-300 flex items-start">
              <MessageCircle size={14} className="mr-2 mt-0.5 shrink-0" />
              <span><strong>Tutor IA:</strong> Além da redação, você pode conversar com nosso tutor IA para tirar dúvidas sobre qualquer questão!</span>
            </p>
          </div>
        </AccordionItem>

        {/* Conquistas */}
        <AccordionItem
          title="Sistema de Conquistas"
          icon={<Award size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Desbloqueie badges especiais conforme você evolui. Cada conquista é uma prova do seu esforço!
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '👶', name: 'Primeiros Passos', desc: '10 questões' },
              { icon: '🎯', name: 'Sniper', desc: '5 seguidas' },
              { icon: '🔥', name: 'Dedicação Total', desc: '7 dias streak' },
              { icon: '💯', name: 'Centurião', desc: '100 questões' },
              { icon: '⚖️', name: 'Mestre da Lei', desc: '100 de Direito' },
              { icon: '🏆', name: 'Mil Questões', desc: '1000 questões' },
            ].map((ach, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3 bg-[#252525] rounded-xl border border-gray-800">
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white">{ach.name}</p>
                  <p className="text-[10px] text-gray-500">{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* Meta Diária */}
        <AccordionItem
          title="Meta Diária"
          icon={<Target size={20} />}
        >
          <p className="text-gray-400 text-sm mb-4">
            Defina e cumpra sua meta diária para manter a consistência nos estudos.
          </p>

          <div className="p-4 bg-[#252525] rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold">Meta do Dia</span>
              <span className="text-[#FFB800] font-bold">50 questoes</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-[#FFB800] to-yellow-500 rounded-full w-3/4"></div>
            </div>
            <p className="text-xs text-gray-500 text-center">37/50 questões corretas hoje</p>
          </div>

          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-xs text-green-300 flex items-start">
              <CheckCircle2 size={14} className="mr-2 mt-0.5 shrink-0" />
              <span><strong>Consistência vence talento!</strong> Estudar um pouco todos os dias é mais efetivo que maratonas esporádicas.</span>
            </p>
          </div>
        </AccordionItem>
      </div>

      {/* CTA Final */}
      <div className="px-4 mt-8 mb-8">
        <div className="bg-gradient-to-r from-[#FFB800] to-yellow-500 rounded-2xl p-6 text-center">
          <Rocket className="mx-auto mb-3 text-black" size={40} />
          <h3 className="text-xl font-bold text-black mb-2">Pronto para Comecar?</h3>
          <p className="text-black/70 text-sm mb-4">
            Cada questao resolvida te aproxima da aprovacao. Comece agora!
          </p>
          <button
            onClick={onBack}
            className="bg-black text-[#FFB800] font-bold py-3 px-8 rounded-xl hover:bg-black/80 transition-colors"
          >
            Comecar a Estudar
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 text-center">
        <p className="text-gray-600 text-xs">
          Duvidas? Fale conosco pelo suporte.
        </p>
        <p className="text-gray-700 text-[10px] mt-2">
          Ouse Passar - Sua aprovacao e nossa missao
        </p>
      </div>
    </div>
  );
};

export default GuideView;
