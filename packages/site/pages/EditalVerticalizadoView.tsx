
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Loader2, BookOpen, Target, Lock, ChevronDown, Calendar, FileText, Menu as MenuIcon, X, ChevronRight, ClipboardCheck, User } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../lib/AuthContext';
import { planejamentosService } from '../services/preparatoriosService';
import { studentService } from '../services/studentService';
import { AdminUser } from '../lib/database.types';

interface EditalItem {
    id: string;
    tipo: 'bloco' | 'materia' | 'topico';
    titulo: string;
    ordem: number;
    parent_id: string | null;
    items?: EditalItem[]; // Estrutura aninhada em memória
}

interface EditalProgress {
    item_id: string | null;
    missao: boolean;
    acao: boolean;
    revisao: boolean;
}

const SectionProgress: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const remaining = total - current;

    return (
        <div className="flex flex-col gap-1.5 w-full md:w-64">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-brand-yellow">{percentage}% Concluído</span>
                <span className="text-gray-400">
                    {remaining === 0 ? (
                        <span className="text-green-500">Completo</span>
                    ) : (
                        `Faltam ${remaining} tópicos`
                    )}
                </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-brand-yellow/80 to-brand-yellow transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,184,0,0.5)]"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const CheckboxGigante: React.FC<{
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-[45px] h-[45px] border-2 rounded transition-all flex items-center justify-center flex-shrink-0
      ${disabled ? 'opacity-50 cursor-not-allowed border-gray-700 bg-gray-800' : 'cursor-pointer'}
      ${checked
                ? 'bg-brand-yellow border-brand-yellow hover:bg-brand-yellow/90'
                : 'bg-brand-dark border-white/20 hover:border-brand-yellow/50'
            }
    `}
    >
        {checked && <Check className="w-8 h-8 text-brand-darker font-bold" strokeWidth={3} />}
    </button>
);

export const EditalVerticalizadoView: React.FC = () => {
    const { id, slug } = useParams<{ id: string; slug?: string }>();
    const navigate = useNavigate();
    const { user: adminUser, isLoading: isAdminLoading } = useAuth();

    const [authChecked, setAuthChecked] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<EditalItem[]>([]);
    const [progress, setProgress] = useState<Record<string, EditalProgress>>({});
    const [planejamentoNome, setPlanejamentoNome] = useState('');
    const [preparatorioId, setPreparatorioId] = useState<string | null>(null);

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Links de navegação
    const navLinks = [
        { label: 'Calendário', path: `/planejador-semanal/${slug || 'prf'}/${id}`, icon: Calendar, active: false },
        { label: 'Planner', path: `/planner/${slug || 'prf'}/${id}`, icon: ClipboardCheck, active: false },
        { label: 'Missões', path: `/planejamento/${slug || 'prf'}/${id}`, icon: Target, active: false },
        { label: 'Edital', path: `/edital-verticalizado/${slug || 'prf'}/${id}`, icon: FileText, active: true },
    ];

    const toggleCollapse = (itemId: string) => {
        setCollapsedSections(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    useEffect(() => {
        const checkAuth = async () => {
            // BYPASS FOR TESTING
            // Acesso liberado temporariamente para visualização
            setHasAccess(true);
            setAuthChecked(true);
        };

        checkAuth();
    }, [adminUser, isAdminLoading, id]);

    useEffect(() => {
        const fetchData = async () => {
            // Aguardar auth
            if (!authChecked || !hasAccess) return;

            // 1. Buscar planejamento para saber o preparatório
            if (!id) return;

            try {
                let prepId: string | null = null;
                let nomeAluno = '';

                // Tentar buscar na tabela nova
                const planejamento = await planejamentosService.getById(id);

                if (planejamento) {
                    prepId = planejamento.preparatorio_id;
                    nomeAluno = planejamento.nome_aluno;
                } else {
                    // Fallback: Tentar tabela legada (planejamentos_prf)
                    const { data: legado } = await supabase
                        .from('planejamentos_prf')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (legado) {
                        // ID FIXO DO PREPARATORIO PRF (Fallback)
                        prepId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
                        nomeAluno = legado.nome_aluno;
                    }
                }

                if (!prepId) throw new Error('Planejamento não encontrado');

                setPlanejamentoNome(nomeAluno);
                setPreparatorioId(prepId);

                // 2. Buscar itens do edital
                const { data: itemsData, error: itemsError } = await supabase
                    .from('edital_verticalizado_items')
                    .select('*')
                    .eq('preparatorio_id', prepId)
                    .order('ordem');

                if (itemsError) throw itemsError;

                // 3. Buscar progresso do usuário
                const { data: progressData, error: progressError } = await supabase
                    .from('edital_verticalizado_progress')
                    .select('*')
                    .eq('planejamento_id', id);

                if (progressError) throw progressError;

                // Organizar progresso em mapa para acesso rápido
                const progressMap: Record<string, EditalProgress> = {};
                progressData?.forEach(p => {
                    if (p.item_id) {
                        progressMap[p.item_id] = p;
                    }
                });
                setProgress(progressMap);

                // Organizar itens em árvore
                const blocos: EditalItem[] = [];
                const materias: EditalItem[] = [];
                const topicos: EditalItem[] = [];

                itemsData?.forEach(item => {
                    if (item.tipo === 'bloco') blocos.push({ ...item, items: [] });
                    else if (item.tipo === 'materia') materias.push({ ...item, items: [] });
                    else topicos.push(item);
                });

                // Vincular tópicos às matérias
                topicos.forEach(topico => {
                    const materia = materias.find(m => m.id === topico.parent_id);
                    if (materia && materia.items) materia.items.push(topico);
                });

                // Vincular matérias aos blocos
                materias.forEach(materia => {
                    const bloco = blocos.find(b => b.id === materia.parent_id);
                    // Se não tiver bloco (ex: item raiz), adiciona na raiz? 
                    // Pelo script, materias tem pai bloco.
                    if (bloco && bloco.items) bloco.items.push(materia);
                });

                // Ordenar tudo apenas por segurança (já veio ordenado do DB, mas o push pode ter sido fora de ordem se o loop original não fosse sequential)
                // Como o BD retornou ordenado por `ordem`, o loop linear mantém a ordem relativa.

                setItems(blocos);
            } catch (err) {
                console.error('Erro ao carregar edital:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, authChecked, hasAccess]);

    const toggleItem = async (itemId: string, field: 'missao' | 'acao' | 'revisao') => {
        if (!id) return;

        // Optimistic update
        const currentProgress = progress[itemId] || { item_id: itemId, missao: false, acao: false, revisao: false };
        const newValue = !currentProgress[field];

        const newProgress = { ...currentProgress, [field]: newValue };

        setProgress(prev => ({
            ...prev,
            [itemId]: newProgress
        }));

        // Update DB
        try {
            const { error } = await supabase
                .from('edital_verticalizado_progress')
                .upsert({
                    planejamento_id: id,
                    item_id: itemId,
                    missao: newProgress.missao,
                    acao: newProgress.acao,
                    revisao: newProgress.revisao
                }, { onConflict: 'planejamento_id, item_id' });

            if (error) throw error;
        } catch (err) {
            console.error('Erro ao salvar progresso:', err);
            // Revert on error
            setProgress(prev => ({
                ...prev,
                [itemId]: currentProgress
            }));
        }
    };

    // Aguardando verificação de auth
    if (!authChecked || isAdminLoading) {
        return (
            <div className="min-h-screen bg-brand-darker flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(255,184,0,0.2)]" />
                    <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    // Sem acesso - mostrar tela de login
    if (!hasAccess) {
        const currentPath = window.location.pathname;
        return (
            <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="mb-8">
                        <img
                            src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
                            alt="Ouse Passar"
                            className="h-12 mx-auto mb-4"
                        />
                    </div>

                    <div className="bg-brand-card border border-white/10 rounded-sm p-8">
                        <div className="w-16 h-16 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-brand-yellow" />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                            Acesso Restrito
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Você precisa estar logado com a conta proprietária deste planejamento para acessar o Edital Verticalizado.
                        </p>

                        <button
                            onClick={() => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)}
                            className="w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase tracking-wide hover:bg-brand-yellow/90 transition-colors"
                        >
                            Fazer Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-darker flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
            </div>
        );
    }

    // Se não houver itens, pode ser que o seed não tenha rodado para este preparatório ou é outro curso
    // Como o usuário pediu especificamente para o PRF e fizemos o seed para o PRF...

    return (
        <div className="min-h-screen bg-brand-darker text-white pb-20">
            <SEOHead title="Edital Verticalizado | Ouse Passar" />

            {/* Header com Menu de Navegação */}
            <header className="fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo / Nome do Aluno */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-brand-yellow font-black text-lg uppercase tracking-tight">
                                    {planejamentoNome}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                    <button
                                        key={link.label}
                                        onClick={() => navigate(link.path)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-lg ${
                                            link.active
                                                ? 'text-brand-yellow bg-brand-yellow/10'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        {link.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Botão Perfil (desktop) */}
                        <button
                            onClick={() => navigate(`/perfil/${slug || 'prf'}/${id}`)}
                            className="hidden md:flex items-center justify-center w-9 h-9 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Perfil"
                        >
                            <User className="w-5 h-5" />
                        </button>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-white hover:text-brand-yellow focus:outline-none p-2"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-brand-card border-b border-white/10">
                        <div className="px-4 pt-2 pb-4 space-y-1">
                            {navLinks.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                    <button
                                        key={link.label}
                                        onClick={() => {
                                            navigate(link.path);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 transition-all ${
                                            link.active
                                                ? 'border-brand-yellow text-brand-yellow bg-white/5'
                                                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        {link.label}
                                        {link.active && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                );
                            })}

                            {/* Perfil no mobile */}
                            <button
                                onClick={() => {
                                    navigate(`/perfil/${slug || 'prf'}/${id}`);
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all mt-2 border-t border-white/10"
                            >
                                <User className="w-4 h-4" />
                                Perfil
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="pt-24 px-4 max-w-7xl mx-auto">

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-500">Nenhum edital encontrado para este curso.</h2>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {items.map(bloco => (
                            <div key={bloco.id} className="bg-brand-card border border-white/5 rounded-lg overflow-hidden">
                                {/* Header do Bloco */}
                                <div className="bg-gradient-to-r from-brand-dark to-brand-card border-b border-white/10 p-6">
                                    <h2 className="text-2xl font-black text-brand-yellow uppercase tracking-wider">{bloco.titulo}</h2>
                                </div>

                                <div className="divide-y divide-white/5">
                                    {bloco.items?.map(materia => {
                                        const totalTopicos = materia.items?.length || 0;
                                        // Um tópico é considerado concluído quando Teoria E Questões estão marcados
                                        const completedTopicos = materia.items?.filter(t =>
                                            progress[t.id]?.missao && progress[t.id]?.acao
                                        ).length || 0;
                                        const isCollapsed = collapsedSections[materia.id];

                                        return (
                                            <div key={materia.id}>
                                                {/* Header da Matéria - Clicável para colapsar */}
                                                <div
                                                    onClick={() => toggleCollapse(materia.id)}
                                                    className="bg-black/20 p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 cursor-pointer hover:bg-black/30 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                                                            <ChevronDown className="w-6 h-6 text-brand-yellow group-hover:text-brand-yellow/80" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white uppercase group-hover:text-gray-200">{materia.titulo}</h3>
                                                    </div>
                                                    <SectionProgress current={completedTopicos} total={totalTopicos} />
                                                </div>

                                                {/* Conteúdo Colapsável */}
                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
                                                    {/* Tabela de Tópicos */}
                                                    <div className="divide-y divide-white/5">
                                                        {/* Cabeçalho da Tabela apenas se tiver tópicos - Apenas Desktop */}
                                                        {materia.items && materia.items.length > 0 && (
                                                            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-brand-dark/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                <div className="col-span-6">Assunto</div>
                                                                <div className="col-span-2 text-center">Teoria</div>
                                                                <div className="col-span-2 text-center">Questões</div>
                                                                <div className="col-span-2 text-center">Revisão</div>
                                                            </div>
                                                        )}

                                                        {materia.items?.map(topico => {
                                                            // Verificar se o tópico está completo (Teoria + Questões marcados)
                                                            const isCompleted = progress[topico.id]?.missao && progress[topico.id]?.acao;

                                                            return (
                                                                <div key={topico.id} className={`flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors md:items-center border-b md:border-none border-white/5 last:border-none ${isCompleted ? 'bg-green-500/5' : ''}`}>
                                                                    {/* Assunto */}
                                                                    <div className="md:col-span-6 pr-4">
                                                                        <p className={`font-medium leading-relaxed ${isCompleted ? 'text-green-400' : 'text-gray-300'}`}>{topico.titulo}</p>
                                                                    </div>

                                                                    {/* Checkboxes Wrapper Mobile */}
                                                                    <div className="flex justify-start gap-6 md:contents mt-2 md:mt-0">
                                                                        {/* Check Teoria (campo missao no banco) */}
                                                                        <div className="flex flex-col items-center md:col-span-2">
                                                                            <CheckboxGigante
                                                                                checked={progress[topico.id]?.missao || false}
                                                                                onChange={() => toggleItem(topico.id, 'missao')}
                                                                            />
                                                                            <span className="md:hidden text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-wider">Teoria</span>
                                                                        </div>

                                                                        {/* Check Questões (campo acao no banco) */}
                                                                        <div className="flex flex-col items-center md:col-span-2">
                                                                            <CheckboxGigante
                                                                                checked={progress[topico.id]?.acao || false}
                                                                                onChange={() => toggleItem(topico.id, 'acao')}
                                                                            />
                                                                            <span className="md:hidden text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-wider">Questões</span>
                                                                        </div>

                                                                        {/* Check Revisão */}
                                                                        <div className="flex flex-col items-center md:col-span-2">
                                                                            <CheckboxGigante
                                                                                checked={progress[topico.id]?.revisao || false}
                                                                                onChange={() => toggleItem(topico.id, 'revisao')}
                                                                            />
                                                                            <span className="md:hidden text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-wider">Revisão</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
};
