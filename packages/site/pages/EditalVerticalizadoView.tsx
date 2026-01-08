
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Loader2, BookOpen, Lock, ChevronDown } from 'lucide-react';
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
                <span className="text-[var(--color-accent)]">{percentage}% Concluído</span>
                <span className="text-[var(--color-text-secondary)]">
                    {remaining === 0 ? (
                        <span className="text-[var(--color-success)]">Completo</span>
                    ) : (
                        `Faltam ${remaining} tópicos`
                    )}
                </span>
            </div>
            <div className="h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[var(--color-accent)]/80 to-[var(--color-accent)] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,184,0,0.5)]"
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
      ${disabled ? 'opacity-50 cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg-tertiary)]' : 'cursor-pointer'}
      ${checked
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] hover:bg-[var(--color-accent)]/90'
                : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-accent)]/50'
            }
    `}
    >
        {checked && <Check className="w-8 h-8 text-[var(--color-text-inverse)] font-bold" strokeWidth={3} />}
    </button>
);

export const EditalVerticalizadoView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: adminUser, isLoading: isAdminLoading } = useAuth();

    const [authChecked, setAuthChecked] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<EditalItem[]>([]);
    const [progress, setProgress] = useState<Record<string, EditalProgress>>({});
    const [preparatorioId, setPreparatorioId] = useState<string | null>(null);

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center theme-transition">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(255,184,0,0.2)]" />
                    <p className="text-[var(--color-text-secondary)] font-medium uppercase tracking-widest text-sm">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    // Sem acesso - mostrar tela de login
    if (!hasAccess) {
        const currentPath = window.location.pathname;
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4 theme-transition">
                <div className="text-center max-w-md mx-auto">
                    <div className="mb-8">
                        <img
                            src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
                            alt="Ouse Passar"
                            className="h-12 mx-auto mb-4"
                        />
                    </div>

                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-sm p-8 theme-transition">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent)]/30 flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-[var(--color-accent)]" />
                        </div>

                        <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2 uppercase tracking-tight">
                            Acesso Restrito
                        </h2>
                        <p className="text-[var(--color-text-secondary)] mb-8">
                            Você precisa estar logado com a conta proprietária deste planejamento para acessar o Edital Verticalizado.
                        </p>

                        <button
                            onClick={() => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)}
                            className="w-full bg-[var(--color-accent)] text-[var(--color-text-inverse)] py-4 font-bold uppercase tracking-wide hover:bg-[var(--color-accent)]/90 transition-colors"
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
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center theme-transition">
                <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
            </div>
        );
    }

    // Se não houver itens, pode ser que o seed não tenha rodado para este preparatório ou é outro curso
    // Como o usuário pediu especificamente para o PRF e fizemos o seed para o PRF...

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-20 theme-transition">
            <SEOHead title="Edital Verticalizado | Ouse Passar" />

            <main className="pt-20 px-4 max-w-7xl mx-auto">

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[var(--color-text-muted)]">Nenhum edital encontrado para este curso.</h2>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {items.map(bloco => (
                            <div key={bloco.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-lg overflow-hidden theme-transition">
                                {/* Header do Bloco */}
                                <div className="bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-card)] border-b border-[var(--color-border-light)] p-6">
                                    <h2 className="text-2xl font-black text-[var(--color-accent)] uppercase tracking-wider">{bloco.titulo}</h2>
                                </div>

                                <div className="divide-y divide-[var(--color-border-light)]">
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
                                                    className="bg-black/10 p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-light)] cursor-pointer hover:bg-black/20 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                                                            <ChevronDown className="w-6 h-6 text-[var(--color-accent)] group-hover:text-[var(--color-accent)]/80" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] uppercase group-hover:text-[var(--color-text-secondary)]">{materia.titulo}</h3>
                                                    </div>
                                                    <SectionProgress current={completedTopicos} total={totalTopicos} />
                                                </div>

                                                {/* Conteúdo Colapsável */}
                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
                                                    {/* Tabela de Tópicos */}
                                                    <div className="divide-y divide-[var(--color-border-light)]">
                                                        {/* Cabeçalho da Tabela apenas se tiver tópicos - Apenas Desktop */}
                                                        {materia.items && materia.items.length > 0 && (
                                                            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--color-bg-secondary)]/50 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
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
                                                                <div key={topico.id} className={`flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--color-bg-hover)] transition-colors md:items-center border-b md:border-none border-[var(--color-border-light)] last:border-none ${isCompleted ? 'bg-[var(--color-success-light)]' : ''}`}>
                                                                    {/* Assunto */}
                                                                    <div className="md:col-span-6 pr-4">
                                                                        <p className={`font-medium leading-relaxed ${isCompleted ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`}>{topico.titulo}</p>
                                                                    </div>

                                                                    {/* Checkboxes Wrapper Mobile */}
                                                                    <div className="flex justify-start gap-6 md:contents mt-2 md:mt-0">
                                                                        {/* Check Teoria (campo missao no banco) */}
                                                                        <div className="flex flex-col items-center md:col-span-2">
                                                                            <CheckboxGigante
                                                                                checked={progress[topico.id]?.missao || false}
                                                                                onChange={() => toggleItem(topico.id, 'missao')}
                                                                            />
                                                                            <span className="md:hidden text-[10px] text-[var(--color-text-muted)] font-bold uppercase mt-2 tracking-wider">Teoria</span>
                                                                        </div>

                                                                        {/* Check Questões (campo acao no banco) */}
                                                                        <div className="flex flex-col items-center md:col-span-2">
                                                                            <CheckboxGigante
                                                                                checked={progress[topico.id]?.acao || false}
                                                                                onChange={() => toggleItem(topico.id, 'acao')}
                                                                            />
                                                                            <span className="md:hidden text-[10px] text-[var(--color-text-muted)] font-bold uppercase mt-2 tracking-wider">Questões</span>
                                                                        </div>

                                                                        {/* Check Revisão */}
                                                                        <div className="flex flex-col items-center md:col-span-2">
                                                                            <CheckboxGigante
                                                                                checked={progress[topico.id]?.revisao || false}
                                                                                onChange={() => toggleItem(topico.id, 'revisao')}
                                                                            />
                                                                            <span className="md:hidden text-[10px] text-[var(--color-text-muted)] font-bold uppercase mt-2 tracking-wider">Revisão</span>
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
