import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Check, User, Clock, Target, Minus, Shield, Award, Book, Loader2, Search } from 'lucide-react';
import { leadsService, CreateLeadInput } from '../../services/adminUsersService';
import { LeadDifficulty, LeadGender, EducationLevel, Lead, Preparatorio } from '../../lib/database.types';

// Utilitário para máscara de telefone brasileiro
const formatPhoneBR = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);

  // Aplica a máscara
  if (limited.length <= 2) {
    return limited.length > 0 ? `(${limited}` : '';
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 11) {
    // Celular: (XX) XXXXX-XXXX
    if (limited.length > 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
    // Fixo: (XX) XXXX-XXXX
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  return value;
};

// Validação de telefone brasileiro
const isValidPhoneBR = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  // Deve ter 10 ou 11 dígitos
  return numbers.length === 10 || numbers.length === 11;
};
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { preparatoriosService, planejamentosService } from '../../services/preparatoriosService';
import { agendamentosService } from '../../services/schedulingService';
import { studentService, generateRandomPassword } from '../../services/studentService';

// Componente de Confetes
const Confetti: React.FC = () => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 150 }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 3;
                const duration = 3 + Math.random() * 2;
                const size = 8 + Math.random() * 8;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const rotation = Math.random() * 360;

                return (
                    <div
                        key={i}
                        className="absolute animate-confetti"
                        style={{
                            left: `${left}%`,
                            top: '-20px',
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: color,
                            transform: `rotate(${rotation}deg)`,
                            animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '0%'
                        }}
                    />
                );
            })}
            <style>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

// Componente de Loading com Etapas
interface LoadingStepsProps {
    firstName: string;
    onComplete: () => void;
}

