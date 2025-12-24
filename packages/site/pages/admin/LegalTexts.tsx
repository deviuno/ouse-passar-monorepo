import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import {
  getAllLegalTexts,
  updateLegalText,
  LegalText,
  LegalTextId,
} from '../../services/legalTextsService';

const LEGAL_TEXT_LABELS: Record<LegalTextId, string> = {
  terms_of_service: 'Termos de Uso',
  privacy_policy: 'Política de Privacidade',
};

export const LegalTextsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [texts, setTexts] = useState<LegalText[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    setLoading(true);
    setError(null);
    const { texts: data, error: err } = await getAllLegalTexts();
    if (err) {
      setError(err);
    } else {
      setTexts(data);
    }
    setLoading(false);
  };

  const handleEdit = (text: LegalText) => {
    setEditingId(text.id);
    setPreviewId(null);
    setFormData({
      title: text.title,
      content: text.content,
    });
  };

  const handlePreview = (text: LegalText) => {
    setPreviewId(previewId === text.id ? null : text.id);
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const { success, error: err } = await updateLegalText(id as LegalTextId, formData);

    if (err) {
      toast.error(err);
    } else if (success) {
      toast.success('Texto legal atualizado com sucesso!');
      setTexts(
        texts.map((t) =>
          t.id === id
            ? { ...t, ...formData, last_updated: new Date().toISOString() }
            : t
        )
      );
      setEditingId(null);
    }
    setSaving(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', content: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-yellow" />
          Textos Legais
        </h1>
        <p className="text-gray-400 mt-2">
          Gerencie os Termos de Uso e Política de Privacidade da plataforma
        </p>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-500">
            Erro ao carregar textos legais. Execute a migração SQL primeiro.
          </p>
        </div>
      )}

      {/* Legal Texts List */}
      <div className="space-y-6">
        {texts.map((text) => (
          <div
            key={text.id}
            className="bg-brand-card border border-white/5 rounded-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {LEGAL_TEXT_LABELS[text.id as LegalTextId] || text.title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Última atualização:{' '}
                    {new Date(text.last_updated).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {editingId !== text.id && (
                    <>
                      <button
                        onClick={() => handlePreview(text)}
                        className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {previewId === text.id ? 'Ocultar' : 'Visualizar'}
                      </button>
                      <button
                        onClick={() => handleEdit(text)}
                        className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm tracking-wide hover:bg-white transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content - Preview Mode */}
            {previewId === text.id && editingId !== text.id && (
              <div className="p-6 bg-brand-dark/30">
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                    {text.content}
                  </div>
                </div>
              </div>
            )}

            {/* Content - Edit Mode */}
            {editingId === text.id && (
              <div className="p-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Conteúdo (Markdown)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      rows={20}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow font-mono text-sm"
                      placeholder="Digite o conteúdo em Markdown..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Suporta Markdown: # Título, ## Subtítulo, **negrito**,
                      *itálico*, - lista
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleSave(text.id)}
                      disabled={saving === text.id}
                      className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving === text.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar Alterações
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving === text.id}
                      className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-sm p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-bold mb-2">Sobre os Textos Legais</h3>
            <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
              <li>Os textos são exibidos para os usuários durante o cadastro</li>
              <li>Use Markdown para formatação (títulos, listas, negrito, etc.)</li>
              <li>
                Sempre atualize a data no topo do documento ao fazer alterações
                significativas
              </li>
              <li>
                Consulte um advogado para garantir conformidade com LGPD e outras leis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
