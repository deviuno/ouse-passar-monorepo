import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Calendar, Clock, User, Phone, ChevronLeft, ChevronRight, Loader2, CheckCircle, Mail } from 'lucide-react';
import { schedulingService, slotsService } from '../services/schedulingService';
import { preparatoriosService } from '../services/preparatoriosService';
import { Preparatorio, TimeSlot } from '../lib/database.types';

// Etapas do formulário
type Step = 'info' | 'schedule' | 'success';

export const Obrigado: React.FC = () => {
  const [searchParams] = useSearchParams();
  const produtoSlug = searchParams.get('produto') || 'prf';
  const emailParam = searchParams.get('email') || '';
  const nomeParam = searchParams.get('nome') || '';
  const whatsappParam = searchParams.get('whatsapp') || searchParams.get('telefone') || '';

  // Formatar WhatsApp da URL (remover caracteres não numéricos e formatar)
  const formatWhatsappFromUrl = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Verificar se tem dados suficientes para pular etapa 1
  // Agora considera Nome + Email como suficiente, além da validação antiga de Nome + WhatsApp
  const hasPrefilledData = (nomeParam.trim().length > 0 && emailParam.trim().length > 0) ||
    (nomeParam.trim().length > 0 && whatsappParam.replace(/\D/g, '').length >= 11);

  // Estado geral
  const [step, setStep] = useState<Step>(hasPrefilledData ? 'schedule' : 'info');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados do preparatório
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);

  // Dados do formulário - Etapa 1 (pré-preenchidos se vierem da URL)
  const [nome, setNome] = useState(nomeParam);
  const [email, setEmail] = useState(emailParam);
  const [whatsapp, setWhatsapp] = useState(whatsappParam ? formatWhatsappFromUrl(whatsappParam) : '');

  // Dados do formulário - Etapa 2
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Dados de confirmação
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState<{
    data: string;
    hora: string;
    vendedor: string;
    vendedorAvatar?: string | null;
    vendedorGenero?: 'masculino' | 'feminino' | null;
  } | null>(null);

  // Próximos 7 dias
  const getDays = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDays();

  useEffect(() => {
    loadPreparatorio();
  }, [produtoSlug]);

  useEffect(() => {
    if (selectedDate) {
      loadSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadPreparatorio = async () => {
    setLoading(true);
    try {
      const prep = await preparatoriosService.getBySlug(produtoSlug);
      if (prep) {
        setPreparatorio(prep);
      } else {
        setError('Produto não encontrado');
      }
    } catch (err) {
      console.error('Erro ao carregar preparatório:', err);
      setError('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const loadSlotsForDate = async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const allSlots = await slotsService.getAvailableSlots(7);
      // Filtrar apenas slots do dia selecionado
      const dateStr = date.toISOString().split('T')[0];
      const daySlots = allSlots.filter(slot => slot.data === dateStr);
      setSlots(daySlots);
    } catch (err) {
      console.error('Erro ao carregar slots:', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Formata o telefone
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleNextStep = () => {
    if (!nome.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido');
      return;
    }
    if (whatsapp.replace(/\D/g, '').length < 11) {
      setError('Por favor, informe um WhatsApp válido');
      return;
    }
    setError(null);
    setStep('schedule');
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !preparatorio) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await schedulingService.createLeadAndAgendamento(
        {
          nome,
          telefone: whatsapp,
          email: email || undefined,
          concurso_almejado: preparatorio.nome,
          preparatorio_id: preparatorio.id
        },
        selectedSlot
      );

      const dataHora = new Date(`${selectedSlot.data}T${selectedSlot.hora_inicio}:00`);
      setAgendamentoConfirmado({
        data: dataHora.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long'
        }),
        hora: dataHora.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        vendedor: selectedSlot.vendedor_nome || 'Especialista',
        vendedorAvatar: selectedSlot.vendedor_avatar,
        vendedorGenero: selectedSlot.vendedor_genero || 'feminino'
      });

      setStep('success');
    } catch (err) {
      console.error('Erro ao agendar:', err);
      setError('Erro ao agendar reunião. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDayLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    }
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  };

  const formatSlotTime = (horaInicio: string) => {
    return horaInicio; // já está no formato HH:mm
  };

  // Agrupar slots por período
  const getMorningSlots = () => slots.filter(s => parseInt(s.hora_inicio.split(':')[0]) < 12);
  const getAfternoonSlots = () => slots.filter(s => parseInt(s.hora_inicio.split(':')[0]) >= 12);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
              alt="Ouse Passar"
              className="h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            {step === 'success' ? 'Agendamento Confirmado!' : 'Compra Aprovada!'}
          </h1>
          <p className="text-gray-400">
            {step === 'success'
              ? 'Sua reunião foi agendada com sucesso'
              : preparatorio
                ? `Parabéns pela aquisição do ${preparatorio.nome}!`
                : 'Parabéns pela sua compra!'}
          </p>
        </div>

        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-brand-yellow' : 'text-green-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'info' ? 'border-brand-yellow bg-brand-yellow/10' : 'border-green-400 bg-green-400/10'
                }`}>
                {step === 'info' ? '1' : <Check className="w-4 h-4" />}
              </div>
              <span className="text-sm font-bold hidden sm:inline">Seus dados</span>
            </div>
            <div className={`w-12 h-0.5 ${step === 'schedule' ? 'bg-brand-yellow' : 'bg-gray-700'}`} />
            <div className={`flex items-center gap-2 ${step === 'schedule' ? 'text-brand-yellow' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'schedule' ? 'border-brand-yellow bg-brand-yellow/10' : 'border-gray-700'
                }`}>
                2
              </div>
              <span className="text-sm font-bold hidden sm:inline">Agendar reunião</span>
            </div>
          </div>
        )}

        {/* Card principal */}
        <div className="bg-brand-card border border-white/10 rounded-lg overflow-hidden">
          {step === 'info' && (
            <div className="p-6 space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-white mb-2">Agende sua Consultoria</h2>
                <p className="text-gray-400 text-sm">
                  Receba um planejamento personalizado de estudos com um de nossos especialistas
                </p>
              </div>

              {/* Nome */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                  Seu nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full bg-brand-dark border border-white/10 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-brand-yellow outline-none transition-colors"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                  Seu E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="w-full bg-brand-dark border border-white/10 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-brand-yellow outline-none transition-colors"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                  Seu WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-brand-dark border border-white/10 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-brand-yellow outline-none transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleNextStep}
                className="w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase text-sm hover:bg-yellow-400 transition-colors rounded-lg flex items-center justify-center gap-2"
              >
                Continuar
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'schedule' && (
            <div className="p-6 space-y-6">
              {/* Botão voltar */}
              <button
                onClick={() => setStep('info')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-white mb-2">Escolha uma data e horário</h2>
                <p className="text-gray-400 text-sm">
                  Reunião de 30 minutos com um especialista
                </p>
              </div>

              {/* Seletor de Data */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-3 block">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Selecione o dia
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day) => {
                    const isSelected = selectedDate?.toDateString() === day.toDateString();
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`p-3 rounded-lg border text-center transition-all ${isSelected
                          ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                          : 'border-white/10 hover:border-white/30 text-gray-400'
                          }`}
                      >
                        <div className="text-[10px] uppercase mb-1">{formatDayLabel(day)}</div>
                        <div className="text-lg font-bold">{day.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots de Horário */}
              {selectedDate && (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-3 block">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Horários disponíveis
                  </label>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum horário disponível para este dia</p>
                      <p className="text-sm">Tente selecionar outra data</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Manhã */}
                      {getMorningSlots().length > 0 && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-2">Manhã</p>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(
                              getMorningSlots().reduce((acc, slot) => {
                                if (!acc[slot.hora_inicio]) acc[slot.hora_inicio] = [];
                                acc[slot.hora_inicio].push(slot);
                                return acc;
                              }, {} as Record<string, TimeSlot[]>)
                            )
                              .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
                              .map(([time, availableSlots]) => {
                                // Verificar se o slot atualmente selecionado pertence a este horário
                                const isSelected = selectedSlot?.hora_inicio === time;

                                return (
                                  <button
                                    key={time}
                                    onClick={() => {
                                      // Load Balancing (Round Robin simplificado via Random)
                                      // Escolhe aleatoriamente um dos vendedores disponíveis neste horário
                                      const randomIndex = Math.floor(Math.random() * availableSlots.length);
                                      setSelectedSlot(availableSlots[randomIndex]);
                                    }}
                                    className={`py-2 px-3 rounded border text-sm font-medium transition-all ${isSelected
                                      ? 'border-brand-yellow bg-brand-yellow text-brand-darker'
                                      : 'border-white/10 text-white hover:border-white/30'
                                      }`}
                                  >
                                    {formatSlotTime(time)}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Tarde */}
                      {getAfternoonSlots().length > 0 && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-2">Tarde</p>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(
                              getAfternoonSlots().reduce((acc, slot) => {
                                if (!acc[slot.hora_inicio]) acc[slot.hora_inicio] = [];
                                acc[slot.hora_inicio].push(slot);
                                return acc;
                              }, {} as Record<string, TimeSlot[]>)
                            )
                              .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
                              .map(([time, availableSlots]) => {
                                // Verificar se o slot atualmente selecionado pertence a este horário
                                const isSelected = selectedSlot?.hora_inicio === time;

                                return (
                                  <button
                                    key={time}
                                    onClick={() => {
                                      // Load Balancing (Round Robin simplificado via Random)
                                      const randomIndex = Math.floor(Math.random() * availableSlots.length);
                                      setSelectedSlot(availableSlots[randomIndex]);
                                    }}
                                    className={`py-2 px-3 rounded border text-sm font-medium transition-all ${isSelected
                                      ? 'border-brand-yellow bg-brand-yellow text-brand-darker'
                                      : 'border-white/10 text-white hover:border-white/30'
                                      }`}
                                  >
                                    {formatSlotTime(time)}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedSlot || submitting}
                className="w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase text-sm hover:bg-yellow-400 transition-colors rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'success' && agendamentoConfirmado && (
            <div className="p-6">
              {/* Header de Sucesso */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Reunião Agendada!</h2>
                <p className="text-gray-400 text-sm">
                  Você receberá uma confirmação por WhatsApp
                </p>
              </div>

              {/* Data e Horário - Mesma linha */}
              <div className="bg-brand-dark/50 border border-white/10 rounded-lg p-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-[2]">
                    <p className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Data
                    </p>
                    <p className="text-white font-medium capitalize text-sm">{agendamentoConfirmado.data}</p>
                  </div>
                  <div className="flex-1 border-l border-white/10 pl-4">
                    <p className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Horário
                    </p>
                    <p className="text-white font-medium text-sm">{agendamentoConfirmado.hora}</p>
                  </div>
                </div>
              </div>

              {/* Seção Especialista - Destaque */}
              <div className="bg-brand-dark border border-brand-yellow/50 rounded-lg p-4 mb-6">
                {/* Header */}
                <div className="flex items-center gap-2 text-brand-yellow text-xs font-bold uppercase mb-4">
                  <User className="w-4 h-4" />
                  {agendamentoConfirmado.vendedorGenero === 'masculino' ? 'Seu Especialista' : 'Sua Especialista'}
                </div>

                {/* Foto e Nome */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-card rounded-full flex items-center justify-center overflow-hidden border border-brand-yellow/30">
                    {agendamentoConfirmado.vendedorAvatar ? (
                      <img
                        src={agendamentoConfirmado.vendedorAvatar}
                        alt={agendamentoConfirmado.vendedor}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">{agendamentoConfirmado.vendedor}</p>
                    <p className="text-gray-500 text-sm">Especialista em Concursos</p>
                  </div>
                </div>

                {/* Mensagem do Especialista */}
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                  <p>
                    Oi, <span className="text-brand-yellow font-semibold">{nome.split(' ')[0]}</span>! Aqui é {agendamentoConfirmado.vendedorGenero === 'masculino' ? 'o' : 'a'} {agendamentoConfirmado.vendedor.split(' ')[0]}. {'\u{1F44B}'}
                  </p>
                  <p>
                    Estou muito {agendamentoConfirmado.vendedorGenero === 'masculino' ? 'empolgado' : 'empolgada'} para a nossa reunião! {'\u{1F680}'}
                  </p>
                  <p>
                    Lá vamos montar o seu plano personalizado com o nosso método exclusivo, que já ajudou mais de 900 pessoas a serem aprovadas
                    {preparatorio ? <> no concurso <span className="text-brand-yellow font-semibold">{preparatorio.nome}</span></> : ''}, e {agendamentoConfirmado.vendedorGenero === 'masculino' ? 'o' : 'a'} {agendamentoConfirmado.vendedorGenero === 'masculino' ? 'próximo' : 'próxima'} será você! {'\u{1F3C6}'}
                  </p>
                </div>
              </div>

              {/* Próximos Passos - Sem destaque */}
              <div className="border-t border-white/10 pt-5">
                <h3 className="text-gray-500 font-medium text-xs uppercase mb-3">Próximos passos</h3>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>Você receberá uma mensagem no WhatsApp com os detalhes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>No dia agendado, {agendamentoConfirmado.vendedorGenero === 'masculino' ? 'o especialista' : 'a especialista'} entrará em contato</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>Após a reunião, você receberá seu planejamento personalizado</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Copyright© Ouse Passar {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Obrigado;
