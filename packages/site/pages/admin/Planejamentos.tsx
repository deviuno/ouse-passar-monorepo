import React, { useEffect, useState, useCallback } from 'react';
import { Plus, X, Check, User, Clock, Target, Minus, Shield, Award, Book } from 'lucide-react';
import { leadsService, CreateLeadInput } from '../../services/adminUsersService';
import { LeadDifficulty, LeadGender, EducationLevel, Lead, Preparatorio } from '../../lib/database.types';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { preparatoriosService, planejamentosService } from '../../services/preparatoriosService';

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
    const [progress, setProgress] = useState(0);

    const steps = [
        `Analisando necessidades de ${firstName}`,
        'Adequando metodologia Ouse Passar',
        'Gerando planejamento personalizado',
        `Refinando as técnicas para o perfil de ${firstName}`,
        `Gerando a apresentação do planejamento de ${firstName}`
    ];

    useEffect(() => {
        // Gerar durações aleatórias para cada etapa (2000ms a 5000ms)
        const stepDurations = steps.map(() => 2000 + Math.random() * 3000);
        const totalDuration = stepDurations.reduce((acc, d) => acc + d, 0);

        let elapsed = 0;
        let currentStepStartTime = 0;
        let stepIndex = 0;

        // Pontos de travamento aleatórios para cada etapa
        const stallPoints = steps.map(() => ({
            position: 20 + Math.random() * 50, // Trava entre 20% e 70%
            duration: 500 + Math.random() * 1500, // Trava por 500ms a 2000ms
            triggered: false
        }));

        // Segundo travamento para algumas etapas
        const secondStallPoints = steps.map(() => ({
            position: 75 + Math.random() * 15, // Trava entre 75% e 90%
            duration: 300 + Math.random() * 800,
            triggered: false,
            active: Math.random() > 0.4 // 60% de chance de ter segundo travamento
        }));

        let isStalling = false;
        let stallEndTime = 0;
        let displayProgress = 0;

        const interval = setInterval(() => {
            const now = Date.now();

            // Se está em travamento, não avança o progresso
            if (isStalling) {
                if (now >= stallEndTime) {
                    isStalling = false;
                } else {
                    // Pequenas oscilações durante o travamento
                    const oscillation = Math.sin(now / 100) * 0.5;
                    setProgress(Math.max(0, Math.min(100, displayProgress + oscillation)));
                    return;
                }
            }

            elapsed += 50;

            // Calcular em qual etapa estamos
            let accumulatedTime = 0;
            for (let i = 0; i < steps.length; i++) {
                if (elapsed <= accumulatedTime + stepDurations[i]) {
                    stepIndex = i;
                    currentStepStartTime = accumulatedTime;
                    break;
                }
                accumulatedTime += stepDurations[i];
            }

            // Calcular progresso da etapa atual
            const stepElapsed = elapsed - currentStepStartTime;
            const currentStepDuration = stepDurations[stepIndex];
            let rawProgress = (stepElapsed / currentStepDuration) * 100;

            // Verificar se deve travar (primeiro travamento)
            const stall = stallPoints[stepIndex];
            if (!stall.triggered && rawProgress >= stall.position && rawProgress < stall.position + 10) {
                stall.triggered = true;
                isStalling = true;
                stallEndTime = now + stall.duration;
                displayProgress = stall.position;
                setProgress(displayProgress);
                return;
            }

            // Verificar segundo travamento
            const secondStall = secondStallPoints[stepIndex];
            if (secondStall.active && !secondStall.triggered && rawProgress >= secondStall.position && rawProgress < secondStall.position + 10) {
                secondStall.triggered = true;
                isStalling = true;
                stallEndTime = now + secondStall.duration;
                displayProgress = secondStall.position;
                setProgress(displayProgress);
                return;
            }

            // Adicionar variação orgânica ao progresso
            const wobble = Math.sin(elapsed / 300) * 2;
            const microPause = Math.random() < 0.05 ? -1 : 0; // 5% de chance de micro pausa
            displayProgress = Math.min(100, Math.max(0, rawProgress + wobble + microPause));

            setCurrentStep(stepIndex);
            setProgress(stepIndex === steps.length - 1 && elapsed >= totalDuration ? 100 : displayProgress);

            if (elapsed >= totalDuration) {
                clearInterval(interval);
                setProgress(100);
                setTimeout(onComplete, 800);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [firstName, onComplete, steps.length]);

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
                    {steps.map((step, index) => (
                        <div key={index} className="bg-brand-card border border-white/5 p-4 rounded-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold uppercase ${index <= currentStep ? 'text-white' : 'text-gray-600'}`}>
                                    {step}
                                </span>
                                {index < currentStep && (
                                    <Check className="w-5 h-5 text-green-400" />
                                )}
                            </div>
                            {index === currentStep && (
                                <div className="relative">
                                    <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-yellow transition-all duration-100 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="absolute right-0 top-3 text-xs text-gray-500">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                            )}
                            {index < currentStep && (
                                <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-full" />
                                </div>
                            )}
                        </div>
                    ))}
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
                    href={`/planejamento/${slug}/${planejamentoId}`}
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
        if (h === 0) return `${m}min`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}min`;
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

// Formulário de Geração de Planejamento Personalizado
interface LeadFormProps {
    onClose: () => void;
    onSuccess: (lead: Lead, planejamentoId: string, preparatorioSlug: string) => void;
    vendedorId: string;
    concursoDefault?: string;
    preparatorioId?: string;
    preparatorioSlug?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ onClose, onSuccess, vendedorId, concursoDefault, preparatorioId, preparatorioSlug }) => {
    const [loading, setLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [createdLead, setCreatedLead] = useState<Lead | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState<CreateLeadInput>({
        nome: '',
        sexo: undefined,
        email: '',
        telefone: '',
        concurso_almejado: concursoDefault || 'PRF - Policia Rodoviaria Federal',
        nivel_escolaridade: undefined,
        trabalha: false,
        e_concursado: false,
        possui_curso_concurso: false,
        qual_curso: '',
        minutos_domingo: 0,
        minutos_segunda: 0,
        minutos_terca: 0,
        minutos_quarta: 0,
        minutos_quinta: 0,
        minutos_sexta: 0,
        minutos_sabado: 0,
        principais_dificuldades: [],
        dificuldade_outros: '',
        vendedor_id: vendedorId
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const lead = await leadsService.create(formData);
            setCreatedLead(lead);
            setShowLoading(true);
        } catch (error) {
            console.error('Erro ao criar lead:', error);
            alert('Erro ao criar lead');
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
                    email: createdLead.email
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
        if (!formData.nome || !formData.concurso_almejado) {
            alert('Preencha os campos obrigatórios: Nome e Concurso Almejado');
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
                            Geração de Planejamento Personalizado
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">Etapa {currentStep} de 2</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Indicador de etapas */}
                <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                currentStep >= 1 ? 'bg-brand-yellow text-brand-darker' : 'bg-white/10 text-gray-500'
                            }`}>
                                1
                            </div>
                            <span className={`text-sm font-bold uppercase ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>
                                Dados Básicos
                            </span>
                        </div>
                        <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-brand-yellow' : 'bg-white/10'}`} />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                currentStep >= 2 ? 'bg-brand-yellow text-brand-darker' : 'bg-white/10 text-gray-500'
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
                                            <input
                                                type="text"
                                                value={formData.nome}
                                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                required
                                            />
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
                                {/* Rotina de Estudos */}
                                <div>
                                    <h4 className="text-brand-yellow text-xs font-bold uppercase mb-4 border-b border-white/10 pb-2">
                                        Rotina de Estudos (tempo disponível por dia)
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {weekDays.map(day => (
                                            <MinutesInput
                                                key={day.key}
                                                label={day.label}
                                                value={formData[day.key] || 0}
                                                onChange={(value) => setFormData({ ...formData, [day.key]: value })}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-4 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-sm">
                                        <p className="text-brand-yellow text-sm font-bold text-center">
                                            Total semanal: {Math.floor(totalMinutos / 60)}h {totalMinutos % 60}min
                                        </p>
                                    </div>
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
                                                className={`flex items-center gap-2 cursor-pointer p-3 rounded-sm border transition-colors ${
                                                    formData.principais_dificuldades?.includes(opt.value)
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
    const [showForm, setShowForm] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [successData, setSuccessData] = useState<{ lead: Lead; planejamentoId: string; slug: string } | null>(null);
    const [selectedPlanejamento, setSelectedPlanejamento] = useState<PlanejamentoType | null>(null);
    const [planejamentos, setPlanejamentos] = useState<PlanejamentoType[]>([]);
    const [loading, setLoading] = useState(true);

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
            } catch (error) {
                console.error('Erro ao carregar preparatorios:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreparatorios();
    }, []);

    const handleCardClick = (planejamento: PlanejamentoType) => {
        if (!planejamento.available) return;
        setSelectedPlanejamento(planejamento);
        setShowForm(true);
    };

    const handleSuccess = (lead: Lead, planejamentoId: string, slug: string) => {
        setShowForm(false);
        setSelectedPlanejamento(null);
        setShowConfetti(true);
        setSuccessData({ lead, planejamentoId, slug });
        setTimeout(() => setShowConfetti(false), 5000);
    };

    const handleCloseSuccess = () => {
        setSuccessData(null);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedPlanejamento(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-yellow"></div>
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
                <h2 className="text-3xl font-black text-white font-display uppercase">Planejamentos</h2>
                <p className="text-gray-500 mt-1">Selecione um planejamento para gerar para seu lead</p>
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
                        className={`bg-brand-card border rounded-sm overflow-hidden transition-all duration-300 ${
                            planejamento.available
                                ? 'border-white/10 hover:border-brand-yellow/50 cursor-pointer hover:transform hover:scale-[1.02]'
                                : 'border-white/5 opacity-60 cursor-not-allowed'
                        }`}
                    >
                        {/* Header do Card */}
                        <div className={`p-6 ${planejamento.available ? 'bg-brand-yellow/10' : 'bg-white/5'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                    planejamento.available ? 'bg-brand-yellow/20 text-brand-yellow' : 'bg-white/10 text-gray-500'
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
                                        <Check className={`w-4 h-4 mr-2 flex-shrink-0 ${
                                            planejamento.available ? 'text-green-400' : 'text-gray-600'
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
                                className={`w-full py-3 font-bold uppercase text-sm transition-colors flex items-center justify-center gap-2 ${
                                    planejamento.available
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
                    vendedorId={user.id}
                    concursoDefault={selectedPlanejamento.concurso}
                    preparatorioId={selectedPlanejamento.id}
                    preparatorioSlug={selectedPlanejamento.slug}
                />
            )}
        </div>
    );
};
