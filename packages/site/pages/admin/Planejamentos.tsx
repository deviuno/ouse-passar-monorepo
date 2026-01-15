import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Check, User, Clock, Target, Minus, Shield, Award, Book, Loader2, Search } from 'lucide-react';
import { leadsService, CreateLeadInput } from '../../services/adminUsersService';
import { Database, Tables, Enums } from '../../lib/database.types';

type LeadDifficulty = Enums<'lead_difficulty'>;
type LeadGender = Enums<'lead_gender'>;
type EducationLevel = Enums<'education_level'>;
type Lead = Tables<'leads'>;

// Fallback for Preparatorio since it might be missing in database.types.ts
interface Preparatorio {
    id: string;
    nome: string;
    slug: string;
    descricao?: string;
    descricao_curta?: string | null;
    imagem_capa?: string | null;
    cor?: string;
    is_active: boolean;
    ordem?: number;
    content_types?: string[];
    created_at?: string;
    updated_at?: string;
}

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
import { Confetti, LoadingSteps, MinutesInput, SuccessCard } from '../../components/admin/planejamentos';

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
            profissao: (lead as any).profissao || '',
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
    const [formData, setFormData] = useState<CreateLeadInput & { profissao?: string }>({
        nome: existingLead?.nome || '',
        sexo: existingLead?.sexo || undefined,
        email: existingLead?.email || '',
        telefone: existingLead?.telefone || '',
        concurso_almejado: existingLead?.concurso_almejado || concursoDefault || 'PRF - Policia Rodoviaria Federal',
        nivel_escolaridade: existingLead?.nivel_escolaridade || undefined,
        trabalha: existingLead?.trabalha || false,
        profissao: (existingLead as any)?.profissao || '',
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
                                                className={`w-full bg-brand-dark border p-3 text-white focus:border-brand-yellow outline-none transition-colors placeholder:text-gray-600 ${phoneError ? 'border-red-500' : 'border-white/10'
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
                                        2. Há quanto tempo você está se preparando para o concurso? Que materiais ou cursos você já utilizou anteriormente na sua preparação?
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
                                                        e_concursado: e.target.checked ? formData.e_concursado : false,
                                                        profissao: e.target.checked ? formData.profissao : ''
                                                    })}
                                                    className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                                                />
                                                <span className="text-white text-sm">Trabalha atualmente</span>
                                            </label>

                                            {formData.trabalha && (
                                                <>
                                                    <div className="ml-7">
                                                        <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Com o que trabalha?</label>
                                                        <input
                                                            type="text"
                                                            value={formData.profissao || ''}
                                                            onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                                                            className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                            placeholder="Ex: Professor, Analista, Vendedor..."
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer ml-7">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.e_concursado}
                                                            onChange={(e) => setFormData({ ...formData, e_concursado: e.target.checked })}
                                                            className="w-5 h-5 bg-brand-dark border border-white/10 rounded text-brand-yellow focus:ring-brand-yellow"
                                                        />
                                                        <span className="text-white text-sm">É concursado?</span>
                                                    </label>
                                                </>
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
    descricao_curta: string | null;
    imagem_capa: string | null;
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
                    descricao_curta: prep.descricao_curta || null,
                    imagem_capa: prep.imagem_capa || null,
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
                    cor: prep.cor || '#FCD34D'
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
                            className={`group bg-brand-card border rounded-sm overflow-hidden transition-all duration-300 flex flex-col h-full ${planejamento.available
                                ? 'border-white/10 hover:border-brand-yellow/50 cursor-pointer hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-yellow/5'
                                : 'border-white/5 opacity-60 cursor-not-allowed'
                                }`}
                        >
                            {/* Imagem de Capa ou Placeholder */}
                            <div className="relative h-48 overflow-hidden bg-brand-dark flex-shrink-0">
                                {planejamento.imagem_capa ? (
                                    <img
                                        src={planejamento.imagem_capa}
                                        alt={planejamento.subtitle}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brand-yellow/5">
                                        <div className="text-brand-yellow/20">
                                            {planejamento.icon}
                                        </div>
                                    </div>
                                )}

                                {/* Badge de Disponibilidade */}
                                <div className="absolute top-4 right-4">
                                    {planejamento.available ? (
                                        <span className="px-3 py-1 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full shadow-lg border border-green-400/20">
                                            Disponível
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-gray-400 text-[10px] font-black uppercase rounded-full border border-white/10">
                                            Em breve
                                        </span>
                                    )}
                                </div>

                                {/* Gradiente sobre a imagem */}
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent opacity-60" />
                            </div>

                            {/* Conteúdo do Card */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-black text-white uppercase mb-1 leading-tight group-hover:text-brand-yellow transition-colors">
                                    {planejamento.subtitle}
                                </h3>

                                <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                                    {planejamento.descricao_curta || planejamento.description}
                                </p>

                                <div className="mt-auto pt-6 border-t border-white/5">
                                    <button
                                        disabled={!planejamento.available}
                                        className={`w-full py-3.5 font-bold uppercase text-xs transition-all duration-300 flex items-center justify-center gap-2 rounded-sm ${planejamento.available
                                            ? 'bg-brand-yellow text-brand-darker hover:bg-brand-yellow/90 group-hover:shadow-lg'
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
