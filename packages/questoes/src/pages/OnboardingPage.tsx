import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useOnboardingStore, useAuthStore } from '../stores';
import { Button, Progress } from '../components/ui';
import { UserLevel } from '../types';
import { userPreparatoriosService } from '../services';
import { calcularQuestoesPorSchedule, descreverCalculoQuestoes } from '../lib';
import {
  InicioStep,
  CadastroStep,
  ConcursoStep,
  NivelStep,
  DisponibilidadeStep,
  LoadingStep,
} from '../components/onboarding';

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
    <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col">
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
