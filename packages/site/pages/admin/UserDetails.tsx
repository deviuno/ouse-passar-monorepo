import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  BookOpen,
  CheckCircle,
  Activity,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  Award,
  Zap,
  RefreshCw,
  Infinity,
  Plus,
  Check,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import {
  getUserDetails,
  updateUserProfile,
  updateUserSettings,
  rechargeBattery,
  getAvailablePreparatorios,
  addUserPreparatorio,
  UserDetailsData,
  AvailablePreparatorio,
} from '../../services/userDetailsService';

export const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<UserDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });
  const [rechargingTrailId, setRechargingTrailId] = useState<string | null>(null);

  // Modal state for adding preparatorios
  const [showAddPrepModal, setShowAddPrepModal] = useState(false);
  const [availablePreps, setAvailablePreps] = useState<AvailablePreparatorio[]>([]);
  const [loadingPreps, setLoadingPreps] = useState(false);
  const [selectedPrepId, setSelectedPrepId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [addingPrep, setAddingPrep] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    const { data: userData, error: err } = await getUserDetails(userId);

    if (err) {
      setError(err);
      toast.error(`Erro ao carregar usuário: ${err}`);
    } else if (userData) {
      setData(userData);
      setEditForm({
        name: userData.profile.name,
        email: userData.profile.email,
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!userId || !data) return;

    setSaving(true);

    const { success, error: err } = await updateUserProfile(userId, {
      name: editForm.name,
      email: editForm.email,
    });

    if (err) {
      toast.error(`Erro ao salvar: ${err}`);
    } else if (success) {
      toast.success('Perfil atualizado com sucesso!');
      setData({
        ...data,
        profile: {
          ...data.profile,
          name: editForm.name,
          email: editForm.email,
        },
      });
      setIsEditing(false);
    }

    setSaving(false);
  };

  const handleToggleActive = async (newValue: boolean) => {
    if (!userId || !data) return;

    const { success, error: err } = await updateUserSettings(userId, {
      is_active: newValue,
    });

    if (err) {
      toast.error(`Erro ao atualizar status: ${err}`);
    } else if (success) {
      toast.success(`Usuário ${newValue ? 'ativado' : 'desativado'} com sucesso!`);
      setData({
        ...data,
        profile: {
          ...data.profile,
          is_active: newValue,
        },
      });
    }
  };

  const handleToggleShowAnswers = async (newValue: boolean) => {
    if (!userId || !data) return;

    const { success, error: err } = await updateUserSettings(userId, {
      show_answers: newValue,
    });

    if (err) {
      toast.error(`Erro ao atualizar configuração: ${err}`);
    } else if (success) {
      toast.success(`Ver respostas ${newValue ? 'ativado' : 'desativado'} com sucesso!`);
      setData({
        ...data,
        profile: {
          ...data.profile,
          show_answers: newValue,
        },
      });
    }
  };

  const handleToggleOuseQuestoesSubscriber = async (newValue: boolean) => {
    if (!userId || !data) return;

    const { success, error: err } = await updateUserSettings(userId, {
      is_ouse_questoes_subscriber: newValue,
    });

    if (err) {
      toast.error(`Erro ao atualizar assinatura: ${err}`);
    } else if (success) {
      toast.success(`Assinatura Ouse Questões ${newValue ? 'ativada' : 'desativada'} com sucesso!`);
      setData({
        ...data,
        profile: {
          ...data.profile,
          is_ouse_questoes_subscriber: newValue,
        },
      });
    }
  };

  const handleRechargeBattery = async (userTrailId: string, prepId: string) => {
    if (!data) return;

    setRechargingTrailId(userTrailId);

    const { success, newBattery, error: err } = await rechargeBattery(userTrailId);

    if (err) {
      toast.error(`Erro ao recarregar bateria: ${err}`);
    } else if (success) {
      toast.success('Bateria recarregada com sucesso!');
      // Update local state
      setData({
        ...data,
        preparatorios: data.preparatorios.map((prep) =>
          prep.id === prepId && prep.user_trail_id === userTrailId
            ? { ...prep, battery_current: newBattery }
            : prep
        ),
      });
    }

    setRechargingTrailId(null);
  };

  const handleOpenAddPrepModal = async () => {
    setShowAddPrepModal(true);
    setSelectedPrepId(null);
    setSelectedProducts([]);
    setLoadingPreps(true);

    const { data: preps, error: err } = await getAvailablePreparatorios();
    if (err) {
      toast.error(`Erro ao carregar preparatórios: ${err}`);
    } else {
      setAvailablePreps(preps || []);
    }
    setLoadingPreps(false);
  };

  const handleSelectPrep = (prepId: string) => {
    setSelectedPrepId(prepId);
    setSelectedProducts([]);
  };

  const handleToggleProduct = (productType: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productType)
        ? prev.filter((p) => p !== productType)
        : [...prev, productType]
    );
  };

  const handleAddPreparatorio = async () => {
    if (!userId || !selectedPrepId || selectedProducts.length === 0) return;

    setAddingPrep(true);

    const { success, error: err } = await addUserPreparatorio(
      userId,
      selectedPrepId,
      selectedProducts
    );

    if (err) {
      toast.error(`Erro ao adicionar preparatório: ${err}`);
    } else if (success) {
      toast.success('Preparatório adicionado com sucesso!');
      setShowAddPrepModal(false);
      loadUserDetails(); // Reload to show the new preparatorio
    }

    setAddingPrep(false);
  };

  const selectedPrep = availablePreps.find((p) => p.id === selectedPrepId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-red-400 font-bold">Erro ao carregar usuário</p>
            <p className="text-red-300 text-sm mt-1">{error || 'Usuário não encontrado'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, preparatorios, recentActivity, missionProgress } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-bold uppercase tracking-wide">Voltar para Usuários</span>
      </button>

      {/* Header Card */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-yellow/30 bg-brand-dark flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-500" />
              )}
            </div>

            {/* Info */}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-xl font-bold mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-white mb-2">{profile.name}</h1>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  {profile.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Subscriber toggle + Actions */}
          <div className="flex items-center gap-6">
            {/* Ouse Questões Subscriber Toggle */}
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-dark/50 rounded-sm border border-white/10">
              <div className="text-right">
                <p className="text-white font-bold text-sm">Assinante Ouse Questões</p>
                <p className="text-gray-500 text-xs">
                  {profile.is_ouse_questoes_subscriber ? 'Acesso ilimitado à prática' : 'Sem assinatura'}
                </p>
              </div>
              <button
                onClick={() => handleToggleOuseQuestoesSubscriber(!profile.is_ouse_questoes_subscriber)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  profile.is_ouse_questoes_subscriber ? 'bg-brand-yellow' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    profile.is_ouse_questoes_subscriber ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        name: profile.name,
                        email: profile.email,
                      });
                    }}
                    disabled={saving}
                    className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2 hover:text-white hover:border-white/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-6">
        <h3 className="text-white font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-yellow" />
          Configurações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toggle Ativo/Inativo */}
          <div className="flex items-center justify-between p-4 bg-brand-dark/50 rounded-sm">
            <div>
              <p className="text-white font-bold text-sm">Status do Usuário</p>
              <p className="text-gray-500 text-xs mt-1">
                {profile.is_active ? 'Usuário ativo e pode acessar o sistema' : 'Usuário inativo e sem acesso'}
              </p>
            </div>
            <button
              onClick={() => handleToggleActive(!profile.is_active)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                profile.is_active ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  profile.is_active ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle Ver Respostas */}
          <div className="flex items-center justify-between p-4 bg-brand-dark/50 rounded-sm">
            <div>
              <p className="text-white font-bold text-sm">Ver Respostas</p>
              <p className="text-gray-500 text-xs mt-1">
                {profile.show_answers
                  ? 'Usuário vê alternativa correta marcada com estrela'
                  : 'Usuário não vê qual alternativa está correta'}
              </p>
            </div>
            <button
              onClick={() => handleToggleShowAnswers(!profile.show_answers)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                profile.show_answers ? 'bg-brand-yellow' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  profile.show_answers ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Missões */}
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-brand-yellow" />
            <span className="text-gray-400 text-sm font-bold uppercase">Total Missões</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalMissions}</p>
        </div>

        {/* Missões Completadas */}
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-400 text-sm font-bold uppercase">Completadas</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completedMissions}</p>
        </div>

        {/* Taxa de Conclusão */}
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-gray-400 text-sm font-bold uppercase">Taxa Conclusão</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completionRate}%</p>
        </div>

        {/* Nota Média */}
        <div className="bg-brand-card border border-white/5 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-500" />
            <span className="text-gray-400 text-sm font-bold uppercase">Nota Média</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.averageScore}</p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-pink-500" />
          <span className="text-gray-400 text-sm font-bold uppercase">Última Atividade</span>
        </div>
        <p className="text-lg font-bold text-white">
          {new Date(stats.lastActivity).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(stats.lastActivity).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preparatorios */}
        <div className="bg-brand-card border border-white/5 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-yellow" />
              <h3 className="text-white font-bold uppercase tracking-wide">Preparatórios Contratados</h3>
            </div>
            <button
              onClick={handleOpenAddPrepModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow text-black text-sm font-bold rounded hover:bg-yellow-400 transition-colors"
            >
              <Plus size={16} />
              Novo
            </button>
          </div>

          {preparatorios.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum preparatório contratado</p>
          ) : (
            <div className="space-y-3">
              {preparatorios.map((prep) => (
                <div
                  key={`${prep.id}-${prep.user_trail_id || 'default'}`}
                  className="flex items-start justify-between gap-4 p-4 bg-brand-dark/50 rounded-sm"
                >
                  {/* Left side - Info */}
                  <div className="flex-1">
                    {/* Title */}
                    <p className="text-white font-bold text-base mb-1">{prep.nome}</p>

                    {/* Status + Purchased date */}
                    <p className="text-sm mb-3">
                      <span className="text-green-400">Ativo</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-500">Adquirido em {new Date(prep.purchased_at).toLocaleDateString('pt-BR')}</span>
                    </p>

                    {/* Badge + Unlimited indicator */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                        {prep.product_type}
                      </span>
                      {prep.has_unlimited_battery && (
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded flex items-center gap-1">
                          <Infinity className="w-3 h-3" />
                          Ilimitado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Battery block */}
                  {prep.user_trail_id && prep.battery_current !== undefined && (
                    <div className="flex flex-col items-center bg-brand-dark rounded-lg p-3 min-w-[100px]">
                      {/* Battery amount */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className={`w-5 h-5 ${prep.battery_current > 20 ? 'text-yellow-400' : 'text-red-400'}`} />
                        <span className={`font-bold text-lg ${prep.battery_current > 20 ? 'text-white' : 'text-red-400'}`}>
                          {prep.battery_current}/100
                        </span>
                      </div>

                      {/* Recharge button */}
                      <button
                        onClick={() => handleRechargeBattery(prep.user_trail_id!, prep.id)}
                        disabled={rechargingTrailId === prep.user_trail_id || prep.battery_current === 100}
                        className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                        title="Recarregar bateria para o máximo"
                      >
                        {rechargingTrailId === prep.user_trail_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Recarregar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-brand-card border border-white/5 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand-yellow" />
            <h3 className="text-white font-bold uppercase tracking-wide">Atividade Recente</h3>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentActivity.slice(0, 15).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-2 hover:bg-brand-dark/30 rounded-sm"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'mission_completed' ? 'bg-green-500' :
                    activity.type === 'question_answered' ? 'bg-blue-500' :
                    activity.type === 'achievement_earned' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(activity.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mission Progress */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-brand-yellow" />
          <h3 className="text-white font-bold uppercase tracking-wide">Progresso em Missões</h3>
        </div>

        {missionProgress.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma missão iniciada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">Missão</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">Preparatório</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Rodada</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Nota</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">Concluída em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {missionProgress.map((mission) => (
                  <tr key={mission.mission_id} className="hover:bg-white/5">
                    <td className="py-3 px-4 text-white text-sm">{mission.mission_title}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{mission.preparatorio_nome}</td>
                    <td className="py-3 px-4 text-center text-gray-400 text-sm">{mission.rodada_numero}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                          mission.status === 'completed'
                            ? 'bg-green-500/20 text-green-500'
                            : mission.status === 'in_progress'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {mission.status === 'completed' ? 'Completa' : 'Em Progresso'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-white font-bold">
                      {mission.score !== undefined ? `${mission.score}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {mission.completed_at
                        ? new Date(mission.completed_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Adicionar Preparatório */}
      {showAddPrepModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">Adicionar Preparatório</h2>
              <button
                onClick={() => setShowAddPrepModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingPreps ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
                </div>
              ) : (
                <>
                  {/* Step 1: Select Preparatorio */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                      1. Selecione o Preparatório
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availablePreps.map((prep) => (
                        <button
                          key={prep.id}
                          onClick={() => handleSelectPrep(prep.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                            selectedPrepId === prep.id
                              ? 'border-brand-yellow bg-brand-yellow/10'
                              : 'border-white/10 hover:border-white/30 bg-brand-dark/50'
                          }`}
                        >
                          {prep.logo_url ? (
                            <img
                              src={prep.logo_url}
                              alt={prep.nome}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-brand-yellow/20 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-brand-yellow" />
                            </div>
                          )}
                          <span className={`text-sm font-medium ${selectedPrepId === prep.id ? 'text-brand-yellow' : 'text-white'}`}>
                            {prep.nome}
                          </span>
                          {selectedPrepId === prep.id && (
                            <Check className="w-4 h-4 text-brand-yellow ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Select Products */}
                  {selectedPrep && (
                    <div className="border-t border-white/10 pt-4">
                      <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                        2. Selecione os Produtos
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedPrep.products.map((product) => (
                          <button
                            key={product.type}
                            onClick={() => product.available && handleToggleProduct(product.type)}
                            disabled={!product.available}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                              !product.available
                                ? 'border-white/5 bg-brand-dark/30 cursor-not-allowed opacity-50'
                                : selectedProducts.includes(product.type)
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-white/10 hover:border-white/30 bg-brand-dark/50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center ${
                                selectedProducts.includes(product.type)
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-white/30'
                              }`}
                            >
                              {selectedProducts.includes(product.type) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                !product.available
                                  ? 'text-gray-500'
                                  : selectedProducts.includes(product.type)
                                  ? 'text-green-400 font-medium'
                                  : 'text-white'
                              }`}
                            >
                              {product.name}
                            </span>
                            {!product.available && (
                              <span className="text-xs text-gray-500 ml-auto">(Não disponível)</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setShowAddPrepModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPreparatorio}
                disabled={!selectedPrepId || selectedProducts.length === 0 || addingPrep}
                className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-bold rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingPrep ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
