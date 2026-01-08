
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, RadialBarChart, RadialBar,
    AreaChart, Area, XAxis, YAxis, Tooltip,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, Cell, CartesianGrid
} from 'recharts';
import {
    User, LogOut, Camera, Flame,
    CheckCircle2, Clock, Zap, ArrowLeft, Target,
    FileText, Calendar, ChevronRight, BookOpen
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

// Mock Data (temporário)
const performanceData = [
    { name: 'Seg', uv: 4 },
    { name: 'Ter', uv: 3 },
    { name: 'Qua', uv: 2 },
    { name: 'Qui', uv: 6 },
    { name: 'Sex', uv: 8 },
    { name: 'Sab', uv: 5 },
    { name: 'Dom', uv: 4 },
];

const radarData = [
    { subject: 'Português', A: 120, fullMark: 150 },
    { subject: 'Dir. Const.', A: 98, fullMark: 150 },
    { subject: 'Dir. Adm.', A: 86, fullMark: 150 },
    { subject: 'R. Lógico', A: 99, fullMark: 150 },
    { subject: 'Informática', A: 85, fullMark: 150 },
    { subject: 'Contabilidade', A: 65, fullMark: 150 },
];

const rodadaData = [
    { name: 'R1', completed: 85 },
    { name: 'R2', completed: 45 },
    { name: 'R3', completed: 10 },
    { name: 'R4', completed: 0 },
];

export const StudentDashboardView: React.FC = () => {
    const { id: planejamentoId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth(); // Admin user context
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null); // Aluno
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalMissions: 0,
        progressPercent: 0,
        streak: 0,
        hoursEstimated: 0,
        last7Days: [] as any[],
        radarData: [] as any[]
    });

    // Constante aproximada para PRF (ajustar conforme real)
    const TOTAL_MISSIONS_COURSE = 432;

    useEffect(() => {
        const loadData = async () => {
            if (!planejamentoId) return;

            try {
                // 1. Identificar Aluno
                // Se estiver logado como admin, ok. Se for aluno, pegar do localstorage
                const storedStudent = localStorage.getItem('ouse_student_user');
                let currentStudentId = null;
                let currentStudentName = "Aluno";

                if (storedStudent) {
                    const s = JSON.parse(storedStudent);
                    currentStudentId = s.id;
                    currentStudentName = s.name;
                    setStudentData(s);

                    // Buscar avatar atualizado
                    const { data: userData } = await supabase
                        .from('admin_users')
                        .select('avatar_url')
                        .eq('id', s.id)
                        .single();
                    if (userData?.avatar_url) setAvatarUrl(userData.avatar_url);
                } else if (user) {
                    // Admin vendo
                    // Buscar nome do dono do planejamento
                    const { data: plan } = await supabase.from('planejamentos').select('nome_aluno, lead_id').eq('id', planejamentoId).single();
                    if (plan) currentStudentName = plan.nome_aluno;
                }

                if (!currentStudentName) return;

                // 2. Buscar Execuções
                const { data: execs } = await supabase
                    .from('missoes_executadas')
                    .select('*')
                    .eq('planejamento_id', planejamentoId)
                    .order('completed_at', { ascending: true });

                const executions = execs || [];
                const totalCompleted = executions.length;

                // Calcular Streak
                // Lógica simples: Dias consecutivos únicos
                const uniqueDays = [...new Set(executions.map(e => new Date(e.completed_at).toDateString()))];
                // TODO: Implementar lógica robusta de streak (checando lacunas)
                // Para MVP: count total days active
                const activeDays = uniqueDays.length;

                // Calcular Evolução (Últimos 7 dias)
                const last7DaysMap = new Map();
                const today = new Date();
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                    const key = d.toDateString();
                    last7DaysMap.set(key, { name: label.charAt(0).toUpperCase() + label.slice(1), uv: 0, fullDate: key });
                }

                executions.forEach(e => {
                    const dateKey = new Date(e.completed_at).toDateString();
                    if (last7DaysMap.has(dateKey)) {
                        last7DaysMap.get(dateKey).uv += 1;
                    }
                });

                const evolutionData = Array.from(last7DaysMap.values());

                setStats({
                    totalMissions: totalCompleted,
                    progressPercent: Math.round((totalCompleted / TOTAL_MISSIONS_COURSE) * 100),
                    streak: activeDays, // Placeholder
                    hoursEstimated: Math.round(totalCompleted * 1.5), // Est. 1.5h per mission
                    last7Days: evolutionData,
                    radarData: radarData // Mock for radar currently
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [planejamentoId, user]);

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !studentData) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentData.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        try {
            setLoading(true);
            // 1. Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars') // Certifique-se que o bucket existe
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // 3. Update User
            await supabase
                .from('admin_users')
                .update({ avatar_url: publicUrl })
                .eq('id', studentData.id);

            setAvatarUrl(publicUrl);
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao atualizar foto.');
        } finally {
            setLoading(false);
        }
    };

    const studentName = studentData?.name || "Aluno";

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-20 font-sans selection:bg-[var(--color-accent)]/30 theme-transition">
            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border-light)] z-50 h-20 flex items-center px-4 md:px-8 justify-between theme-transition">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/planejamento/prf/${planejamentoId}`)} className="p-2 hover:bg-[var(--color-bg-hover)] rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] mb-0.5">Meu Desempenho</h1>
                        <p className="text-xs text-[var(--color-accent)] font-bold uppercase tracking-widest">Dashboard do Aluno</p>
                    </div>
                </div>

                {/* Profile Actions */}
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer w-10 h-10">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            disabled={!studentData} // Apenas o aluno pode trocar sua foto
                        />
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-hover)] p-[2px]">
                            <div className="w-full h-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-2 text-[var(--color-text-secondary)]" />
                                )}
                                {/* Overlay Upload */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    <Camera className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem('ouse_student_user');
                            navigate('/login');
                        }}
                        className="p-2 hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] text-[var(--color-text-secondary)] rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="pt-28 px-4 md:px-8 max-w-7xl mx-auto space-y-6">

                {/* --- WELCOME BANNER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-2">Olá, {studentName} <span className="text-2xl animate-pulse">👋</span></h2>
                        <p className="text-[var(--color-text-secondary)]">Você está indo bem! Continue firme nos seus objetivos.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Quick Actions (if needed) */}
                    </div>
                </div>

                {/* --- BENTO GRID LAYOUT --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 auto-rows-min">

                    {/* 1. HERO METRIC (Velocity) - Large Square [2x2 on Desktop] */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:col-span-1 md:row-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group theme-transition"
                    >
                        <div className="absolute inset-0 bg-[var(--color-accent-light)] radial-gradient opacity-50 pointer-events-none" />
                        <h3 className="text-[var(--color-text-secondary)] text-sm font-bold uppercase tracking-widest mb-4">Progresso Geral</h3>

                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Recharts Radial Bar - Using it as a gauge */}
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    barSize={15}
                                    data={[{ name: 'Progress', value: stats.progressPercent, fill: '#FFB800' }]}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar background dataKey="value" cornerRadius={10} angleAxisId={0} />
                                </RadialBarChart>
                            </ResponsiveContainer>

                            {/* Bolinha indicadora no início da curva (0%) */}
                            <div
                                className="absolute w-5 h-5 bg-brand-yellow rounded-full shadow-lg shadow-yellow-500/50 border-2 border-brand-darker z-10"
                                style={{
                                    left: '7px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />

                            {/* Bolinha indicadora no fim da curva (progresso atual) */}
                            {stats.progressPercent > 0 && (
                                <div
                                    className="absolute w-5 h-5 bg-brand-yellow rounded-full shadow-lg shadow-yellow-500/50 border-2 border-brand-darker z-10"
                                    style={{
                                        // Calcula a posição baseado no ângulo (180° a 0°)
                                        // Ângulo em radianos: (180 - (progressPercent * 1.8)) * (π/180)
                                        left: `calc(50% + ${Math.cos((180 - stats.progressPercent * 1.8) * Math.PI / 180) * 82}px - 10px)`,
                                        top: `calc(50% - ${Math.sin((180 - stats.progressPercent * 1.8) * Math.PI / 180) * 82}px - 10px)`
                                    }}
                                />
                            )}

                            <div className="absolute inset-0 flex flex-col items-center justify-center pb-8">
                                <span className="text-5xl font-black text-[var(--color-text-primary)] tracking-tighter">{stats.progressPercent}%</span>
                                <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase mt-1">Concluído</span>
                            </div>
                        </div>

                        <div className="text-center mt-[-40px]">
                            <p className="text-sm text-[var(--color-text-secondary)]">Total de <strong className="text-[var(--color-text-primary)]">{stats.totalMissions}</strong> missões concluídas</p>
                            <div className="mt-4 px-4 py-2 bg-[var(--color-bg-hover)] rounded-lg border border-[var(--color-border-light)] inline-flex items-center gap-2">
                                <Target className="w-4 h-4 text-[var(--color-accent)]" />
                                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Meta: 100% até Dezembro</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. KPI CARDS (Top Row) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-5 flex flex-col justify-between hover:border-[var(--color-accent)]/30 transition-colors theme-transition"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                <Flame className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-[var(--color-success)]">+1 dia</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.streak}</span>
                            <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mt-1">Dias de Ofensiva (Streak)</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-5 flex flex-col justify-between hover:border-[var(--color-accent)]/30 transition-colors theme-transition"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.totalMissions}</span>
                            <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mt-1">Missões Executadas</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-5 flex flex-col justify-between hover:border-[var(--color-accent)]/30 transition-colors theme-transition"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.hoursEstimated}h</span>
                            <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mt-1">Tempo de Estudo Est.</p>
                        </div>
                    </motion.div>

                    {/* 3. EVOLUTION CHART - Large Wide [2 cols] */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6 min-h-[300px] theme-transition"
                    >
                        <h3 className="text-[var(--color-text-secondary)] text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[var(--color-accent)]" />
                            Ritmo de Estudos (Últimos 7 dias)
                        </h3>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.last7Days}>
                                    <defs>
                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="uv" stroke="#FFB800" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* 4. RADAR CHART - [1 col] */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="md:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-4 flex flex-col items-center justify-center theme-transition"
                    >
                        <h3 className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-widest mb-2">Equilíbrio</h3>
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                                    <Radar name="Você" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                </div>

                {/* --- CARDS DE NAVEGAÇÃO --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Card - Meu Planejamento */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => navigate(`/planejamento/prf/${planejamentoId}`)}
                        className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6 cursor-pointer group hover:border-[var(--color-accent)]/30 transition-all duration-300 hover:-translate-y-1 theme-transition"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-4 bg-[var(--color-accent-light)] rounded-xl border border-[var(--color-accent)]/20 group-hover:bg-[var(--color-accent)]/20 transition-colors">
                                <Calendar className="w-8 h-8 text-[var(--color-accent)]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                                    Meu Planejamento
                                </h3>
                                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                                    Acesse seu cronograma tático de estudos com todas as missões organizadas por rodadas. Marque as missões concluídas e acompanhe seu progresso.
                                </p>
                                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                                    <span className="flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5" />
                                        Missões por rodada
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Marcar conclusão
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>

                    {/* Card - Edital Verticalizado */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        onClick={() => navigate(`/edital-verticalizado/prf/${planejamentoId}`)}
                        className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6 cursor-pointer group hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 theme-transition"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                                <FileText className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-purple-400 transition-colors">
                                    Edital Verticalizado
                                </h3>
                                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                                    Visualize todo o conteúdo programático do edital organizado por matéria e tópico. Ideal para revisar o que estudar e não deixar nada de fora.
                                </p>
                                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Conteúdo completo
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" />
                                        Organizado por matéria
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>
                </div>

            </main>
        </div>
    );
};
