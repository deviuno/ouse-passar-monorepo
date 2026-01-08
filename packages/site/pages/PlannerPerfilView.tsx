import React, { useEffect, useState, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  User,
  Camera,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Flame,
  Moon,
  Edit3,
  Save,
  Sun,
  Sunrise,
  Target,
  X,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/SEOHead';
import { plannerService } from '../services/plannerService';
import { Planejamento } from '../lib/database.types';
import { useTheme } from '../lib/ThemeContext';

// Tipo do contexto do layout
interface PlannerContext {
  planejamento: Planejamento | null;
  slug: string;
  id: string;
}

// Componente Principal
export const PlannerPerfilView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const context = useOutletContext<PlannerContext>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [horasSono, setHorasSono] = useState(8);

  // Estado para edição das horas de sono
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [horaAcordar, setHoraAcordar] = useState('06:00');
  const [horaDormir, setHoraDormir] = useState('22:00');
  const [savingSleep, setSavingSleep] = useState(false);

  // Estatísticas
  const [stats, setStats] = useState({
    diasVerdes: 0,
    horasEstudadas: 0,
    missoesTotal: 0,
    questoesTotal: 0,
    mediaAcertos: null as number | null,
    sequenciaDias: 0,
    melhorSequencia: 0
  });

  // Links de navegação padrão
  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Buscar planejamento
        const { data: planData } = await supabase
          .from('planejamentos')
          .select('*')
          .eq('id', id)
          .single();

        if (planData) {
          setPlanejamento(planData);

          // Definir horários para edição
          if (planData.hora_acordar) {
            setHoraAcordar(planData.hora_acordar.substring(0, 5));
          }
          if (planData.hora_dormir) {
            setHoraDormir(planData.hora_dormir.substring(0, 5));
          }

          // Calcular horas de sono
          if (planData.hora_acordar && planData.hora_dormir) {
            const acordar = planData.hora_acordar.substring(0, 5);
            const dormir = planData.hora_dormir.substring(0, 5);
            setHorasSono(calcularHorasSono(acordar, dormir));
          }
        }

        // Buscar avatar do lead (se existir)
        if (planData?.lead_id) {
          const { data: leadData } = await supabase
            .from('leads')
            .select('avatar_url')
            .eq('id', planData.lead_id)
            .single();

          if (leadData?.avatar_url) {
            setAvatarUrl(leadData.avatar_url);
          }
        }

        // Buscar resumo semanal
        const weekSummary = await plannerService.getWeekSummary(id);

        // Buscar estatísticas totais (todos os dias registrados)
        const { data: allRecords } = await supabase
          .from('planner_diario')
          .select('*')
          .eq('planejamento_id', id)
          .order('data', { ascending: false });

        if (allRecords && allRecords.length > 0) {
          const totalHoras = allRecords.reduce((acc, r) => acc + (r.horas_estudadas || 0), 0);
          const totalMissoes = allRecords.reduce((acc, r) => acc + (r.missoes_concluidas || 0), 0);
          const totalQuestoes = allRecords.reduce((acc, r) => acc + (r.questoes_feitas || 0), 0);
          const diasComAcertos = allRecords.filter(r => r.percentual_acertos !== null);
          const mediaAcertos = diasComAcertos.length > 0
            ? Math.round(diasComAcertos.reduce((acc, r) => acc + (r.percentual_acertos || 0), 0) / diasComAcertos.length)
            : null;

          // Calcular sequência de dias verdes
          let sequenciaAtual = 0;
          let melhorSequencia = 0;
          let sequenciaTemp = 0;

          for (const record of allRecords) {
            if (record.semaforo === 'verde') {
              sequenciaTemp++;
              if (sequenciaTemp > melhorSequencia) {
                melhorSequencia = sequenciaTemp;
              }
            } else {
              sequenciaTemp = 0;
            }
          }

          // Sequência atual (dias consecutivos mais recentes)
          for (const record of allRecords) {
            if (record.semaforo === 'verde') {
              sequenciaAtual++;
            } else {
              break;
            }
          }

          setStats({
            diasVerdes: allRecords.filter(r => r.semaforo === 'verde').length,
            horasEstudadas: Math.round(totalHoras * 10) / 10,
            missoesTotal: totalMissoes,
            questoesTotal: totalQuestoes,
            mediaAcertos,
            sequenciaDias: sequenciaAtual,
            melhorSequencia
          });
        } else {
          setStats({
            ...weekSummary,
            sequenciaDias: 0,
            melhorSequencia: 0
          });
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Calcular horas de sono
  const calcularHorasSono = (acordar: string, dormir: string): number => {
    const [acordarH, acordarM] = acordar.split(':').map(Number);
    const [dormirH, dormirM] = dormir.split(':').map(Number);
    const acordarMin = acordarH * 60 + acordarM;
    const dormirMin = dormirH * 60 + dormirM;
    let sonoMin = acordarMin - dormirMin;
    if (sonoMin < 0) sonoMin += 24 * 60; // Se passa da meia-noite
    return Math.round(sonoMin / 60 * 10) / 10;
  };

  // Salvar horários de sono
  const handleSaveSleep = async () => {
    if (!id) return;

    setSavingSleep(true);
    try {
      // Atualizar planejamento
      const { error } = await supabase
        .from('planejamentos')
        .update({
          hora_acordar: horaAcordar,
          hora_dormir: horaDormir
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar estado local
      const novasHorasSono = calcularHorasSono(horaAcordar, horaDormir);
      setHorasSono(novasHorasSono);
      setShowSleepModal(false);
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
    } finally {
      setSavingSleep(false);
    }
  };

  // Handler de logout
  const handleLogout = () => {
    // Limpar sessão de estudante
    localStorage.removeItem('ouse_student_user');
    // Limpar sessão de admin (caso exista)
    localStorage.removeItem('ouse_admin_user');
    // Forçar reload completo para limpar todo o estado
    window.location.href = '/login';
  };

  // Upload de avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !planejamento?.lead_id) return;

    setUploading(true);
    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${planejamento.lead_id}-${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage (bucket avatars)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Atualizar lead com a URL do avatar
      const { error: updateError } = await supabase
        .from('leads')
        .update({ avatar_url: publicUrl })
        .eq('id', planejamento.lead_id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center theme-transition">
        <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-8 theme-transition">
      <SEOHead title="Perfil | Ouse Passar" />

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-6">
        {/* Seção do Avatar */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-[var(--color-bg-secondary)] border-4 border-[var(--color-accent)]/30 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-[var(--color-text-muted)]" />
                )}
              </div>

              {/* Botão de upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-[var(--color-text-inverse)] animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-[var(--color-text-inverse)]" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Nome */}
            <h1 className="mt-4 text-2xl font-black text-[var(--color-text-primary)]">
              {planejamento?.nome_aluno}
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm">
              {planejamento?.email}
            </p>

            {/* Horas de Sono - Clicável */}
            <button
              onClick={() => setShowSleepModal(true)}
              className="mt-4 flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-2 hover:bg-indigo-500/30 hover:border-indigo-500/50 transition-all group"
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">{horasSono}h de sono</span>
              <Edit3 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Modal de Edição de Horários de Sono */}
        <AnimatePresence>
          {showSleepModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 w-full max-w-sm shadow-2xl theme-transition"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    Horários de Sono
                  </h3>
                  <button
                    onClick={() => setShowSleepModal(false)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Hora de Dormir */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-2">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      Hora de dormir
                    </label>
                    <input
                      type="time"
                      value={horaDormir}
                      onChange={(e) => setHoraDormir(e.target.value)}
                      className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] text-center text-lg font-mono focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {/* Hora de Acordar */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-2">
                      <Sunrise className="w-4 h-4 text-yellow-400" />
                      Hora de acordar
                    </label>
                    <input
                      type="time"
                      value={horaAcordar}
                      onChange={(e) => setHoraAcordar(e.target.value)}
                      className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] text-center text-lg font-mono focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  {/* Preview das horas de sono */}
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-indigo-400 uppercase font-bold mb-1">Horas de sono</p>
                    <p className="text-3xl font-black text-[var(--color-text-primary)]">
                      {calcularHorasSono(horaAcordar, horaDormir)}h
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowSleepModal(false)}
                      className="flex-1 py-3 border border-[var(--color-border-light)] text-[var(--color-text-secondary)] font-bold uppercase text-sm rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveSleep}
                      disabled={savingSleep}
                      className="flex-1 py-3 bg-indigo-500 text-white font-bold uppercase text-sm rounded-lg hover:bg-indigo-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingSleep ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sequência de Dias */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold">Sequência Atual</p>
                <p className="text-3xl font-black text-[var(--color-text-primary)]">{stats.sequenciaDias} <span className="text-lg text-[var(--color-text-secondary)]">dias</span></p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-xs text-purple-400 uppercase font-bold">Melhor Sequência</p>
                <p className="text-3xl font-black text-[var(--color-text-primary)]">{stats.melhorSequencia} <span className="text-lg text-[var(--color-text-secondary)]">dias</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
            Estatísticas Gerais
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-bg-secondary)]/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Dias Verdes</p>
              </div>
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{stats.diasVerdes}</p>
            </div>

            <div className="bg-[var(--color-bg-secondary)]/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Horas</p>
              </div>
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{stats.horasEstudadas}h</p>
            </div>

            <div className="bg-[var(--color-bg-secondary)]/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-3 h-3 text-purple-400" />
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Missões</p>
              </div>
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{stats.missoesTotal}</p>
            </div>

            <div className="bg-[var(--color-bg-secondary)]/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="w-3 h-3 text-cyan-400" />
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Questões</p>
              </div>
              <p className="text-3xl font-black text-[var(--color-text-primary)]">{stats.questoesTotal}</p>
            </div>
          </div>

          {/* Média de Acertos */}
          {stats.mediaAcertos !== null && (
            <div className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Média de Acertos</span>
                </div>
                <span className="text-2xl font-black text-green-400">{stats.mediaAcertos}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Conquistas (placeholder para futuro) */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Conquistas
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {/* Conquista: Primeiro Dia Verde */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.diasVerdes >= 1 ? 'bg-green-500/20 border border-green-500/30' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] opacity-40'
            }`}>
              <span className="text-2xl mb-1">🌱</span>
              <span className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium">Primeiro Passo</span>
            </div>

            {/* Conquista: 7 Dias Verdes */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.diasVerdes >= 7 ? 'bg-green-500/20 border border-green-500/30' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] opacity-40'
            }`}>
              <span className="text-2xl mb-1">🔥</span>
              <span className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium">Semana Verde</span>
            </div>

            {/* Conquista: 30 Dias Verdes */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.diasVerdes >= 30 ? 'bg-green-500/20 border border-green-500/30' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] opacity-40'
            }`}>
              <span className="text-2xl mb-1">⭐</span>
              <span className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium">Mês Verde</span>
            </div>

            {/* Conquista: 10 horas de estudo */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.horasEstudadas >= 10 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] opacity-40'
            }`}>
              <span className="text-2xl mb-1">📚</span>
              <span className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium">10 Horas</span>
            </div>

            {/* Conquista: 50 horas de estudo */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.horasEstudadas >= 50 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] opacity-40'
            }`}>
              <span className="text-2xl mb-1">🎓</span>
              <span className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium">50 Horas</span>
            </div>

            {/* Conquista: 100 questões */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.questoesTotal >= 100 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] opacity-40'
            }`}>
              <span className="text-2xl mb-1">💯</span>
              <span className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium">100 Questões</span>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-[var(--color-accent)]" />
            Configurações
          </h2>

          {/* Toggle de Tema */}
          <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)]/50 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Aparência</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {theme === 'dark' ? 'Modo Escuro ativado' : 'Modo Claro ativado'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                theme === 'dark' ? 'bg-indigo-500' : 'bg-yellow-400'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                  theme === 'dark' ? 'left-1' : 'left-7'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-yellow-500" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Botão Sair */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase text-sm rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </main>
    </div>
  );
};