const LoadingSteps: React.FC<LoadingStepsProps> = ({ firstName, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [stepProgresses, setStepProgresses] = useState<number[]>([0, 0, 0, 0, 0]);
    const [isComplete, setIsComplete] = useState(false);

    // Usar ref para evitar reinício do useEffect quando onComplete muda
    const onCompleteRef = React.useRef(onComplete);
    React.useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const steps = [
        `Analisando necessidades de ${firstName}`,
        'Adequando metodologia Ouse Passar',
        'Gerando planejamento personalizado',
        `Refinando as técnicas para o perfil de ${firstName}`,
        `Gerando a apresentação do planejamento de ${firstName}`
    ];

    useEffect(() => {
        // Gerar padrões aleatórios para cada etapa
        const generateRandomPattern = () => {
            const segments: { until: number; speed: number; pause?: number }[] = [];
            let currentPos = 0;

            while (currentPos < 100) {
                // Tamanho do segmento: entre 8% e 25%
                const segmentSize = 8 + Math.random() * 17;
                const until = Math.min(100, currentPos + segmentSize);

                // Decidir o tipo de segmento
                const rand = Math.random();

                if (rand < 0.08 && currentPos > 15 && currentPos < 85) {
                    // 8% chance de pausa (travamento) - entre 400ms e 1200ms
                    segments.push({
                        until: Math.min(100, currentPos + 3),
                        speed: 0,
                        pause: 400 + Math.random() * 800
                    });
                    currentPos += 3;
                } else if (rand < 0.25) {
                    // 17% chance de velocidade muito lenta (quase travando)
                    segments.push({ until, speed: 0.2 + Math.random() * 0.3 });
                    currentPos = until;
                } else if (rand < 0.45) {
                    // 20% chance de velocidade lenta
                    segments.push({ until, speed: 0.5 + Math.random() * 0.4 });
                    currentPos = until;
                } else if (rand < 0.75) {
                    // 30% chance de velocidade média
                    segments.push({ until, speed: 0.9 + Math.random() * 0.5 });
                    currentPos = until;
                } else {
                    // 25% chance de velocidade rápida
                    segments.push({ until, speed: 1.4 + Math.random() * 0.8 });
                    currentPos = until;
                }
            }

            return segments;
        };

        // Gerar padrões únicos para cada etapa
        const stepPatterns = steps.map(() => generateRandomPattern());

        // Durações base para cada etapa (3000ms a 5000ms)
        const stepDurations = steps.map(() => 3000 + Math.random() * 2000);

        // Array para armazenar o progresso de cada etapa
        const progressValues = [0, 0, 0, 0, 0];
        let currentStepIdx = 0;
        let isPaused = false;
        let pauseEndTime = 0;
        let lastPauseSegmentIdx = -1;

        const interval = setInterval(() => {
            const now = Date.now();

            // Se já completou, não fazer nada
            if (currentStepIdx >= steps.length) {
                return;
            }

            // Se está em pausa
            if (isPaused) {
                if (now >= pauseEndTime) {
                    isPaused = false;
                }
                return;
            }

            const pattern = stepPatterns[currentStepIdx];
            const stepDuration = stepDurations[currentStepIdx];
            const displayedProgress = progressValues[currentStepIdx];

            // Encontrar o segmento atual baseado no progresso exibido
            let segmentIdx = 0;
            for (let i = 0; i < pattern.length; i++) {
                if (displayedProgress < pattern[i].until) {
                    segmentIdx = i;
                    break;
                }
                segmentIdx = i;
            }

            const currentSegment = pattern[segmentIdx];

            // Verificar se deve pausar (apenas se mudou de segmento e é um segmento de pausa)
            if (currentSegment.speed === 0 && currentSegment.pause && segmentIdx !== lastPauseSegmentIdx) {
                isPaused = true;
                pauseEndTime = now + currentSegment.pause;
                lastPauseSegmentIdx = segmentIdx;
                return;
            }

            // Calcular incremento baseado na velocidade do segmento
            const baseIncrement = (50 / stepDuration) * 100; // incremento base por frame (50ms)
            const speedMultiplier = currentSegment.speed || 0.1;
            let increment = baseIncrement * speedMultiplier;

            // Micro-variações naturais (±30% da velocidade)
            const variation = 0.7 + Math.random() * 0.6;
            increment *= variation;

            // Micro-pausas ocasionais (5% de chance de pular frame quando lento)
            if (speedMultiplier < 0.8 && Math.random() < 0.05) {
                return;
            }

            // Micro-hesitações ocasionais (3% de chance de reduzir muito o incremento)
            if (Math.random() < 0.03) {
                increment *= 0.1;
            }

            // Atualizar progresso (NUNCA retrocede)
            const newProgress = Math.min(100, displayedProgress + increment);
            progressValues[currentStepIdx] = newProgress;

            // Atualizar estados React
            setCurrentStep(currentStepIdx);
            setStepProgresses([...progressValues]);

            // Verificar se a etapa atual terminou
            if (newProgress >= 100) {
                // Avançar para próxima etapa
                currentStepIdx++;
                lastPauseSegmentIdx = -1;

                // Se todas as etapas terminaram
                if (currentStepIdx >= steps.length) {
                    clearInterval(interval);
                    setIsComplete(true);
                    setTimeout(() => onCompleteRef.current(), 1000);
                }
            }
        }, 50);

        return () => clearInterval(interval);
    }, [firstName, steps.length]); // Removido onComplete - usando ref

    // Determinar o estado de cada barra
    const getStepState = (index: number) => {
        const progress = stepProgresses[index];
        if (isComplete || progress >= 100) {
            return 'completed';
        }
        if (index === currentStep) {
            return 'active';
        }
        if (index < currentStep) {
            return 'completed';
        }
        return 'pending';
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="max-w-lg w-full mx-4">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Target className="w-10 h-10 text-brand-yellow" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase mb-2">
                        Preparando seu planejamento
                    </h2>
                    <p className="text-gray-400">Aguarde enquanto personalizamos tudo para você</p>
                </div>

                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const state = getStepState(index);

                        return (
                            <div key={index} className="bg-brand-card border border-white/5 p-4 rounded-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold uppercase ${state !== 'pending' ? 'text-white' : 'text-gray-600'}`}>
                                        {step}
                                    </span>
                                    {state === 'completed' && (
                                        <Check className="w-5 h-5 text-green-400" />
                                    )}
                                </div>

                                {/* Barra ativa (em progresso) */}
                                {state === 'active' && (
                                    <div className="relative">
                                        <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-yellow transition-all duration-75 ease-linear"
                                                style={{ width: `${stepProgresses[index]}%` }}
                                            />
                                        </div>
                                        <span className="absolute right-0 top-3 text-xs text-gray-500">
                                            {Math.round(stepProgresses[index])}%
                                        </span>
                                    </div>
                                )}

                                {/* Barra completa */}
                                {state === 'completed' && (
                                    <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-full" />
                                    </div>
                                )}

                                {/* Barra pendente (ainda não começou) */}
                                {state === 'pending' && (
                                    <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-700 w-0" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Componente de Card de Sucesso
interface SuccessCardProps {
    lead: Lead;
    planejamentoId: string;
    slug: string;
    onClose: () => void;
}

const SuccessCard: React.FC<SuccessCardProps> = ({ lead, planejamentoId, slug, onClose }) => {
    const firstName = lead.nome.split(' ')[0];
    const totalMinutos = lead.minutos_domingo + lead.minutos_segunda + lead.minutos_terca +
        lead.minutos_quarta + lead.minutos_quinta + lead.minutos_sexta + lead.minutos_sabado;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-40 p-4">
            <div className="bg-brand-card border border-brand-yellow/30 max-w-md w-full rounded-sm p-8 text-center relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-400" />
                </div>

                <h2 className="text-2xl font-black text-white uppercase mb-2">
                    Planejamento Criado!
                </h2>
                <p className="text-gray-400 mb-6">
                    O planejamento personalizado para <span className="text-brand-yellow font-bold">{firstName}</span> foi gerado com sucesso.
                </p>

                <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-sm mb-6 text-left">
                    <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Resumo</h4>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm">
                            <User className="w-4 h-4 text-brand-yellow mr-2" />
                            <span className="text-gray-400">Nome:</span>
                            <span className="text-white ml-2">{lead.nome}</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Target className="w-4 h-4 text-brand-yellow mr-2" />
                            <span className="text-gray-400">Concurso:</span>
                            <span className="text-white ml-2">{lead.concurso_almejado}</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Clock className="w-4 h-4 text-brand-yellow mr-2" />
                            <span className="text-gray-400">Tempo/semana:</span>
                            <span className="text-white ml-2">
                                {Math.floor(totalMinutos / 60)}h {totalMinutos % 60}min
                            </span>
                        </div>
                    </div>
                </div>

                <a
                    href={`/planejador-semanal/${slug}/${planejamentoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors"
                >
                    Ver Planejamento
                </a>
            </div>
        </div>
    );
};

// Componente de Input de Minutos com Slider
interface MinutesInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
}

const MinutesInput: React.FC<MinutesInputProps> = ({ label, value, onChange }) => {
    const handleIncrement = () => {
        onChange(Math.min(480, value + 15)); // Max 8 horas
    };

    const handleDecrement = () => {
        onChange(Math.max(0, value - 15));
    };

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-brand-dark/50 border border-white/10 p-3 rounded-sm">
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2 text-center">{label}</label>

            <div className="flex items-center justify-center gap-2 mb-2">
                <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-8 h-8 bg-brand-dark border border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-yellow transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <div className="text-center min-w-[70px]">
                    <span className="text-white font-bold text-lg">{formatTime(value)}</span>
                </div>

                <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-8 h-8 bg-brand-dark border border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-yellow transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <input
                type="range"
                min="0"
                max="480"
                step="15"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-brand-yellow"
            />
        </div>
    );
};

// Popup de Busca de Usuários
interface UserSearchPopupProps {
    onSelect: (lead: Lead) => void;
    onClose: () => void;
}

const UserSearchPopup: React.FC<UserSearchPopupProps> = ({ onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (searchTerm.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const data = await leadsService.search(searchTerm);
                setResults(data);
            } catch (error) {
                console.error('Erro ao buscar:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div
                className="bg-brand-card border border-white/10 w-full max-w-md rounded-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-white uppercase">Buscar Usuário Existente</h4>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Digite nome, email ou telefone..."
                            className="w-full bg-brand-dark border border-white/10 pl-10 pr-4 py-2.5 text-white text-sm focus:border-brand-yellow outline-none transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center">
                            <Loader2 className="w-5 h-5 animate-spin text-brand-yellow mx-auto" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            {searchTerm.length < 2
                                ? 'Digite ao menos 2 caracteres para buscar'
                                : 'Nenhum usuário encontrado'}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {results.map((lead) => (
                                <button
                                    key={lead.id}
                                    onClick={() => onSelect(lead)}
                                    className="w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-brand-yellow" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{lead.nome}</p>
                                        <p className="text-gray-500 text-xs truncate">
                                            {lead.email || lead.telefone || 'Sem contato'}
                                        </p>
                                    </div>
                                    {lead.concurso_almejado && (
                                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded flex-shrink-0">
                                            {lead.concurso_almejado.length > 15
                                                ? lead.concurso_almejado.slice(0, 15) + '...'
                                                : lead.concurso_almejado}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 text-center">
                    <p className="text-gray-600 text-xs">
                        Selecione um usuário para preencher automaticamente os dados
                    </p>
                </div>
            </div>
        </div>
    );
};

// Formulário de Geração de Planejamento Personalizado
interface LeadFormProps {
    onClose: () => void;
    onSuccess: (lead: Lead, planejamentoId: string, preparatorioSlug: string) => void;
    vendedorId: string;
    concursoDefault?: string;
    preparatorioId?: string;
    preparatorioSlug?: string;
    existingLead?: Lead | null; // Lead existente para edição (vindo de agendamento)
}

const LeadForm: React.FC<LeadFormProps> = ({ onClose, onSuccess, vendedorId, concursoDefault, preparatorioId, preparatorioSlug, existingLead }) => {
    const [loading, setLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [createdLead, setCreatedLead] = useState<Lead | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    // Handler para selecionar usuário da busca
    const handleUserSelect = (lead: Lead) => {
        setFormData({
            nome: lead.nome,
            sexo: lead.sexo || undefined,
            email: lead.email || '',
            telefone: lead.telefone ? formatPhoneBR(lead.telefone) : '',
            concurso_almejado: concursoDefault || lead.concurso_almejado || 'PRF - Policia Rodoviaria Federal',
            nivel_escolaridade: lead.nivel_escolaridade || undefined,
            trabalha: lead.trabalha || false,
            e_concursado: lead.e_concursado || false,
            possui_curso_concurso: lead.possui_curso_concurso || false,
            qual_curso: lead.qual_curso || '',
            minutos_domingo: lead.minutos_domingo || 0,
            minutos_segunda: lead.minutos_segunda || 0,
            minutos_terca: lead.minutos_terca || 0,
            minutos_quarta: lead.minutos_quarta || 0,
            minutos_quinta: lead.minutos_quinta || 0,
            minutos_sexta: lead.minutos_sexta || 0,
            minutos_sabado: lead.minutos_sabado || 0,
            hora_acordar: lead.hora_acordar || '06:00',
            hora_dormir: lead.hora_dormir || '22:00',
            principais_dificuldades: lead.principais_dificuldades || [],
            dificuldade_outros: lead.dificuldade_outros || '',
            vendedor_id: vendedorId
        });
        setShowUserSearch(false);
        setPhoneError(null);
    };

    // Handler para mudança de telefone com máscara
    const handlePhoneChange = (value: string) => {
        const formatted = formatPhoneBR(value);
        setFormData({ ...formData, telefone: formatted });

        // Validação
        if (formatted && !isValidPhoneBR(formatted)) {
            setPhoneError('Formato inválido');
        } else {
            setPhoneError(null);
        }
    };

    // Se tiver lead existente (vindo de agendamento), preencher com os dados dele
    const [formData, setFormData] = useState<CreateLeadInput>({
        nome: existingLead?.nome || '',
        sexo: existingLead?.sexo || undefined,
        email: existingLead?.email || '',
        telefone: existingLead?.telefone || '',
        concurso_almejado: existingLead?.concurso_almejado || concursoDefault || 'PRF - Policia Rodoviaria Federal',
        nivel_escolaridade: existingLead?.nivel_escolaridade || undefined,
        trabalha: existingLead?.trabalha || false,
        e_concursado: existingLead?.e_concursado || false,
        possui_curso_concurso: existingLead?.possui_curso_concurso || false,
        qual_curso: existingLead?.qual_curso || '',
        minutos_domingo: existingLead?.minutos_domingo || 0,
        minutos_segunda: existingLead?.minutos_segunda || 0,
        minutos_terca: existingLead?.minutos_terca || 0,
        minutos_quarta: existingLead?.minutos_quarta || 0,
        minutos_quinta: existingLead?.minutos_quinta || 0,
        minutos_sexta: existingLead?.minutos_sexta || 0,
        minutos_sabado: existingLead?.minutos_sabado || 0,
        hora_acordar: existingLead?.hora_acordar || '06:00',
        hora_dormir: existingLead?.hora_dormir || '22:00',
        principais_dificuldades: existingLead?.principais_dificuldades || [],
        dificuldade_outros: existingLead?.dificuldade_outros || '',
        vendedor_id: existingLead?.vendedor_id || vendedorId
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let lead: Lead;

            if (existingLead) {
                // Atualizar lead existente (vindo de agendamento)
                lead = await leadsService.update(existingLead.id, {
                    ...formData,
                    status: 'apresentacao' // Mudar status de agendado para apresentacao
                });

                // Se tiver agendamento vinculado, atualizar status para 'realizado'
                if (existingLead.agendamento_id) {
                    await agendamentosService.updateStatus(existingLead.agendamento_id, 'realizado');
                }
            } else {
                // Criar novo lead
                lead = await leadsService.create(formData);
            }

            setCreatedLead(lead);
            setShowLoading(true);
        } catch (error) {
            console.error('Erro ao criar/atualizar lead:', error);
            alert('Erro ao processar lead');
            setLoading(false);
        }
    };

    const handleLoadingComplete = useCallback(async () => {
        if (!createdLead) return;

        try {
            let planejamentoId: string;
            let slug = preparatorioSlug || 'prf';

            // Se temos um preparatório dinâmico, usar a nova tabela
            if (preparatorioId) {
                const planejamento = await planejamentosService.create({
                    preparatorio_id: preparatorioId,
                    nome_aluno: createdLead.nome,
                    email: createdLead.email,
                    lead_id: createdLead.id,
                    hora_acordar: createdLead.hora_acordar || '06:00',
                    hora_dormir: createdLead.hora_dormir || '22:00'
                });
                planejamentoId = planejamento.id;
            } else {
                // Fallback para tabela antiga (planejamentos_prf) para compatibilidade
                const { data: planejamento, error } = await supabase
                    .from('planejamentos_prf')
                    .insert({
                        nome_aluno: createdLead.nome,
                        email: createdLead.email,
                        concurso: createdLead.concurso_almejado,
                        mensagem_incentivo: `${createdLead.nome.split(' ')[0]}, sua jornada começa agora!`
                    })
                    .select()
                    .single();

                if (error) throw error;
                planejamentoId = planejamento.id;
            }

            await leadsService.linkPlanejamento(createdLead.id, planejamentoId);

            // Criar usuário para o aluno (se tiver email)
            if (createdLead.email) {
                try {
                    // Verificar se já existe um usuário com este email
                    const emailExists = await studentService.checkEmailExists(createdLead.email);

                    if (!emailExists) {
                        // Gerar senha aleatória
                        const password = generateRandomPassword();

                        // Criar usuário
                        const studentUser = await studentService.createStudent({
                            email: createdLead.email,
                            name: createdLead.nome,
                            password: password
                        });

                        // Linkar usuário ao lead e salvar senha temporária
                        await studentService.linkUserToLead(createdLead.id, studentUser.id, password);
                    }
                } catch (userError) {
                    console.error('Erro ao criar usuário do aluno:', userError);
                    // Não interrompe o fluxo se der erro na criação do usuário
                }
            }

            onSuccess(createdLead, planejamentoId, slug);
        } catch (error) {
            console.error('Erro ao criar planejamento:', error);
            alert('Erro ao criar planejamento');
        } finally {
            setShowLoading(false);
            setLoading(false);
        }
    }, [createdLead, onSuccess, preparatorioId, preparatorioSlug]);

    const handleDifficultyToggle = (difficulty: LeadDifficulty) => {
        const current = formData.principais_dificuldades || [];
        if (current.includes(difficulty)) {
            setFormData({
                ...formData,
                principais_dificuldades: current.filter(d => d !== difficulty)
            });
        } else {
            setFormData({
                ...formData,
                principais_dificuldades: [...current, difficulty]
            });
        }
    };

    const handleNextStep = () => {
        if (!formData.nome || !formData.concurso_almejado || !formData.email || !formData.telefone) {
            alert('Preencha os campos obrigatórios: Nome, Email, WhatsApp e Concurso Almejado');
            return;
        }
        setCurrentStep(2);
    };

    const difficultyOptions: { value: LeadDifficulty; label: string }[] = [
        { value: 'tempo', label: 'Tempo' },
        { value: 'nao_saber_por_onde_comecar', label: 'Não saber por onde começar' },
        { value: 'organizacao', label: 'Organização' },
        { value: 'falta_de_material', label: 'Falta de material' },
        { value: 'outros', label: 'Outros' }
    ];

    const genderOptions: { value: LeadGender; label: string }[] = [
        { value: 'masculino', label: 'Masculino' },
        { value: 'feminino', label: 'Feminino' },
        { value: 'outro', label: 'Outro' },
        { value: 'prefiro_nao_dizer', label: 'Prefiro não dizer' }
    ];

    const educationOptions: { value: EducationLevel; label: string }[] = [
        { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
        { value: 'fundamental_completo', label: 'Fundamental Completo' },
        { value: 'medio_incompleto', label: 'Médio Incompleto' },
        { value: 'medio_completo', label: 'Médio Completo' },
        { value: 'superior_incompleto', label: 'Superior Incompleto' },
        { value: 'superior_completo', label: 'Superior Completo' },
        { value: 'pos_graduacao', label: 'Pós-graduação' },
        { value: 'mestrado', label: 'Mestrado' },
        { value: 'doutorado', label: 'Doutorado' }
    ];

    const weekDays = [
        { key: 'minutos_segunda' as const, label: 'Segunda' },
        { key: 'minutos_terca' as const, label: 'Terça' },
        { key: 'minutos_quarta' as const, label: 'Quarta' },
        { key: 'minutos_quinta' as const, label: 'Quinta' },
        { key: 'minutos_sexta' as const, label: 'Sexta' },
        { key: 'minutos_sabado' as const, label: 'Sábado' },
        { key: 'minutos_domingo' as const, label: 'Domingo' }
    ];

    const totalMinutos = (formData.minutos_domingo || 0) + (formData.minutos_segunda || 0) +
        (formData.minutos_terca || 0) + (formData.minutos_quarta || 0) +
        (formData.minutos_quinta || 0) + (formData.minutos_sexta || 0) +
        (formData.minutos_sabado || 0);

    if (showLoading && createdLead) {
        return (
            <LoadingSteps
                firstName={createdLead.nome.split(' ')[0]}
                onComplete={handleLoadingComplete}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-card border border-white/10 w-full max-w-3xl rounded-sm flex flex-col max-h-[90vh]">
                {/* Header fixo */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase">
                            {existingLead ? 'Continuar Planejamento' : 'Geração de Planejamento Personalizado'}
                        </h3>
                        {existingLead ? (
                            <p className="text-purple-400 text-xs mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {existingLead.nome} - Etapa {currentStep} de 2
                            </p>
                        ) : (
                            <p className="text-gray-500 text-xs mt-1">Etapa {currentStep} de 2</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Indicador de etapas */}
                <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-brand-yellow text-brand-darker' : 'bg-white/10 text-gray-500'
                                }`}>
                                1
                            </div>
                            <span className={`text-sm font-bold uppercase ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>
                                Dados Básicos
                            </span>
                        </div>
                        <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-brand-yellow' : 'bg-white/10'}`} />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-brand-yellow text-brand-darker' : 'bg-white/10 text-gray-500'
                                }`}>
                                2
                            </div>
                            <span className={`text-sm font-bold uppercase ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>
                                Rotina e Dificuldades
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conteúdo com scroll */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ETAPA 1 */}
                        {currentStep === 1 && (
                            <>
                                {/* Informações Pessoais */}
                                <div>
                                    <h4 className="text-brand-yellow text-xs font-bold uppercase mb-4 border-b border-white/10 pb-2">
                                        Informações Pessoais
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                    className="flex-1 bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUserSearch(true)}
                                                    className="px-3 bg-brand-dark border border-white/10 text-gray-400 hover:text-brand-yellow hover:border-brand-yellow transition-colors flex items-center gap-1.5"
                                                    title="Buscar usuário existente"
                                                >
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Sexo</label>
                                            <select
                                                value={formData.sexo || ''}
                                                onChange={(e) => setFormData({ ...formData, sexo: e.target.value as LeadGender || undefined })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            >
                                                <option value="">Selecione...</option>
                                                {genderOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Email *</label>
                                            <input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@exemplo.com"
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors placeholder:text-gray-600"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">WhatsApp *</label>
                                            <input
                                                type="tel"
                                                value={formData.telefone || ''}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                placeholder="(00) 00000-0000"
                                                className={`w-full bg-brand-dark border p-3 text-white focus:border-brand-yellow outline-none transition-colors placeholder:text-gray-600 ${
                                                    phoneError ? 'border-red-500' : 'border-white/10'
                                                }`}
                                                required
                                            />
                                            {phoneError && (
                                                <p className="text-red-400 text-xs mt-1">{phoneError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Concurso */}
                                <div>
                                    <h4 className="text-brand-yellow text-xs font-bold uppercase mb-4 border-b border-white/10 pb-2">
                                        Sobre o Concurso
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Concurso Almejado *</label>
                                            <input
                                                type="text"
                                                value={formData.concurso_almejado}
                                                onChange={(e) => setFormData({ ...formData, concurso_almejado: e.target.value })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nível de Escolaridade</label>
                                            <select
                                                value={formData.nivel_escolaridade || ''}
                                                onChange={(e) => setFormData({ ...formData, nivel_escolaridade: e.target.value as EducationLevel || undefined })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            >
                                                <option value="">Selecione...</option>
                                                {educationOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Situação Atual */}
                                <div>
                                    <h4 className="text-brand-yellow text-xs font-bold uppercase mb-4 border-b border-white/10 pb-2">
                                        Situação Atual
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.trabalha}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        trabalha: e.target.checked,
                                                        e_concursado: e.target.checked ? formData.e_concursado : false
                                                    })}
                                                    className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                                                />
                                                <span className="text-white text-sm">Trabalha atualmente</span>
                                            </label>

                                            {formData.trabalha && (
                                                <label className="flex items-center gap-2 cursor-pointer ml-7">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.e_concursado}
                                                        onChange={(e) => setFormData({ ...formData, e_concursado: e.target.checked })}
                                                        className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                                                    />
                                                    <span className="text-white text-sm">É concursado?</span>
                                                </label>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.possui_curso_concurso}
                                                    onChange={(e) => setFormData({ ...formData, possui_curso_concurso: e.target.checked })}
                                                    className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                                                />
                                                <span className="text-white text-sm">Já possui algum curso para o concurso almejado</span>
                                            </label>

                                            {formData.possui_curso_concurso && (
                                                <div className="ml-7">
                                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Qual curso?</label>
                                                    <input
                                                        type="text"
                                                        value={formData.qual_curso || ''}
                                                        onChange={(e) => setFormData({ ...formData, qual_curso: e.target.value })}
                                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                        placeholder="Nome do curso..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ETAPA 2 */}
                        {currentStep === 2 && (
                            <>
                                {/* Horários de Sono */}
                                <div>
                                    <h4 className="text-brand-yellow text-xs font-bold uppercase mb-4 border-b border-white/10 pb-2">
                                        Horários do Dia
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                                Hora de Acordar
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.hora_acordar || '06:00'}
                                                onChange={(e) => setFormData({ ...formData, hora_acordar: e.target.value })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors text-lg font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                                Hora de Dormir
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.hora_dormir || '22:00'}
                                                onChange={(e) => setFormData({ ...formData, hora_dormir: e.target.value })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors text-lg font-mono"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Esses horários serão usados para gerar o planejador semanal do aluno.
                                    </p>
                                </div>

                                {/* Dificuldades */}
                                <div>
                                    <h4 className="text-brand-yellow text-xs font-bold uppercase mb-4 border-b border-white/10 pb-2">
                                        Principais Dificuldades Hoje
                                    </h4>
                                    <p className="text-gray-500 text-xs mb-3">Selecione todas as que se aplicam</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {difficultyOptions.map(opt => (
                                            <label
                                                key={opt.value}
                                                className={`flex items-center gap-2 cursor-pointer p-3 rounded-sm border transition-colors ${formData.principais_dificuldades?.includes(opt.value)
                                                        ? 'bg-brand-yellow/10 border-brand-yellow/50'
                                                        : 'bg-brand-dark/50 border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.principais_dificuldades?.includes(opt.value) || false}
                                                    onChange={() => handleDifficultyToggle(opt.value)}
                                                    className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                                                />
                                                <span className="text-white text-sm">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {formData.principais_dificuldades?.includes('outros') && (
                                        <div className="mt-3">
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Descreva outras dificuldades</label>
                                            <input
                                                type="text"
                                                value={formData.dificuldade_outros || ''}
                                                onChange={(e) => setFormData({ ...formData, dificuldade_outros: e.target.value })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                placeholder="Descreva sua dificuldade..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </form>
                </div>

                {/* Footer fixo com botões */}
                <div className="p-6 border-t border-white/10 flex justify-between flex-shrink-0">
                    {currentStep === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-gray-400 font-bold uppercase text-xs hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors flex items-center gap-2"
                            >
                                Próximo
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-3 text-gray-400 font-bold uppercase text-xs hover:text-white transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Processando...' : 'Gerar Planejamento'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Popup de Busca de Usuários */}
            {showUserSearch && (
                <UserSearchPopup
                    onSelect={handleUserSelect}
                    onClose={() => setShowUserSearch(false)}
                />
            )}
        </div>
    );
};

// Tipos de planejamentos disponíveis
interface PlanejamentoType {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    concurso: string;
    available: boolean;
    cor: string;
}

// Helper para escolher ícone baseado no nome
const getIconForPreparatorio = (nome: string): React.ReactNode => {
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes('prf') || nomeLower.includes('policia') || nomeLower.includes('federal')) {
        return <Shield className="w-8 h-8" />;
    }
    if (nomeLower.includes('cfo') || nomeLower.includes('oficiais') || nomeLower.includes('militar')) {
        return <Award className="w-8 h-8" />;
    }
    return <Book className="w-8 h-8" />;
};

// Página Principal de Planejamentos
export const Planejamentos: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showForm, setShowForm] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [successData, setSuccessData] = useState<{ lead: Lead; planejamentoId: string; slug: string } | null>(null);
    const [selectedPlanejamento, setSelectedPlanejamento] = useState<PlanejamentoType | null>(null);
    const [planejamentos, setPlanejamentos] = useState<PlanejamentoType[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para lead existente (vindo de agendamento)
    const [existingLead, setExistingLead] = useState<Lead | null>(null);
    const [loadingLead, setLoadingLead] = useState(false);

    // Carregar preparatórios do banco de dados
    useEffect(() => {
        const loadPreparatorios = async () => {
            try {
                setLoading(true);
                const data = await preparatoriosService.getAll(false); // Apenas ativos

                const mapped: PlanejamentoType[] = data.map((prep: Preparatorio) => ({
                    id: prep.id,
                    slug: prep.slug,
                    title: prep.slug.toUpperCase(),
                    subtitle: prep.nome,
                    description: prep.descricao || `Planejamento completo e personalizado para aprovação no concurso. Metodologia exclusiva Ouse Passar com foco em resultados.`,
                    icon: getIconForPreparatorio(prep.nome),
                    features: [
                        'Cronograma personalizado',
                        'Metodologia Ouse Passar',
                        'Análise do perfil do aluno',
                        'Distribuição otimizada de matérias',
                        'Foco nas disciplinas mais cobradas'
                    ],
                    concurso: prep.nome,
                    available: prep.is_active,
                    cor: prep.cor
                }));

                setPlanejamentos(mapped);
                return mapped;
            } catch (error) {
                console.error('Erro ao carregar preparatorios:', error);
                return [];
            } finally {
                setLoading(false);
            }
        };

        loadPreparatorios().then((mapped) => {
            // Verificar se tem lead_id na URL (vindo de agendamento)
            const leadId = searchParams.get('lead_id');
            if (leadId && mapped.length > 0) {
                loadExistingLead(leadId, mapped);
            }
        });
    }, []);

    // Carregar lead existente (vindo de agendamento)
    const loadExistingLead = async (leadId: string, availablePlanejamentos: PlanejamentoType[]) => {
        try {
            setLoadingLead(true);

            // Buscar o lead
            const { data: lead, error: leadError } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (leadError || !lead) {
                console.error('Lead não encontrado:', leadError);
                alert('Lead não encontrado');
                // Limpar parâmetro da URL
                searchParams.delete('lead_id');
                setSearchParams(searchParams);
                return;
            }

            setExistingLead(lead);

            // Se o lead tem agendamento, buscar o preparatorio associado
            let preparatorioId: string | null = null;
            if (lead.agendamento_id) {
                const agendamento = await agendamentosService.getById(lead.agendamento_id);
                if (agendamento?.preparatorio_id) {
                    preparatorioId = agendamento.preparatorio_id;
                }
            }

            // Selecionar o preparatório correto
            let selectedPrep: PlanejamentoType | undefined;
            if (preparatorioId) {
                selectedPrep = availablePlanejamentos.find(p => p.id === preparatorioId);
            }

            // Se não encontrou pelo agendamento, usar o primeiro disponível
            if (!selectedPrep) {
                selectedPrep = availablePlanejamentos.find(p => p.available);
            }

            if (selectedPrep) {
                setSelectedPlanejamento(selectedPrep);
                setShowForm(true);
            } else {
                alert('Nenhum preparatório disponível');
            }

        } catch (error) {
            console.error('Erro ao carregar lead:', error);
            alert('Erro ao carregar dados do lead');
        } finally {
            setLoadingLead(false);
        }
    };

    const handleCardClick = (planejamento: PlanejamentoType) => {
        if (!planejamento.available) return;
        setSelectedPlanejamento(planejamento);
        setShowForm(true);
    };

    const handleSuccess = (lead: Lead, planejamentoId: string, slug: string) => {
        setShowForm(false);
        setSelectedPlanejamento(null);
        setExistingLead(null);
        setShowConfetti(true);
        setSuccessData({ lead, planejamentoId, slug });
        setTimeout(() => setShowConfetti(false), 5000);

        // Limpar lead_id da URL
        searchParams.delete('lead_id');
        setSearchParams(searchParams);
    };

    const handleCloseSuccess = () => {
        setSuccessData(null);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedPlanejamento(null);
        setExistingLead(null);

        // Limpar lead_id da URL
        searchParams.delete('lead_id');
        setSearchParams(searchParams);
    };

    if (loading || loadingLead) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow mx-auto mb-4"></div>
                    {loadingLead && (
                        <p className="text-gray-400 text-sm">Carregando dados do lead...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            {showConfetti && <Confetti />}
            {successData && (
                <SuccessCard
                    lead={successData.lead}
                    planejamentoId={successData.planejamentoId}
                    slug={successData.slug}
                    onClose={handleCloseSuccess}
                />
            )}

            <div className="mb-8">
                <h2 className="text-3xl font-black text-white font-display uppercase">Gerar Planejamento</h2>
                <p className="text-gray-500 mt-1">Selecione um planejamento para gerar para seu aluno</p>
            </div>

            {planejamentos.length === 0 ? (
                <div className="bg-brand-card border border-white/10 p-12 text-center">
                    <Book className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum preparatório disponível</h3>
                    <p className="text-gray-500 mb-6">Crie um preparatório na seção de gerenciamento para poder gerar planejamentos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planejamentos.map((planejamento) => (
                        <div
                            key={planejamento.id}
                            onClick={() => handleCardClick(planejamento)}
                            className={`bg-brand-card border rounded-sm overflow-hidden transition-all duration-300 ${planejamento.available
                                    ? 'border-white/10 hover:border-brand-yellow/50 cursor-pointer hover:transform hover:scale-[1.02]'
                                    : 'border-white/5 opacity-60 cursor-not-allowed'
                                }`}
                        >
                            {/* Header do Card */}
                            <div className={`p-6 ${planejamento.available ? 'bg-brand-yellow/10' : 'bg-white/5'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${planejamento.available ? 'bg-brand-yellow/20 text-brand-yellow' : 'bg-white/10 text-gray-500'
                                        }`}>
                                        {planejamento.icon}
                                    </div>
                                    {planejamento.available ? (
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase rounded border border-green-500/30">
                                            Disponível
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-white/10 text-gray-500 text-xs font-bold uppercase rounded border border-white/10">
                                            Em breve
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase">{planejamento.title}</h3>
                                <p className={`text-sm font-medium ${planejamento.available ? 'text-brand-yellow' : 'text-gray-500'}`}>
                                    {planejamento.subtitle}
                                </p>
                            </div>

                            {/* Body do Card */}
                            <div className="p-6">
                                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                    {planejamento.description}
                                </p>

                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Inclui:</p>
                                    {planejamento.features.map((feature, index) => (
                                        <div key={index} className="flex items-center text-sm">
                                            <Check className={`w-4 h-4 mr-2 flex-shrink-0 ${planejamento.available ? 'text-green-400' : 'text-gray-600'
                                                }`} />
                                            <span className={planejamento.available ? 'text-gray-300' : 'text-gray-600'}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer do Card */}
                            <div className={`p-4 border-t ${planejamento.available ? 'border-white/10' : 'border-white/5'}`}>
                                <button
                                    disabled={!planejamento.available}
                                    className={`w-full py-3 font-bold uppercase text-sm transition-colors flex items-center justify-center gap-2 ${planejamento.available
                                            ? 'bg-brand-yellow text-brand-darker hover:bg-brand-yellow/90'
                                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    {planejamento.available ? (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Gerar Planejamento
                                        </>
                                    ) : (
                                        'Em breve'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && user?.id && selectedPlanejamento && (
                <LeadForm
                    onClose={handleCloseForm}
                    onSuccess={handleSuccess}
                    vendedorId={existingLead?.vendedor_id || user.id}
                    concursoDefault={selectedPlanejamento.concurso}
                    preparatorioId={selectedPlanejamento.id}
                    preparatorioSlug={selectedPlanejamento.slug}
                    existingLead={existingLead}
                />
            )}
        </div>
    );
};
