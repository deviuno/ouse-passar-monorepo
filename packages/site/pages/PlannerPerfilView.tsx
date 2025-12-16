import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Calendar,
  Target,
  FileText,
  ClipboardCheck,
  Menu as MenuIcon,
  X,
  User,
  Camera,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Flame,
  Moon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/SEOHead';
import { plannerService } from '../services/plannerService';
import { Planejamento } from '../lib/database.types';

// Componente Principal
export const PlannerPerfilView: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [horasSono, setHorasSono] = useState(8);

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
  const navLinks = [
    { label: 'Calendário', path: `/planejador-semanal/${slug}/${id}`, icon: Calendar, active: false },
    { label: 'Planner', path: `/planner/${slug}/${id}`, icon: ClipboardCheck, active: false },
    { label: 'Missões', path: `/planejamento/${slug}/${id}`, icon: Target, active: false },
    { label: 'Edital', path: `/edital-verticalizado/${slug}/${id}`, icon: FileText, active: false },
  ];

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

          // Calcular horas de sono
          if (planData.hora_acordar && planData.hora_dormir) {
            const [acordarH, acordarM] = planData.hora_acordar.split(':').map(Number);
            const [dormirH, dormirM] = planData.hora_dormir.split(':').map(Number);
            const acordarMin = acordarH * 60 + acordarM;
            const dormirMin = dormirH * 60 + dormirM;
            let sonoMin = acordarMin - dormirMin;
            if (sonoMin < 0) sonoMin += 24 * 60; // Se passa da meia-noite
            setHorasSono(Math.round(sonoMin / 60 * 10) / 10);
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
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker text-white pb-8">
      <SEOHead title="Perfil | Ouse Passar" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-brand-yellow font-black text-lg uppercase tracking-tight">
                {planejamento?.nome_aluno}
              </span>
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

            {/* Botão Perfil (desktop) - Active */}
            <div className="hidden md:flex items-center justify-center w-9 h-9 bg-brand-yellow/20 border border-brand-yellow/50 rounded-lg text-brand-yellow">
              <User className="w-5 h-5" />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-brand-yellow p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-brand-card border-b border-white/10"
            >
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
                    </button>
                  );
                })}
                {/* Perfil (ativo) */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 transition-all border-brand-yellow text-brand-yellow bg-white/5"
                >
                  <User className="w-4 h-4" />
                  Perfil
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-6">
        {/* Seção do Avatar */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-brand-dark border-4 border-brand-yellow/30 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-600" />
                )}
              </div>

              {/* Botão de upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-brand-darker animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-brand-darker" />
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
            <h1 className="mt-4 text-2xl font-black text-white">
              {planejamento?.nome_aluno}
            </h1>
            <p className="text-gray-500 text-sm">
              {planejamento?.email}
            </p>

            {/* Horas de Sono */}
            <div className="mt-4 flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">{horasSono}h de sono</span>
            </div>
          </div>
        </div>

        {/* Sequência de Dias */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold">Sequência Atual</p>
                <p className="text-3xl font-black text-white">{stats.sequenciaDias} <span className="text-lg text-gray-400">dias</span></p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-xs text-purple-400 uppercase font-bold">Melhor Sequência</p>
                <p className="text-3xl font-black text-white">{stats.melhorSequencia} <span className="text-lg text-gray-400">dias</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-yellow" />
            Estatísticas Gerais
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-brand-dark/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <p className="text-xs text-gray-500 uppercase font-bold">Dias Verdes</p>
              </div>
              <p className="text-3xl font-black text-white">{stats.diasVerdes}</p>
            </div>

            <div className="bg-brand-dark/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <p className="text-xs text-gray-500 uppercase font-bold">Horas</p>
              </div>
              <p className="text-3xl font-black text-white">{stats.horasEstudadas}h</p>
            </div>

            <div className="bg-brand-dark/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-3 h-3 text-purple-400" />
                <p className="text-xs text-gray-500 uppercase font-bold">Missões</p>
              </div>
              <p className="text-3xl font-black text-white">{stats.missoesTotal}</p>
            </div>

            <div className="bg-brand-dark/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="w-3 h-3 text-cyan-400" />
                <p className="text-xs text-gray-500 uppercase font-bold">Questões</p>
              </div>
              <p className="text-3xl font-black text-white">{stats.questoesTotal}</p>
            </div>
          </div>

          {/* Média de Acertos */}
          {stats.mediaAcertos !== null && (
            <div className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Média de Acertos</span>
                </div>
                <span className="text-2xl font-black text-green-400">{stats.mediaAcertos}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Conquistas (placeholder para futuro) */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Conquistas
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {/* Conquista: Primeiro Dia Verde */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.diasVerdes >= 1 ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10 opacity-40'
            }`}>
              <span className="text-2xl mb-1">🌱</span>
              <span className="text-[10px] text-center text-gray-400 font-medium">Primeiro Passo</span>
            </div>

            {/* Conquista: 7 Dias Verdes */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.diasVerdes >= 7 ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10 opacity-40'
            }`}>
              <span className="text-2xl mb-1">🔥</span>
              <span className="text-[10px] text-center text-gray-400 font-medium">Semana Verde</span>
            </div>

            {/* Conquista: 30 Dias Verdes */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.diasVerdes >= 30 ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10 opacity-40'
            }`}>
              <span className="text-2xl mb-1">⭐</span>
              <span className="text-[10px] text-center text-gray-400 font-medium">Mês Verde</span>
            </div>

            {/* Conquista: 10 horas de estudo */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.horasEstudadas >= 10 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-white/10 opacity-40'
            }`}>
              <span className="text-2xl mb-1">📚</span>
              <span className="text-[10px] text-center text-gray-400 font-medium">10 Horas</span>
            </div>

            {/* Conquista: 50 horas de estudo */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.horasEstudadas >= 50 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-white/10 opacity-40'
            }`}>
              <span className="text-2xl mb-1">🎓</span>
              <span className="text-[10px] text-center text-gray-400 font-medium">50 Horas</span>
            </div>

            {/* Conquista: 100 questões */}
            <div className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 ${
              stats.questoesTotal >= 100 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 border border-white/10 opacity-40'
            }`}>
              <span className="text-2xl mb-1">💯</span>
              <span className="text-[10px] text-center text-gray-400 font-medium">100 Questões</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
