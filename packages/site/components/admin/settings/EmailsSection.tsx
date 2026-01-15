import React, { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  FileText,
  Mail,
  Pencil,
  Eye,
  EyeOff,
  Key,
  TestTube,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../../ui/Toast';
import {
  getEmailTemplates,
  updateEmailTemplate,
  getEmailSettings,
  updateEmailSettings,
  getEmailLogs,
  testEmailConnection,
  replaceTemplateVariables,
  EmailTemplate,
  EmailSettings,
  EmailLog,
} from '../../../services/emailService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EMAIL_TABS = [
  { id: 'config', label: 'Configurações', icon: Key },
  { id: 'templates', label: 'Templates', icon: Mail },
  { id: 'logs', label: 'Histórico', icon: FileText },
];

export function EmailsSection() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Config
  const [settings, setSettings] = useState<EmailSettings>({
    resend_api_key: '',
    remetente_email: '',
    remetente_nome: '',
    emails_ativos: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [showPlainTextPreview, setShowPlainTextPreview] = useState(false);

  // Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);

  // Quill editor config
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'align',
    'blockquote', 'link', 'color', 'background'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, templatesData, logsData] = await Promise.all([
        getEmailSettings(),
        getEmailTemplates(),
        getEmailLogs(50),
      ]);
      setSettings(settingsData);
      setTemplates(templatesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações de e-mail');
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateEmailSettings(settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!settings.resend_api_key) {
      toast.error('Configure a API Key do Resend primeiro');
      return;
    }

    setTesting(true);
    try {
      const result = await testEmailConnection();
      if (result.success) {
        toast.success('Conexão com Resend funcionando!');
      } else {
        toast.error(result.error || 'Falha na conexão');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar conexão');
    }
    setTesting(false);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      await updateEmailTemplate(editingTemplate.id, {
        assunto: editingTemplate.assunto,
        corpo_html: editingTemplate.corpo_html,
        corpo_texto: editingTemplate.corpo_texto,
        ativo: editingTemplate.ativo,
      });
      toast.success('Template salvo com sucesso!');
      setEditingTemplate(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto pb-px">
        {EMAIL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 -mb-px ${isActive
                ? 'text-brand-yellow border-brand-yellow'
                : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Configurações */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-brand-card border border-white/10 rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold uppercase">Status do Serviço</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-gray-400 text-sm">E-mails ativos</span>
                <div
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.emails_ativos ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  onClick={() => setSettings({ ...settings, emails_ativos: !settings.emails_ativos })}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.emails_ativos ? 'translate-x-7' : 'translate-x-1'
                      }`}
                  />
                </div>
              </label>
            </div>
            <p className="text-gray-500 text-sm">
              {settings.emails_ativos
                ? 'Os e-mails de boas-vindas serão enviados automaticamente após cada compra.'
                : 'Os e-mails de boas-vindas estão desativados.'}
            </p>
          </div>

          {/* API Key */}
          <div className="bg-brand-card border border-white/10 rounded-sm p-6">
            <h3 className="text-white font-bold uppercase mb-4">Integração Resend</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  API Key do Resend
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.resend_api_key}
                      onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                      placeholder="re_xxxxxxxxxxxxxxxxx"
                      className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white placeholder-gray-600 focus:border-brand-yellow focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing || !settings.resend_api_key}
                    className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                    Testar
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-2">
                  Obtenha sua API Key em{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:underline">
                    resend.com/api-keys
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Remetente */}
          <div className="bg-brand-card border border-white/10 rounded-sm p-6">
            <h3 className="text-white font-bold uppercase mb-4">Remetente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  Nome do Remetente
                </label>
                <input
                  type="text"
                  value={settings.remetente_nome}
                  onChange={(e) => setSettings({ ...settings, remetente_nome: e.target.value })}
                  placeholder="Ouse Passar"
                  className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white placeholder-gray-600 focus:border-brand-yellow focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                  E-mail do Remetente
                </label>
                <input
                  type="email"
                  value={settings.remetente_email}
                  onChange={(e) => setSettings({ ...settings, remetente_email: e.target.value })}
                  placeholder="noreply@ousepassar.com.br"
                  className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white placeholder-gray-600 focus:border-brand-yellow focus:outline-none"
                />
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-3">
              O domínio do e-mail deve estar verificado no Resend para funcionar corretamente.
            </p>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Tab: Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-brand-card border border-white/10 rounded-sm overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${template.ativo ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <div>
                    <h4 className="text-white font-bold">{template.nome_produto}</h4>
                    <p className="text-gray-500 text-xs">{template.produto}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(previewTemplate?.id === template.id ? null : template)}
                    className={`p-2 rounded transition-colors ${previewTemplate?.id === template.id
                      ? 'bg-brand-yellow/20 text-brand-yellow'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTemplate(editingTemplate?.id === template.id ? null : template)}
                    className={`p-2 rounded transition-colors ${editingTemplate?.id === template.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview */}
              {previewTemplate?.id === template.id && (
                <div className="p-4 bg-white">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: replaceTemplateVariables(template.corpo_html, {
                        nome: 'João Silva',
                        email: 'joao@exemplo.com',
                        produto: template.nome_produto,
                      }),
                    }}
                  />
                </div>
              )}

              {/* Editor */}
              {editingTemplate?.id === template.id && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Assunto do E-mail
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.assunto}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, assunto: e.target.value })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-2 text-white focus:border-brand-yellow focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                      Corpo do E-mail (HTML)
                    </label>
                    <div className="email-editor">
                      <ReactQuill
                        theme="snow"
                        value={editingTemplate.corpo_html}
                        onChange={(value) => setEditingTemplate({ ...editingTemplate, corpo_html: value })}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Escreva o conteúdo do e-mail aqui..."
                      />
                    </div>
                    <p className="text-gray-600 text-xs mt-2">
                      Variáveis disponíveis: {'{{nome}}'}, {'{{email}}'}, {'{{produto}}'}
                    </p>
                    <style>{`
                      .email-editor {
                        background: #1a1a1a;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 2px;
                      }
                      .email-editor .ql-toolbar {
                        background: #2a2a2a;
                        border: none !important;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                        padding: 12px;
                      }
                      .email-editor .ql-container {
                        border: none !important;
                        font-size: 14px;
                        min-height: 250px;
                      }
                      .email-editor .ql-editor {
                        color: #ffffff;
                        min-height: 250px;
                        padding: 16px;
                      }
                      .email-editor .ql-editor.ql-blank::before {
                        color: rgba(255, 255, 255, 0.4);
                        font-style: normal;
                      }
                      .email-editor .ql-toolbar button {
                        color: #ffffff;
                      }
                      .email-editor .ql-toolbar button:hover {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar button.ql-active {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-stroke {
                        stroke: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-stroke:hover {
                        stroke: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-fill {
                        fill: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-fill:hover {
                        fill: #fbbf24;
                      }
                      .email-editor .ql-toolbar button:hover .ql-stroke {
                        stroke: #fbbf24;
                      }
                      .email-editor .ql-toolbar button:hover .ql-fill {
                        fill: #fbbf24;
                      }
                      .email-editor .ql-toolbar button.ql-active .ql-stroke {
                        stroke: #fbbf24;
                      }
                      .email-editor .ql-toolbar button.ql-active .ql-fill {
                        fill: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-picker-label {
                        color: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-picker-label:hover {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-picker-label.ql-active {
                        color: #fbbf24;
                      }
                      .email-editor .ql-toolbar .ql-picker-options {
                        background: #2a2a2a;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                      }
                      .email-editor .ql-toolbar .ql-picker-item {
                        color: #ffffff;
                      }
                      .email-editor .ql-toolbar .ql-picker-item:hover {
                        color: #fbbf24;
                      }
                      .email-editor .ql-editor h1,
                      .email-editor .ql-editor h2,
                      .email-editor .ql-editor h3,
                      .email-editor .ql-editor h4,
                      .email-editor .ql-editor h5,
                      .email-editor .ql-editor h6 {
                        color: #ffffff;
                      }
                      .email-editor .ql-editor a {
                        color: #fbbf24;
                      }
                      .email-editor .ql-editor blockquote {
                        border-left: 4px solid #fbbf24;
                        padding-left: 16px;
                        color: #a0a0a0;
                      }
                    `}</style>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-gray-400 text-xs font-bold uppercase">
                        Corpo do E-mail (Texto Puro)
                      </label>
                      <div className="flex gap-1 bg-brand-dark border border-white/10 rounded-sm p-0.5">
                        <button
                          type="button"
                          onClick={() => setShowPlainTextPreview(false)}
                          className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-colors ${!showPlainTextPreview
                            ? 'bg-brand-yellow text-brand-darker'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        >
                          <Pencil className="w-3 h-3 inline mr-1" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlainTextPreview(true)}
                          className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-colors ${showPlainTextPreview
                            ? 'bg-brand-yellow text-brand-darker'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          Preview
                        </button>
                      </div>
                    </div>

                    {!showPlainTextPreview ? (
                      <textarea
                        value={editingTemplate.corpo_texto}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, corpo_texto: e.target.value })}
                        rows={8}
                        placeholder="Versão em texto puro do e-mail para clientes que não suportam HTML..."
                        className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-3 text-white font-mono text-sm focus:border-brand-yellow focus:outline-none leading-relaxed"
                      />
                    ) : (
                      <div className="bg-white border border-gray-300 rounded-sm p-6 min-h-[200px]">
                        <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {replaceTemplateVariables(editingTemplate.corpo_texto, {
                            nome: 'João Silva',
                            email: 'joao@exemplo.com',
                            produto: editingTemplate.nome_produto,
                          })}
                        </div>
                      </div>
                    )}
                    <p className="text-gray-600 text-xs mt-2">
                      Esta versão é exibida em clientes de e-mail que não suportam HTML. Variáveis: {'{{nome}}'}, {'{{email}}'}, {'{{produto}}'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTemplate.ativo}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, ativo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-brand-dark text-brand-yellow focus:ring-brand-yellow"
                      />
                      <span className="text-gray-400 text-sm">Template ativo</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={saving}
                        className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Histórico */}
      {activeTab === 'logs' && (
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold uppercase">Últimos E-mails Enviados</h3>
            <button
              onClick={loadData}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum e-mail enviado ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {log.status === 'sent' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{log.destinatario_email}</p>
                    <p className="text-gray-500 text-sm truncate">{log.assunto}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${log.status === 'sent' ? 'text-green-500' :
                      log.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                      {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Falhou' : 'Pendente'}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
