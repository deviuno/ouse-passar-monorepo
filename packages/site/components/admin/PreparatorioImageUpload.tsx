import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, Loader2, ZoomIn, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MASTRA_URL = 'http://localhost:4000';

interface PreparatorioImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  cargo?: string;
  orgao?: string;
}

export interface PreparatorioImageUploadRef {
  openAiModal: () => void;
}

export const PreparatorioImageUpload = forwardRef<PreparatorioImageUploadRef, PreparatorioImageUploadProps>(({
  value,
  onChange,
  cargo,
  orgao,
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        if (aiModalOpen && !aiGenerating) setAiModalOpen(false);
      }
    };

    if (lightboxOpen || aiModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, aiModalOpen, aiGenerating]);

  // Gerar prompt quando abrir o modal
  useEffect(() => {
    if (aiModalOpen && cargo) {
      generatePrompt();
    }
  }, [aiModalOpen, cargo, orgao]);

  const generatePrompt = async () => {
    if (!cargo) {
      setAiPrompt('Profissional feliz por ter sido aprovado(a) no concurso, exercendo sua função com prazer e realização profissional.');
      return;
    }

    try {
      const response = await fetch(`${MASTRA_URL}/api/preparatorio/gerar-prompt-imagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargo, orgao }),
      });

      const data = await response.json();
      if (data.success) {
        setAiPrompt(data.prompt);
      } else {
        setAiPrompt(`${cargo} feliz por ter sido aprovado(a) no concurso${orgao ? ` do ${orgao}` : ''}, exercendo sua função com prazer e realização profissional.`);
      }
    } catch {
      setAiPrompt(`${cargo} feliz por ter sido aprovado(a) no concurso${orgao ? ` do ${orgao}` : ''}, exercendo sua função com prazer e realização profissional.`);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError('');

      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      if (file.size > 100 * 1024 * 1024) {
        throw new Error('A imagem deve ter no maximo 100MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `capa-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('preparatorios')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('preparatorios')
        .getPublicUrl(fileName);

      onChange(data.publicUrl);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'preparatorios');

      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        await supabase.storage
          .from('preparatorios')
          .remove([filePath]);
      }

      onChange('');
      setError('');
    } catch (err: any) {
      console.error('Erro ao remover imagem:', err);
      onChange('');
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Digite um prompt para gerar a imagem');
      return;
    }

    setAiGenerating(true);
    setAiError('');

    try {
      const response = await fetch(`${MASTRA_URL}/api/preparatorio/gerar-imagem-capa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargo,
          orgao,
          prompt: aiPrompt,
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        onChange(data.imageUrl);
        setAiModalOpen(false);
        setAiPrompt('');
      } else {
        setAiError(data.error || 'Erro ao gerar imagem');
      }
    } catch (err: any) {
      console.error('Erro ao gerar imagem com IA:', err);
      setAiError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setAiGenerating(false);
    }
  };

  const openAiModal = () => {
    setAiError('');
    setAiModalOpen(true);
  };

  // Expose openAiModal via ref
  useImperativeHandle(ref, () => ({
    openAiModal,
  }));

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {value ? (
        <div className="relative group">
          <div
            className="border border-white/10 overflow-hidden bg-brand-dark cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={value}
              alt="Capa do preparatorio"
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAiModal();
              }}
              className="bg-brand-yellow hover:bg-white text-brand-darker p-1.5 rounded-sm transition-colors"
              title="Gerar nova imagem com IA"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-sm transition-colors"
              title="Remover imagem"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 border-2 border-dashed border-white/20 hover:border-brand-yellow bg-brand-dark hover:bg-brand-card p-4 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-brand-yellow mb-2 animate-spin" />
                <p className="text-white text-xs font-bold">Fazendo upload...</p>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-brand-yellow mb-2" />
                <p className="text-white text-xs font-bold mb-1">Clique para upload</p>
                <p className="text-gray-500 text-xs">PNG, JPG, WEBP ate 100MB</p>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={openAiModal}
            disabled={uploading}
            className="border-2 border-dashed border-brand-yellow/50 hover:border-brand-yellow bg-brand-dark hover:bg-brand-card p-4 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          >
            <Sparkles className="w-6 h-6 text-brand-yellow mb-2" />
            <p className="text-brand-yellow text-xs font-bold">Gerar com IA</p>
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && value && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={value}
            alt="Capa do preparatorio - visualização completa"
            className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* AI Generation Modal */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => !aiGenerating && setAiModalOpen(false)}
        >
          <div
            className="bg-brand-card border border-white/10 rounded-sm w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-yellow" />
                <h3 className="text-white font-bold">Gerar Imagem com IA</h3>
              </div>
              {!aiGenerating && (
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Prompt da Imagem
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  disabled={aiGenerating}
                  placeholder="Descreva a imagem que deseja gerar..."
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600 resize-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O prompt foi gerado automaticamente baseado no cargo. Você pode editá-lo se desejar.
                </p>
              </div>

              {aiError && (
                <div className="bg-red-900/20 border border-red-500/50 p-3 text-red-400 text-sm rounded-sm">
                  {aiError}
                </div>
              )}

              {aiGenerating && (
                <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 rounded-sm">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />
                    <div>
                      <p className="text-brand-yellow font-medium">Gerando imagem...</p>
                      <p className="text-gray-400 text-xs mt-1">Isso pode levar até 60 segundos</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                disabled={aiGenerating}
                className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Imagem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
