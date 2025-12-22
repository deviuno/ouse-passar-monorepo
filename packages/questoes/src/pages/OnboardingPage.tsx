import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  Minus,
  Plus,
  LogIn,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useOnboardingStore, useAuthStore } from '../stores';
import { Button, Progress } from '../components/ui';
import {
  LOGO_URL,
  NIVEL_OPTIONS,
} from '../constants';
import { UserLevel, WeeklySchedule, DAYS_OF_WEEK, Preparatorio } from '../types';
import { getPreparatorios, userPreparatoriosService } from '../services';
import { calcularQuestoesPorSchedule, descreverCalculoQuestoes } from '../lib';

// ============================================
// PASSO 0: INÍCIO (Já tem conta? ou Criar conta)
// ============================================
function InicioStep({
  onLogin,
  onCreateAccount,
}: {
  onLogin: () => void;
  onCreateAccount: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      {/* Logo */}
      <motion.img
        src={LOGO_URL}
        alt="Ouse Passar"
        className="h-16 mx-auto mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      />

      <h1 className="text-3xl font-bold text-white mb-3">
        Bem-vindo ao Ouse Passar!
      </h1>
      <p className="text-[#A0A0A0] mb-10 text-lg">
        A plataforma que vai te ajudar a conquistar sua aprovação.
      </p>

      {/* Opções */}
      <div className="space-y-4">
        {/* Criar Conta */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateAccount}
          className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold py-4 px-6 rounded-2xl
            flex items-center justify-center gap-3 transition-colors"
        >
          <UserPlus size={24} />
          <div className="text-left">
            <span className="block text-lg">Criar minha conta</span>
            <span className="block text-sm font-normal opacity-80">
              Comece sua jornada de estudos
            </span>
          </div>
          <ChevronRight size={24} className="ml-auto" />
        </motion.button>

        {/* Já tem conta */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full bg-[#252525] hover:bg-[#303030] text-white font-bold py-4 px-6 rounded-2xl
            border-2 border-[#3A3A3A] hover:border-[#FFB800]/50
            flex items-center justify-center gap-3 transition-all"
        >
          <LogIn size={24} className="text-[#FFB800]" />
          <div className="text-left">
            <span className="block text-lg">Já tenho uma conta</span>
            <span className="block text-sm font-normal text-[#A0A0A0]">
              Fazer login
            </span>
          </div>
          <ChevronRight size={24} className="ml-auto text-[#6E6E6E]" />
        </motion.button>
      </div>

      {/* Footer */}
      <p className="text-[#6E6E6E] text-sm mt-10">
        Ao continuar, você concorda com nossos{' '}
        <a href="#" className="text-[#FFB800] hover:underline">
          Termos de Uso
        </a>{' '}
        e{' '}
        <a href="#" className="text-[#FFB800] hover:underline">
          Política de Privacidade
        </a>
      </p>
    </motion.div>
  );
}

// ============================================
// PASSO 1: CADASTRO
// ============================================
function CadastroStep({
  data,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
}: {
  data: { name?: string; email?: string; phone?: string; password?: string };
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onPasswordChange: (password: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">Crie sua conta</h2>
      <p className="text-[#A0A0A0] mb-6">
        Preencha seus dados para começar sua jornada de estudos.
      </p>

      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm text-[#A0A0A0] mb-2">Nome completo</label>
          <div className="relative">
            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl py-3 pl-12 pr-4
                text-white placeholder-[#6E6E6E]
                focus:outline-none focus:border-[#FFB800] transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-[#A0A0A0] mb-2">E-mail</label>
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl py-3 pl-12 pr-4
                text-white placeholder-[#6E6E6E]
                focus:outline-none focus:border-[#FFB800] transition-colors"
            />
          </div>
        </div>

        {/* Celular */}
        <div>
          <label className="block text-sm text-[#A0A0A0] mb-2">Celular (WhatsApp)</label>
          <div className="relative">
            <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
            <input
              type="tel"
              value={data.phone || ''}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl py-3 pl-12 pr-4
                text-white placeholder-[#6E6E6E]
                focus:outline-none focus:border-[#FFB800] transition-colors"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm text-[#A0A0A0] mb-2">Senha</label>
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E6E]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.password || ''}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl py-3 pl-12 pr-12
                text-white placeholder-[#6E6E6E]
                focus:outline-none focus:border-[#FFB800] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E6E] hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {data.password && data.password.length < 6 && (
            <p className="text-red-400 text-xs mt-1">A senha deve ter no mínimo 6 caracteres</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// PASSO 2: CONCURSO
// ============================================
function ConcursoStep({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (concurso: string) => void;
}) {
  const [preparatorios, setPreparatorios] = useState<Preparatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    async function loadPreparatorios() {
      console.log('[ConcursoStep] Iniciando carregamento de preparatórios...');
      setIsLoading(true);
      setError(null);
      setDebugInfo('Chamando getPreparatorios()...');

      try {
        console.log('[ConcursoStep] Chamando getPreparatorios...');
        const data = await getPreparatorios();
        console.log('[ConcursoStep] Resposta recebida:', data);
        console.log('[ConcursoStep] Tipo:', typeof data, 'É array:', Array.isArray(data), 'Length:', data?.length);

        setDebugInfo(`Recebido: ${JSON.stringify(data?.length)} preparatórios`);

        if (!data) {
          console.error('[ConcursoStep] Data é null/undefined');
          setError('Erro: resposta vazia do servidor');
          return;
        }

        setPreparatorios(data);
      } catch (err: any) {
        console.error('[ConcursoStep] Erro ao carregar preparatórios:', err);
        setDebugInfo(`Erro: ${err?.message || 'desconhecido'}`);
        setError('Erro ao carregar preparatórios: ' + (err?.message || 'desconhecido'));
      } finally {
        setIsLoading(false);
      }
    }
    loadPreparatorios();
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="text-center py-12"
      >
        <Loader2 className="w-12 h-12 animate-spin text-[#FFB800] mx-auto mb-4" />
        <p className="text-[#A0A0A0]">Carregando opções de concurso...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="text-center py-12"
      >
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[#FFB800] underline"
        >
          Tentar novamente
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">Qual concurso você vai fazer?</h2>
      <p className="text-[#A0A0A0] mb-6">
        Isso define qual edital será carregado na sua trilha.
      </p>



      {preparatorios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#A0A0A0] mb-4">Nenhum preparatório disponível no momento.</p>
          <p className="text-[#6E6E6E] text-sm">
            Entre em contato com o suporte ou aguarde novos preparatórios serem adicionados.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[#FFB800] underline text-sm"
          >
            Recarregar página
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {preparatorios.map((prep) => (
            <motion.button
              key={prep.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(prep.id)}
              className={`
                group relative flex flex-col items-start text-left
                rounded-2xl overflow-hidden transition-all duration-200 h-full
                ${selected === prep.id
                  ? 'ring-2 ring-[#FFB800] ring-offset-2 ring-offset-[#121212]'
                  : 'hover:ring-2 hover:ring-[#3A3A3A] hover:ring-offset-2 hover:ring-offset-[#121212]'
                }
                bg-[#252525]
              `}
            >
              {/* Capa do Preparatório */}
              <div className="w-full aspect-[4/3] bg-[#333] relative overflow-hidden">
                {prep.imagem_capa ? (
                  <img
                    src={prep.imagem_capa}
                    alt={prep.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#333] to-[#252525]">
                    <span className="text-4xl mb-2 filter drop-shadow-lg">{prep.icone || '📚'}</span>
                  </div>
                )}

                {/* Overlay gradiente para legibilidade se tiver texto na imagem */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Badge de Selecionado */}
                {selected === prep.id && (
                  <div className="absolute top-2 right-2 bg-[#FFB800] text-black p-1 rounded-full shadow-lg z-10">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Conteúdo do Card */}
              <div className="p-3 w-full flex-1 flex flex-col">
                <h3 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-[#FFB800] transition-colors">
                  {prep.nome}
                </h3>

                {prep.descricao && (
                  <p className="text-[#A0A0A0] text-xs line-clamp-3 leading-relaxed mt-auto">
                    {prep.descricao}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// PASSO 3: NÍVEL
// ============================================
function NivelStep({
  selected,
  onSelect,
}: {
  selected?: UserLevel;
  onSelect: (nivel: UserLevel) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">Qual o seu nível de preparação?</h2>
      <p className="text-[#A0A0A0] mb-6">
        Isso ajusta a dificuldade e volume de questões.
      </p>

      <div className="space-y-3">
        {NIVEL_OPTIONS.map((nivel) => (
          <motion.button
            key={nivel.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(nivel.id as UserLevel)}
            className={`
              w-full p-4 rounded-xl text-left transition-all
              flex items-start gap-4
              ${selected === nivel.id
                ? 'bg-[#FFB800]/20 border-2 border-[#FFB800]'
                : 'bg-[#252525] border-2 border-transparent hover:border-[#3A3A3A]'
              }
            `}
          >
            <span className="text-3xl">{nivel.emoji}</span>
            <div className="flex-1">
              <p className="text-white font-medium">{nivel.title}</p>
              <p className="text-[#A0A0A0] text-sm">{nivel.desc}</p>
              <p className="text-[#FFB800] text-xs mt-1">{nivel.config}</p>
            </div>
            {selected === nivel.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-[#FFB800] flex items-center justify-center flex-shrink-0"
              >
                <Check size={14} className="text-black" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// PASSO 4: DISPONIBILIDADE
// ============================================
function DisponibilidadeStep({
  schedule,
  weeklyTotal,
  onToggleDay,
  onSetMinutes,
}: {
  schedule: WeeklySchedule;
  weeklyTotal: number;
  onToggleDay: (day: keyof WeeklySchedule) => void;
  onSetMinutes: (day: keyof WeeklySchedule, minutes: number) => void;
}) {
  // Formatar minutos para HH:MM
  const formatToHHMM = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Quando ativar um dia, definir 1 hora por padrão
  const handleToggleDay = (day: keyof WeeklySchedule) => {
    const isCurrentlyActive = schedule[day] > 0;
    if (!isCurrentlyActive) {
      // Ativando: definir 1 hora (60 minutos)
      onSetMinutes(day, 60);
    } else {
      // Desativando: zerar
      onSetMinutes(day, 0);
    }
  };

  // Ajustar tempo em ±15 minutos
  const adjustTime = (day: keyof WeeklySchedule, delta: number) => {
    const currentMinutes = schedule[day];
    const newMinutes = Math.max(0, Math.min(480, currentMinutes + delta));
    onSetMinutes(day, newMinutes);
  };

  // Lidar com mudança direta no input
  const handleTimeInputChange = (day: keyof WeeklySchedule, value: string) => {
    // Aceitar formato HH:MM
    const match = value.match(/^(\d{0,2}):?(\d{0,2})$/);
    if (match) {
      const hours = Math.min(8, parseInt(match[1]) || 0);
      const mins = Math.min(59, parseInt(match[2]) || 0);
      onSetMinutes(day, hours * 60 + mins);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">Sua disponibilidade</h2>
      <p className="text-[#A0A0A0] mb-6">
        Selecione os dias e quanto tempo você pode estudar em cada um.
      </p>

      {/* Lista de dias - cards compactos */}
      <div className="space-y-2 mb-6">
        {DAYS_OF_WEEK.map((day) => {
          const isActive = schedule[day.key] > 0;

          return (
            <div
              key={day.key}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${isActive ? 'bg-[#252525] border border-[#FFB800]/30' : 'bg-[#1E1E1E] border border-[#333]'}
              `}
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggleDay(day.key)}
                className={`
                  w-11 h-6 rounded-full p-0.5 transition-colors flex-shrink-0
                  ${isActive ? 'bg-[#FFB800]' : 'bg-[#3A3A3A]'}
                `}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: isActive ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>

              {/* Nome do dia */}
              <span className={`font-medium flex-1 min-w-0 ${isActive ? 'text-white' : 'text-[#6E6E6E]'}`}>
                {day.fullLabel}
              </span>

              {/* Controles de tempo (apenas quando ativo) */}
              {isActive && (
                <div className="flex items-center gap-1">
                  {/* Botão -15 */}
                  <button
                    onClick={() => adjustTime(day.key, -15)}
                    className="w-8 h-8 rounded-lg bg-[#333] hover:bg-[#404040] text-[#A0A0A0] hover:text-white
                      flex items-center justify-center transition-colors text-xs font-bold"
                  >
                    <Minus size={14} />
                  </button>

                  {/* Input HH:MM */}
                  <input
                    type="text"
                    value={formatToHHMM(schedule[day.key])}
                    onChange={(e) => handleTimeInputChange(day.key, e.target.value)}
                    className="w-16 bg-[#333] text-[#FFB800] text-center font-mono font-bold text-lg
                      rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#FFB800]"
                  />

                  {/* Botão +15 */}
                  <button
                    onClick={() => adjustTime(day.key, 15)}
                    className="w-8 h-8 rounded-lg bg-[#333] hover:bg-[#404040] text-[#A0A0A0] hover:text-white
                      flex items-center justify-center transition-colors text-xs font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo Semanal - abaixo dos cards, não sticky */}
      <div className="bg-gradient-to-r from-[#FFB800]/20 to-[#FFB800]/10 border border-[#FFB800]/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#A0A0A0] text-sm">Total por semana</p>
            <motion.p
              key={weeklyTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-[#FFB800] font-mono"
            >
              {formatToHHMM(weeklyTotal)}
            </motion.p>
          </div>
          <div className="text-right">
            <p className="text-[#A0A0A0] text-sm">
              {DAYS_OF_WEEK.filter((d) => schedule[d.key] > 0).length} dias ativos
            </p>
            <p className="text-white text-sm">
              ~{Math.round(weeklyTotal / Math.max(1, DAYS_OF_WEEK.filter((d) => schedule[d.key] > 0).length))} min/dia
            </p>
          </div>
        </div>
      </div>

      {weeklyTotal === 0 && (
        <p className="text-center text-red-400 text-sm mt-4">
          Selecione pelo menos um dia de estudo
        </p>
      )}
    </motion.div>
  );
}

// ============================================
// PASSO 5: LOADING
// ============================================
function LoadingStep({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const messages = [
    'Analisando seu perfil...',
    'Configurando carga de questões...',
    'Montando sua trilha personalizada...',
    'Quase lá...',
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress < 25) setMessageIndex(0);
    else if (progress < 50) setMessageIndex(1);
    else if (progress < 75) setMessageIndex(2);
    else setMessageIndex(3);
  }, [progress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-[#3A3A3A] border-t-[#FFB800]"
      />

      <h2 className="text-2xl font-bold text-white mb-4">
        Carregando seu plano de estudos personalizado...
      </h2>

      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[#A0A0A0] mb-8"
      >
        {messages[messageIndex]}
      </motion.p>

      <div className="max-w-xs mx-auto">
        <Progress value={progress} size="lg" showLabel />
      </div>
    </motion.div>
  );
}

// ============================================
// PÁGINA PRINCIPAL DE ONBOARDING
// ============================================
export default function OnboardingPage() {
  const navigate = useNavigate();
  const {
    register,
    completeOnboarding,
    updateOnboardingStep,
    isAuthenticated,
    onboarding,
  } = useAuthStore();
  const {
    currentStep,
    data,
    nextStep,
    previousStep,
    goToStep,
    setName,
    setEmail,
    setPhone,
    setPassword,
    setConcursoAlvo,
    setNivelConhecimento,
    toggleDay,
    setDayMinutes,
    canGoNext,
    getProgress,
    getWeeklyTotal,
    getRegistrationData,
    getPreferencesData,
  } = useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = getProgress();
  const weeklyTotal = getWeeklyTotal();

  // Log de debug para acompanhar mudanças de step
  useEffect(() => {
    console.log('[OnboardingPage] Step mudou:', {
      currentStep,
      stepIndex: useOnboardingStore.getState().stepIndex,
      isAuthenticated,
      hasOnboarding: !!onboarding,
    });
  }, [currentStep]);

  // Verificar se usuário já está logado e onboarding completo
  useEffect(() => {
    if (isAuthenticated && onboarding) {
      const savedStep = onboarding.onboarding_step;
      console.log('[OnboardingPage] Estado do banco:', { savedStep });

      // APENAS redirecionar se onboarding já foi completado
      if (savedStep === 'completed') {
        navigate('/', { replace: true });
        return;
      }
      // NÃO restaurar step do banco - sempre seguir fluxo normal do frontend
    }
  }, [isAuthenticated, onboarding, navigate]);

  // Handler para cadastro (cria o usuário)
  const handleCadastroSubmit = async () => {
    const registration = getRegistrationData();
    if (!registration) return;

    console.log('[OnboardingPage] handleCadastroSubmit - step atual:', currentStep);
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: regError } = await register(
        registration.email,
        registration.password,
        registration.name,
        registration.phone
      );

      if (regError) {
        setError(regError);
        setIsSubmitting(false);
        return;
      }

      // Sucesso - avançar para próxima etapa (concurso)
      console.log('[OnboardingPage] Cadastro OK, avançando para concurso');
      nextStep();
      console.log('[OnboardingPage] Novo step após cadastro:', useOnboardingStore.getState().currentStep);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para concurso (salva e avança)
  const handleConcursoSelect = async (concurso: string) => {
    console.log('[OnboardingPage] handleConcursoSelect - step atual:', currentStep, '- concurso:', concurso);

    // Validar que estamos no step correto
    if (currentStep !== 'concurso') {
      console.error('[OnboardingPage] ERRO: handleConcursoSelect chamado no step errado:', currentStep);
      return;
    }

    setConcursoAlvo(concurso);
    setIsSubmitting(true);

    try {
      await updateOnboardingStep('nivel', { concurso_alvo: concurso });
      console.log('[OnboardingPage] Concurso salvo, avançando para nivel');
      nextStep();
      console.log('[OnboardingPage] Novo step após concurso:', useOnboardingStore.getState().currentStep);
    } catch (err) {
      console.warn('Erro ao salvar concurso:', err);
      nextStep(); // Continuar mesmo se falhar
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para nível (salva e avança)
  const handleNivelSelect = async (nivel: UserLevel) => {
    console.log('[OnboardingPage] handleNivelSelect - step atual:', currentStep, '- nivel:', nivel);

    // Validar que estamos no step correto
    if (currentStep !== 'nivel') {
      console.error('[OnboardingPage] ERRO: handleNivelSelect chamado no step errado:', currentStep);
      return;
    }

    setNivelConhecimento(nivel);
    setIsSubmitting(true);

    try {
      await updateOnboardingStep('disponibilidade', { nivel_conhecimento: nivel });
      console.log('[OnboardingPage] Nivel salvo, avançando para disponibilidade');
      nextStep();
      console.log('[OnboardingPage] Novo step após nivel:', useOnboardingStore.getState().currentStep);
    } catch (err) {
      console.warn('Erro ao salvar nível:', err);
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para disponibilidade (salva schedule e vai para loading)
  const handleDisponibilidadeSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Salvar schedule (mantém step como 'disponibilidade' - loading é só transição visual)
      await updateOnboardingStep('disponibilidade', { schedule: data.schedule });
      nextStep(); // Vai para loading
    } catch (err) {
      console.warn('Erro ao salvar disponibilidade:', err);
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler final (completa o onboarding)
  const handleComplete = async () => {
    const preferences = getPreferencesData();
    const { user } = useAuthStore.getState();

    try {
      // Finalizar onboarding no banco
      await completeOnboarding({
        concurso_alvo: preferences?.target_contest_id,
        nivel_conhecimento: preferences?.proficiency_level as any,
        schedule: preferences?.schedule,
      });

      // Criar o primeiro preparatório do usuário (user_trail)
      if (user?.id && preferences?.target_contest_id) {
        try {
          // Calcular quantidade de questões por missão baseado na disponibilidade
          const questoesPorMissao = preferences?.schedule
            ? calcularQuestoesPorSchedule(preferences.schedule)
            : 20;

          // Log para debug
          if (preferences?.schedule) {
            const calculo = descreverCalculoQuestoes(
              Object.values(preferences.schedule).reduce((a, b) => a + b, 0),
              Object.values(preferences.schedule).filter(m => m > 0).length
            );
            console.log('[Onboarding] Cálculo de questões:', calculo);
          }

          await userPreparatoriosService.addPreparatorioToUser(
            user.id,
            preferences.target_contest_id,
            (preferences.proficiency_level as UserLevel) || 'iniciante',
            questoesPorMissao
          );

          console.log('[Onboarding] Preparatório criado com', questoesPorMissao, 'questões por missão');
        } catch (prepErr) {
          console.warn('Erro ao criar preparatório inicial:', prepErr);
          // Não bloquear o fluxo se falhar
        }
      }

      // Salvar em localStorage para demo mode
      localStorage.setItem('ousepassar_onboarding_completed', 'true');

      // Flag para iniciar o tour guiado na HomePage
      localStorage.setItem('ousepassar_start_tour', 'true');

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Erro ao finalizar onboarding:', err);
      // Em modo demo, ir mesmo assim
      localStorage.setItem('ousepassar_onboarding_completed', 'true');
      localStorage.setItem('ousepassar_start_tour', 'true');
      navigate('/', { replace: true });
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const renderStep = () => {
    console.log('[OnboardingPage] renderStep chamado com:', currentStep);

    switch (currentStep) {
      case 'inicio':
        return (
          <InicioStep
            onLogin={handleGoToLogin}
            onCreateAccount={() => {
              console.log('[OnboardingPage] InicioStep -> nextStep (para cadastro)');
              nextStep();
            }}
          />
        );
      case 'cadastro':
        return (
          <>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#E74C3C]/20 border border-[#E74C3C] text-[#E74C3C] p-3 rounded-xl mb-4 text-sm"
              >
                {error}
              </motion.div>
            )}
            <CadastroStep
              data={data}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPhoneChange={setPhone}
              onPasswordChange={setPassword}
            />
          </>
        );
      case 'concurso':
        console.log('[OnboardingPage] Renderizando ConcursoStep');
        return (
          <ConcursoStep
            selected={data.concurso_alvo}
            onSelect={handleConcursoSelect}
          />
        );
      case 'nivel':
        console.log('[OnboardingPage] Renderizando NivelStep');
        return (
          <NivelStep
            selected={data.nivel_conhecimento}
            onSelect={handleNivelSelect}
          />
        );
      case 'disponibilidade':
        console.log('[OnboardingPage] Renderizando DisponibilidadeStep');
        return (
          <DisponibilidadeStep
            schedule={data.schedule}
            weeklyTotal={weeklyTotal}
            onToggleDay={toggleDay}
            onSetMinutes={setDayMinutes}
          />
        );
      case 'loading':
        console.log('[OnboardingPage] Renderizando LoadingStep');
        return <LoadingStep onComplete={handleComplete} />;
      default:
        console.error('[OnboardingPage] Step desconhecido:', currentStep);
        return null;
    }
  };

  // Determinar se deve mostrar header com progresso
  const showProgressHeader = ['cadastro', 'concurso', 'nivel', 'disponibilidade'].includes(currentStep);
  const showFooterButton = ['cadastro', 'disponibilidade'].includes(currentStep);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
      {/* Header with Progress */}
      {showProgressHeader && (
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={previousStep}
                className="p-2 rounded-full hover:bg-[#252525] transition-colors"
              >
                <ChevronLeft size={24} className="text-[#A0A0A0]" />
              </button>
              <Progress value={progress.percentage} size="sm" className="flex-1" />
              <span className="text-sm text-[#A0A0A0] whitespace-nowrap">
                {progress.current}/{progress.total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className={`w-full ${currentStep === 'concurso' ? 'max-w-4xl' : 'max-w-md'}`}>
          <AnimatePresence mode="wait">
            <div key={currentStep}>{renderStep()}</div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      {showFooterButton && (
        <div className="p-6">
          <div className="max-w-md mx-auto">
            <Button
              onClick={currentStep === 'cadastro' ? handleCadastroSubmit : handleDisponibilidadeSubmit}
              fullWidth
              size="lg"
              disabled={!canGoNext() || isSubmitting}
              isLoading={isSubmitting}
              rightIcon={!isSubmitting ? <ChevronRight size={20} /> : undefined}
            >
              {currentStep === 'cadastro' ? 'Criar Conta' : 'Continuar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
