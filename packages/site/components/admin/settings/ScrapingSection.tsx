import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Globe,
  Users,
  FolderOpen,
  Play,
  Pause,
  ExternalLink,
  Key,
  Mail,
  TestTube,
  Target,
  RotateCcw,
  Calendar,
  FileText,
} from 'lucide-react';
import { useToast } from '../../ui/Toast';
import * as tecScraperService from '../../../services/tecScraperService';
import {
  TecAccount,
  TecCaderno,
  TecScrapingLog,
  TecScraperSettings,
  getStatusColor,
  getStatusBgColor,
  getStatusLabel,
  getLoginStatusColor,
  getLoginStatusLabel,
  getLogTypeColor,
  formatProgress,
  formatNumber,
  formatDateTime,
  calculateElapsedTime,
} from '../../../services/tecScraperService';
import { ConfirmDeleteModal } from '../../ui/ConfirmDeleteModal';

export function ScrapingSection() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'cadernos' | 'contas' | 'configuracoes'>('cadernos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Cadernos state
  const [cadernos, setCadernos] = useState<TecCaderno[]>([]);
  const [showAddCaderno, setShowAddCaderno] = useState(false);
  const [newCaderno, setNewCaderno] = useState({ name: '', url: '', priority: 0 });
  const [addingCaderno, setAddingCaderno] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<TecScrapingLog[]>([]);

  // Contas state
  const [accounts, setAccounts] = useState<TecAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: '', password: '', cookies: '' });
  const [addingAccount, setAddingAccount] = useState(false);

  // Delete confirmation modals
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'caderno' | 'account' | null;
    id: string | null;
    name: string;
  }>({ isOpen: false, type: null, id: null, name: '' });
  const [showImportCookies, setShowImportCookies] = useState<string | null>(null);
  const [importCookiesValue, setImportCookiesValue] = useState('');

  // Queue status
  const [queueStatus, setQueueStatus] = useState<{
    queuedCount: number;
    currentlyRunning: { id: string; name: string } | null;
    isProcessing: boolean;
  } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<TecScraperSettings | null>(null);

  useEffect(() => {
    loadData();
    // Set up polling for progress
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [cadernosData, accountsData, queueData, settingsData] = await Promise.all([
        tecScraperService.getCadernos(),
        tecScraperService.getAccounts(),
        tecScraperService.getQueueStatus(),
        tecScraperService.getScraperSettings(),
      ]);
      setCadernos(cadernosData);
      setAccounts(accountsData);
      setQueueStatus(queueData);
      if (settingsData) setSettings(settingsData);
    } catch (error) {
      console.error('Error loading scraper data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Caderno actions
  const handleAddCaderno = async () => {
    if (!newCaderno.name.trim() || !newCaderno.url.trim()) {
      toast.error('Nome e URL são obrigatórios');
      return;
    }
    setAddingCaderno(true);
    const result = await tecScraperService.createCaderno(newCaderno);
    if (result.success) {
      toast.success('Caderno adicionado à fila');
      setNewCaderno({ name: '', url: '', priority: 0 });
      setShowAddCaderno(false);
      loadData();
    } else {
      toast.error(result.error || 'Erro ao adicionar caderno');
    }
    setAddingCaderno(false);
  };

  const handleDeleteCaderno = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, type: 'caderno', id, name });
  };

  const confirmDeleteCaderno = async () => {
    if (!deleteModal.id) return;
    setActionLoading(deleteModal.id);
    const result = await tecScraperService.deleteCaderno(deleteModal.id);
    if (result.success) {
      toast.success('Caderno removido');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao remover caderno');
    }
    setActionLoading(null);
    setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
  };

  const handleStartCaderno = async (id: string) => {
    setActionLoading(id);
    const result = await tecScraperService.startCaderno(id);
    if (result.success) {
      toast.success('Extração iniciada');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao iniciar extração');
    }
    setActionLoading(null);
  };

  const handlePauseCaderno = async (id: string) => {
    setActionLoading(id);
    const result = await tecScraperService.pauseCaderno(id);
    if (result.success) {
      toast.success('Extração pausada');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao pausar extração');
    }
    setActionLoading(null);
  };

  const handleResumeCaderno = async (id: string) => {
    setActionLoading(id);
    const result = await tecScraperService.resumeCaderno(id);
    if (result.success) {
      toast.success('Extração retomada');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao retomar extração');
    }
    setActionLoading(null);
  };

  const handleViewLogs = async (cadernoId: string) => {
    if (showLogs === cadernoId) {
      setShowLogs(null);
      return;
    }
    const logsData = await tecScraperService.getCadernoLogs(cadernoId, 50);
    setLogs(logsData);
    setShowLogs(cadernoId);
  };

  // Account actions
  const handleAddAccount = async () => {
    if (!newAccount.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    setAddingAccount(true);
    const result = await tecScraperService.createAccount(newAccount);
    if (result.success) {
      toast.success('Conta adicionada');
      setNewAccount({ email: '', password: '', cookies: '' });
      setShowAddAccount(false);
      loadData();
    } else {
      toast.error(result.error || 'Erro ao adicionar conta');
    }
    setAddingAccount(false);
  };

  const handleDeleteAccount = (id: string, email: string) => {
    setDeleteModal({ isOpen: true, type: 'account', id, name: email });
  };

  const confirmDeleteAccount = async () => {
    if (!deleteModal.id) return;
    setActionLoading(deleteModal.id);
    const result = await tecScraperService.deleteAccount(deleteModal.id);
    if (result.success) {
      toast.success('Conta removida');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao remover conta');
    }
    setActionLoading(null);
    setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
  };

  const handleToggleAccountActive = async (id: string, currentActive: boolean) => {
    setActionLoading(id);
    const result = await tecScraperService.updateAccount(id, { is_active: !currentActive });
    if (result.success) {
      toast.success(currentActive ? 'Conta desativada' : 'Conta ativada');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao alterar status da conta');
    }
    setActionLoading(null);
  };

  const handleTestLogin = async (id: string) => {
    setActionLoading(id);
    const result = await tecScraperService.testAccountLogin(id);
    if (result.success) {
      toast.success(result.message || 'Login testado');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao testar login');
    }
    setActionLoading(null);
  };

  const handleImportCookies = async (id: string) => {
    if (!importCookiesValue.trim()) {
      toast.error('Cole o JSON dos cookies');
      return;
    }
    setActionLoading(id);
    const result = await tecScraperService.importAccountCookies(id, importCookiesValue);
    if (result.success) {
      toast.success(result.message || 'Cookies importados');
      setShowImportCookies(null);
      setImportCookiesValue('');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao importar cookies');
    }
    setActionLoading(null);
  };

  const handleProcessQueue = async () => {
    const result = await tecScraperService.processQueue();
    if (result.success) {
      toast.success('Fila de processamento iniciada');
      loadData();
    } else {
      toast.error(result.error || 'Erro ao processar fila');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const result = await tecScraperService.updateScraperSettings(settings);
    if (result.success) {
      toast.success('Configurações salvas com sucesso');
      if (result.settings) setSettings(result.settings);
    } else {
      toast.error(result.error || 'Erro ao salvar configurações');
    }
    setSavingSettings(false);
  };

  const updateSetting = <K extends keyof TecScraperSettings>(key: K, value: TecScraperSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="bg-brand-card border border-white/10 rounded-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" />
          <span className="ml-2 text-gray-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-card border border-white/10 rounded-sm">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-brand-yellow/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-brand-yellow" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Scraper de Questões</h2>
                <p className="text-gray-400 text-sm">Gestão de cadernos e contas para extração de questões</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Queue Status */}
        {queueStatus && (
          <div className="px-6 py-3 bg-brand-dark/50 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-400">
                Na fila: <span className="text-white font-medium">{queueStatus.queuedCount}</span>
              </span>
              {queueStatus.currentlyRunning && (
                <span className="text-gray-400">
                  Em execução: <span className="text-yellow-400 font-medium">{queueStatus.currentlyRunning.name}</span>
                </span>
              )}
            </div>
            {queueStatus.queuedCount > 0 && !queueStatus.isProcessing && (
              <button
                onClick={handleProcessQueue}
                className="flex items-center gap-2 px-3 py-1 bg-brand-yellow/20 hover:bg-brand-yellow/30 text-brand-yellow rounded-sm text-sm"
              >
                <Play className="w-4 h-4" />
                Processar Fila
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('cadernos')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'cadernos'
              ? 'text-brand-yellow border-b-2 border-brand-yellow bg-brand-yellow/5'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <FolderOpen className="w-4 h-4" />
            Cadernos
          </button>
          <button
            onClick={() => setActiveTab('contas')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'contas'
              ? 'text-brand-yellow border-b-2 border-brand-yellow bg-brand-yellow/5'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <Users className="w-4 h-4" />
            Contas
          </button>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'configuracoes'
              ? 'text-brand-yellow border-b-2 border-brand-yellow bg-brand-yellow/5'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Configurações
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'cadernos' ? (
        <CadernosTab
          cadernos={cadernos}
          showAddCaderno={showAddCaderno}
          setShowAddCaderno={setShowAddCaderno}
          newCaderno={newCaderno}
          setNewCaderno={setNewCaderno}
          addingCaderno={addingCaderno}
          actionLoading={actionLoading}
          showLogs={showLogs}
          logs={logs}
          handleAddCaderno={handleAddCaderno}
          handleStartCaderno={handleStartCaderno}
          handlePauseCaderno={handlePauseCaderno}
          handleResumeCaderno={handleResumeCaderno}
          handleDeleteCaderno={handleDeleteCaderno}
          handleViewLogs={handleViewLogs}
        />
      ) : activeTab === 'contas' ? (
        <ContasTab
          accounts={accounts}
          showAddAccount={showAddAccount}
          setShowAddAccount={setShowAddAccount}
          newAccount={newAccount}
          setNewAccount={setNewAccount}
          addingAccount={addingAccount}
          actionLoading={actionLoading}
          showImportCookies={showImportCookies}
          setShowImportCookies={setShowImportCookies}
          importCookiesValue={importCookiesValue}
          setImportCookiesValue={setImportCookiesValue}
          handleAddAccount={handleAddAccount}
          handleDeleteAccount={handleDeleteAccount}
          handleToggleAccountActive={handleToggleAccountActive}
          handleTestLogin={handleTestLogin}
          handleImportCookies={handleImportCookies}
        />
      ) : (
        <ConfiguracoesTab
          settings={settings}
          savingSettings={savingSettings}
          updateSetting={updateSetting}
          handleSaveSettings={handleSaveSettings}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={deleteModal.type === 'caderno' ? confirmDeleteCaderno : confirmDeleteAccount}
        title={deleteModal.type === 'caderno' ? 'Remover Caderno' : 'Remover Conta'}
        itemName={deleteModal.name}
        message={deleteModal.type === 'caderno'
          ? `Tem certeza que deseja remover o caderno "${deleteModal.name}"?`
          : `Tem certeza que deseja remover a conta "${deleteModal.name}"?`
        }
        isLoading={actionLoading === deleteModal.id}
      />
    </div>
  );
}

// ============================================================================
// CADERNOS TAB
// ============================================================================

interface CadernosTabProps {
  cadernos: TecCaderno[];
  showAddCaderno: boolean;
  setShowAddCaderno: (show: boolean) => void;
  newCaderno: { name: string; url: string; priority: number };
  setNewCaderno: (caderno: { name: string; url: string; priority: number }) => void;
  addingCaderno: boolean;
  actionLoading: string | null;
  showLogs: string | null;
  logs: TecScrapingLog[];
  handleAddCaderno: () => void;
  handleStartCaderno: (id: string) => void;
  handlePauseCaderno: (id: string) => void;
  handleResumeCaderno: (id: string) => void;
  handleDeleteCaderno: (id: string, name: string) => void;
  handleViewLogs: (id: string) => void;
}

function CadernosTab({
  cadernos,
  showAddCaderno,
  setShowAddCaderno,
  newCaderno,
  setNewCaderno,
  addingCaderno,
  actionLoading,
  showLogs,
  logs,
  handleAddCaderno,
  handleStartCaderno,
  handlePauseCaderno,
  handleResumeCaderno,
  handleDeleteCaderno,
  handleViewLogs,
}: CadernosTabProps) {
  return (
    <div className="space-y-4">
      {/* Add Caderno Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddCaderno(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-medium rounded-sm hover:bg-brand-yellow-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Caderno
        </button>
      </div>

      {/* Add Caderno Modal */}
      {showAddCaderno && (
        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Caderno</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome do Caderno</label>
              <input
                type="text"
                value={newCaderno.name}
                onChange={(e) => setNewCaderno({ ...newCaderno, name: e.target.value })}
                placeholder="Ex: Policial Geral"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL do TecConcursos</label>
              <input
                type="text"
                value={newCaderno.url}
                onChange={(e) => setNewCaderno({ ...newCaderno, url: e.target.value })}
                placeholder="https://www.tecconcursos.com.br/s/..."
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
              <input
                type="number"
                value={newCaderno.priority}
                onChange={(e) => setNewCaderno({ ...newCaderno, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Maior número = maior prioridade</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddCaderno}
              disabled={addingCaderno}
              className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-medium rounded-sm hover:bg-brand-yellow-hover disabled:opacity-50"
            >
              {addingCaderno ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </button>
            <button
              onClick={() => setShowAddCaderno(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cadernos List */}
      <div className="space-y-3">
        {cadernos.length === 0 ? (
          <div className="bg-brand-card border border-white/10 rounded-sm p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum caderno cadastrado</p>
            <p className="text-sm text-gray-500 mt-1">Adicione um caderno para começar a extração</p>
          </div>
        ) : (
          cadernos.map((caderno) => (
            <CadernoCard
              key={caderno.id}
              caderno={caderno}
              actionLoading={actionLoading}
              showLogs={showLogs}
              logs={logs}
              handleStartCaderno={handleStartCaderno}
              handlePauseCaderno={handlePauseCaderno}
              handleResumeCaderno={handleResumeCaderno}
              handleDeleteCaderno={handleDeleteCaderno}
              handleViewLogs={handleViewLogs}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CADERNO CARD
// ============================================================================

interface CadernoCardProps {
  caderno: TecCaderno;
  actionLoading: string | null;
  showLogs: string | null;
  logs: TecScrapingLog[];
  handleStartCaderno: (id: string) => void;
  handlePauseCaderno: (id: string) => void;
  handleResumeCaderno: (id: string) => void;
  handleDeleteCaderno: (id: string, name: string) => void;
  handleViewLogs: (id: string) => void;
}

function CadernoCard({
  caderno,
  actionLoading,
  showLogs,
  logs,
  handleStartCaderno,
  handlePauseCaderno,
  handleResumeCaderno,
  handleDeleteCaderno,
  handleViewLogs,
}: CadernoCardProps) {
  return (
    <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="text-white font-medium">{caderno.name}</h4>
              <span className={`px-2 py-0.5 text-xs rounded-sm ${getStatusBgColor(caderno.status)} ${getStatusColor(caderno.status)}`}>
                {getStatusLabel(caderno.status)}
              </span>
            </div>
            <a
              href={caderno.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-brand-yellow flex items-center gap-1 mt-1"
            >
              {caderno.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">
              Progresso: {formatNumber(caderno.collected_questions)} / {formatNumber(caderno.total_questions)} questões
            </span>
            <span className="text-white font-medium">
              {formatProgress(caderno.collected_questions, caderno.total_questions)}
            </span>
          </div>
          <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-yellow transition-all duration-300"
              style={{
                width: caderno.total_questions > 0
                  ? `${(caderno.collected_questions / caderno.total_questions) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Time Info */}
        {caderno.started_at && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Iniciado: {formatDateTime(caderno.started_at)}
            </span>
            {caderno.status === 'running' && (
              <span>Tempo: {calculateElapsedTime(caderno.started_at)}</span>
            )}
            {caderno.completed_at && (
              <span>Concluído: {formatDateTime(caderno.completed_at)}</span>
            )}
          </div>
        )}

        {/* Error */}
        {caderno.last_error && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-sm">
            <p className="text-sm text-red-400">{caderno.last_error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          {caderno.status === 'queued' && (
            <button
              onClick={() => handleStartCaderno(caderno.id)}
              disabled={actionLoading === caderno.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-sm text-sm disabled:opacity-50"
            >
              {actionLoading === caderno.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              Iniciar
            </button>
          )}
          {caderno.status === 'running' && (
            <button
              onClick={() => handlePauseCaderno(caderno.id)}
              disabled={actionLoading === caderno.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-sm text-sm disabled:opacity-50"
            >
              {actionLoading === caderno.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Pause className="w-3 h-3" />
              )}
              Pausar
            </button>
          )}
          {caderno.status === 'paused' && (
            <button
              onClick={() => handleResumeCaderno(caderno.id)}
              disabled={actionLoading === caderno.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-sm text-sm disabled:opacity-50"
            >
              {actionLoading === caderno.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              Retomar
            </button>
          )}
          {(caderno.status === 'completed' || caderno.status === 'error') && (
            <button
              onClick={() => handleResumeCaderno(caderno.id)}
              disabled={actionLoading === caderno.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-sm text-sm disabled:opacity-50"
            >
              {actionLoading === caderno.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              Reiniciar
            </button>
          )}
          <button
            onClick={() => handleViewLogs(caderno.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-sm text-sm"
          >
            <FileText className="w-3 h-3" />
            Logs
          </button>
          <button
            onClick={() => handleDeleteCaderno(caderno.id, caderno.name)}
            disabled={actionLoading === caderno.id}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-sm text-sm ml-auto disabled:opacity-50"
          >
            {actionLoading === caderno.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Remover
          </button>
        </div>
      </div>

      {/* Logs Panel */}
      {showLogs === caderno.id && (
        <div className="border-t border-white/10 bg-brand-dark/50 p-4 max-h-64 overflow-y-auto">
          <h5 className="text-sm font-medium text-gray-300 mb-2">Logs Recentes</h5>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum log encontrado</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="text-xs flex gap-2">
                  <span className="text-gray-500">{formatDateTime(log.created_at)}</span>
                  <span className={getLogTypeColor(log.log_type)}>[{log.log_type.toUpperCase()}]</span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONTAS TAB
// ============================================================================

interface ContasTabProps {
  accounts: TecAccount[];
  showAddAccount: boolean;
  setShowAddAccount: (show: boolean) => void;
  newAccount: { email: string; password: string; cookies: string };
  setNewAccount: (account: { email: string; password: string; cookies: string }) => void;
  addingAccount: boolean;
  actionLoading: string | null;
  showImportCookies: string | null;
  setShowImportCookies: (id: string | null) => void;
  importCookiesValue: string;
  setImportCookiesValue: (value: string) => void;
  handleAddAccount: () => void;
  handleDeleteAccount: (id: string, email: string) => void;
  handleToggleAccountActive: (id: string, currentActive: boolean) => void;
  handleTestLogin: (id: string) => void;
  handleImportCookies: (id: string) => void;
}

function ContasTab({
  accounts,
  showAddAccount,
  setShowAddAccount,
  newAccount,
  setNewAccount,
  addingAccount,
  actionLoading,
  showImportCookies,
  setShowImportCookies,
  importCookiesValue,
  setImportCookiesValue,
  handleAddAccount,
  handleDeleteAccount,
  handleToggleAccountActive,
  handleTestLogin,
  handleImportCookies,
}: ContasTabProps) {
  return (
    <div className="space-y-4">
      {/* Add Account Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddAccount(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-medium rounded-sm hover:bg-brand-yellow-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Conta
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Conta TecConcursos</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={newAccount.email}
                onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha (opcional)</label>
              <input
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cookies (JSON - opcional)</label>
              <textarea
                value={newAccount.cookies}
                onChange={(e) => setNewAccount({ ...newAccount, cookies: e.target.value })}
                placeholder='[{"name": "...", "value": "...", ...}]'
                rows={3}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a extensão do Chrome para exportar cookies. O login por cookies é mais confiável.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddAccount}
              disabled={addingAccount}
              className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-medium rounded-sm hover:bg-brand-yellow-hover disabled:opacity-50"
            >
              {addingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </button>
            <button
              onClick={() => setShowAddAccount(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="bg-brand-card border border-white/10 rounded-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma conta cadastrada</p>
            <p className="text-sm text-gray-500 mt-1">Adicione uma conta do TecConcursos para começar</p>
          </div>
        ) : (
          accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              actionLoading={actionLoading}
              showImportCookies={showImportCookies}
              setShowImportCookies={setShowImportCookies}
              importCookiesValue={importCookiesValue}
              setImportCookiesValue={setImportCookiesValue}
              handleDeleteAccount={handleDeleteAccount}
              handleToggleAccountActive={handleToggleAccountActive}
              handleTestLogin={handleTestLogin}
              handleImportCookies={handleImportCookies}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ACCOUNT CARD
// ============================================================================

interface AccountCardProps {
  account: TecAccount;
  actionLoading: string | null;
  showImportCookies: string | null;
  setShowImportCookies: (id: string | null) => void;
  importCookiesValue: string;
  setImportCookiesValue: (value: string) => void;
  handleDeleteAccount: (id: string, email: string) => void;
  handleToggleAccountActive: (id: string, currentActive: boolean) => void;
  handleTestLogin: (id: string) => void;
  handleImportCookies: (id: string) => void;
}

function AccountCard({
  account,
  actionLoading,
  showImportCookies,
  setShowImportCookies,
  importCookiesValue,
  setImportCookiesValue,
  handleDeleteAccount,
  handleToggleAccountActive,
  handleTestLogin,
  handleImportCookies,
}: AccountCardProps) {
  return (
    <div className="bg-brand-card border border-white/10 rounded-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{account.email}</span>
              <button
                type="button"
                onClick={() => handleToggleAccountActive(account.id, account.is_active)}
                disabled={actionLoading === account.id}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${account.is_active ? 'bg-green-500' : 'bg-white/20'
                  } ${actionLoading === account.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={account.is_active ? 'Desativar conta' : 'Ativar conta'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${account.is_active ? 'translate-x-5' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className={`text-xs ${account.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                {account.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm mt-1">
              <span className={getLoginStatusColor(account.login_status)}>
                {getLoginStatusLabel(account.login_status)}
              </span>
              {account.last_login_check && (
                <span className="text-gray-500">
                  Verificado: {formatDateTime(account.last_login_check)}
                </span>
              )}
              {account.cookies?.present && (
                <span className="text-gray-400 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Cookies salvos
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import Cookies Panel */}
      {showImportCookies === account.id && (
        <div className="mt-4 p-4 bg-brand-dark/50 rounded-sm">
          <h5 className="text-sm font-medium text-gray-300 mb-2">Importar Cookies</h5>
          <textarea
            value={importCookiesValue}
            onChange={(e) => setImportCookiesValue(e.target.value)}
            placeholder='Cole aqui o JSON dos cookies exportados...'
            rows={4}
            className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white font-mono text-sm"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleImportCookies(account.id)}
              disabled={actionLoading === account.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-yellow text-black font-medium rounded-sm hover:bg-brand-yellow-hover disabled:opacity-50 text-sm"
            >
              {actionLoading === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
              Importar
            </button>
            <button
              onClick={() => {
                setShowImportCookies(null);
                setImportCookiesValue('');
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-sm text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
        <button
          onClick={() => handleTestLogin(account.id)}
          disabled={actionLoading === account.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-sm text-sm disabled:opacity-50"
        >
          {actionLoading === account.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <TestTube className="w-3 h-3" />
          )}
          Testar Login
        </button>
        <button
          onClick={() => setShowImportCookies(showImportCookies === account.id ? null : account.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-sm text-sm"
        >
          <Key className="w-3 h-3" />
          Importar Cookies
        </button>
        <button
          onClick={() => handleDeleteAccount(account.id, account.email)}
          disabled={actionLoading === account.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-sm text-sm ml-auto disabled:opacity-50"
        >
          {actionLoading === account.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Remover
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIGURACOES TAB
// ============================================================================

interface ConfiguracoesTabProps {
  settings: TecScraperSettings | null;
  savingSettings: boolean;
  updateSetting: <K extends keyof TecScraperSettings>(key: K, value: TecScraperSettings[K]) => void;
  handleSaveSettings: () => void;
}

function ConfiguracoesTab({
  settings,
  savingSettings,
  updateSetting,
  handleSaveSettings,
}: ConfiguracoesTabProps) {
  if (!settings) {
    return (
      <div className="bg-brand-card border border-white/10 rounded-sm p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mx-auto mb-3" />
        <p className="text-gray-400">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Speed Settings */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-yellow" />
          Velocidade de Extração
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Delay mínimo (ms)</label>
            <input
              type="number"
              value={settings.min_delay_ms}
              onChange={(e) => updateSetting('min_delay_ms', parseInt(e.target.value) || 0)}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Tempo mínimo entre questões</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Delay máximo (ms)</label>
            <input
              type="number"
              value={settings.max_delay_ms}
              onChange={(e) => updateSetting('max_delay_ms', parseInt(e.target.value) || 0)}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Tempo máximo entre questões</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Delay entre páginas (ms)</label>
            <input
              type="number"
              value={settings.page_delay_ms}
              onChange={(e) => updateSetting('page_delay_ms', parseInt(e.target.value) || 0)}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Tempo de espera ao trocar de página</p>
          </div>
        </div>
      </div>

      {/* Randomization Settings */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-brand-yellow" />
          Randomização
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-white font-medium">Alternar entre contas</span>
              <p className="text-sm text-gray-500">Usa diferentes contas durante a extração para evitar bloqueios</p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('randomize_accounts', !settings.randomize_accounts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.randomize_accounts ? 'bg-brand-yellow' : 'bg-white/20'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.randomize_accounts ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-white font-medium">Processar cadernos em ordem aleatória</span>
              <p className="text-sm text-gray-500">Embaralha a ordem dos cadernos na fila de processamento</p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('randomize_cadernos', !settings.randomize_cadernos)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.randomize_cadernos ? 'bg-brand-yellow' : 'bg-white/20'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.randomize_cadernos ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Limits Settings */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-yellow" />
          Limites
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Questões por sessão</label>
            <input
              type="number"
              value={settings.questions_per_session}
              onChange={(e) => updateSetting('questions_per_session', parseInt(e.target.value) || 0)}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">0 = sem limite</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Erros antes de pausar</label>
            <input
              type="number"
              value={settings.max_errors_before_pause}
              onChange={(e) => updateSetting('max_errors_before_pause', parseInt(e.target.value) || 0)}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Pausar após N erros consecutivos</p>
          </div>
        </div>
      </div>

      {/* Retry Settings */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-brand-yellow" />
          Configurações de Retry
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-white font-medium">Tentar novamente em caso de erro</span>
              <p className="text-sm text-gray-500">Retentar automaticamente questões com falha</p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('retry_on_error', !settings.retry_on_error)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.retry_on_error ? 'bg-brand-yellow' : 'bg-white/20'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.retry_on_error ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </label>
          {settings.retry_on_error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Número máximo de tentativas</label>
                <input
                  type="number"
                  value={settings.max_retries}
                  onChange={(e) => updateSetting('max_retries', parseInt(e.target.value) || 0)}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Delay entre tentativas (ms)</label>
                <input
                  type="number"
                  value={settings.retry_delay_ms}
                  onChange={(e) => updateSetting('retry_delay_ms', parseInt(e.target.value) || 0)}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-start Settings */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-yellow" />
          Agendamento Automático
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-white font-medium">Iniciar automaticamente</span>
              <p className="text-sm text-gray-500">Processar fila automaticamente em horário definido</p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('auto_start_enabled', !settings.auto_start_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.auto_start_enabled ? 'bg-brand-yellow' : 'bg-white/20'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.auto_start_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </label>
          {settings.auto_start_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Horário de início</label>
                <input
                  type="time"
                  value={settings.auto_start_time?.slice(0, 5) || '02:00'}
                  onChange={(e) => updateSetting('auto_start_time', e.target.value + ':00')}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Horário de parada</label>
                <input
                  type="time"
                  value={settings.auto_stop_time?.slice(0, 5) || '06:00'}
                  onChange={(e) => updateSetting('auto_stop_time', e.target.value + ':00')}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="flex items-center gap-2 px-6 py-3 bg-brand-yellow text-black font-medium rounded-sm hover:bg-brand-yellow-hover disabled:opacity-50 transition-colors"
        >
          {savingSettings ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
