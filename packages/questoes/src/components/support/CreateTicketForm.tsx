import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  CheckCircle,
  Upload,
  X,
  File,
  Image,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  TICKET_MOTIVOS,
  TicketMotivo,
  TicketAnexo,
  createTicket,
  uploadTicketFile,
} from '../../services/ticketsService';
import { useAuthStore } from '../../stores/useAuthStore';

interface CreateTicketFormProps {
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
];

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [motivo, setMotivo] = useState<TicketMotivo | ''>('');
  const [motivoOutro, setMotivoOutro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [anexos, setAnexos] = useState<TicketAnexo[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;

    setError(null);

    for (const file of Array.from(files)) {
      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        setError(`Arquivo "${file.name}" excede o limite de 10MB`);
        continue;
      }

      // Validar tipo
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Tipo de arquivo não permitido: ${file.type}`);
        continue;
      }

      // Upload
      setUploadingFiles((prev) => [...prev, file.name]);

      const uploaded = await uploadTicketFile(file, user.id);

      setUploadingFiles((prev) => prev.filter((name) => name !== file.name));

      if (uploaded) {
        setAnexos((prev) => [...prev, uploaded]);
      } else {
        setError(`Erro ao enviar "${file.name}"`);
      }
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAnexo = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!motivo) {
      setError('Selecione o motivo do seu contato');
      return;
    }

    if (motivo === 'outro' && !motivoOutro.trim()) {
      setError('Descreva o motivo do seu contato');
      return;
    }

    if (!mensagem.trim()) {
      setError('Escreva sua mensagem');
      return;
    }

    if (!user?.id) {
      setError('Você precisa estar logado');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const ticketId = await createTicket({
      userId: user.id,
      userName: user.name || '',
      userEmail: user.email || '',
      motivo,
      motivoOutro: motivo === 'outro' ? motivoOutro.trim() : undefined,
      mensagem: mensagem.trim(),
      anexos,
    });

    setIsSubmitting(false);

    if (ticketId) {
      setSubmitted(true);
      onSuccess?.();
    } else {
      setError('Erro ao enviar ticket. Tente novamente.');
    }
  };

  const resetForm = () => {
    setMotivo('');
    setMotivoOutro('');
    setMensagem('');
    setAnexos([]);
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h3 className="text-white font-semibold text-xl mb-2">
          Ticket enviado com sucesso!
        </h3>
        <p className="text-[#A0A0A0] mb-6">
          Nossa equipe vai analisar sua solicitação e responder em breve.
          Você será notificado quando houver uma resposta.
        </p>
        <button
          onClick={resetForm}
          className="px-6 py-3 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-colors"
        >
          Enviar outro ticket
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-6">
      <div className="space-y-5">
        {/* Seleção de Motivo */}
        <div>
          <label className="block text-white text-sm font-medium mb-3">
            Qual o motivo do contato? <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TICKET_MOTIVOS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setMotivo(item.value);
                  setError(null);
                }}
                className={`
                  text-left px-4 py-3 rounded-xl border transition-all text-sm
                  ${
                    motivo === item.value
                      ? 'border-[#FFB800] bg-[#FFB800]/10 text-white'
                      : 'border-[#3A3A3A] bg-[#242424] text-[#A0A0A0] hover:border-[#5A5A5A]'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campo para "Outro" motivo */}
        <AnimatePresence>
          {motivo === 'outro' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-white text-sm font-medium mb-2">
                Descreva o motivo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={motivoOutro}
                onChange={(e) => setMotivoOutro(e.target.value)}
                placeholder="Ex: Problema com certificado..."
                className="w-full px-4 py-3 rounded-xl border border-[#3A3A3A] bg-[#242424] text-white placeholder-[#6A6A6A] focus:outline-none focus:border-[#FFB800] transition-colors"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensagem */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Sua mensagem <span className="text-red-400">*</span>
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Descreva detalhadamente sua dúvida ou problema..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-[#3A3A3A] bg-[#242424] text-white placeholder-[#6A6A6A] resize-none focus:outline-none focus:border-[#FFB800] transition-colors"
          />
        </div>

        {/* Upload de Arquivos */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Anexos (opcional)
          </label>
          <p className="text-[#6A6A6A] text-xs mb-3">
            Imagens, PDFs ou arquivos ZIP. Máximo 10MB por arquivo.
          </p>

          {/* Lista de anexos */}
          {anexos.length > 0 && (
            <div className="space-y-2 mb-3">
              {anexos.map((anexo, index) => {
                const Icon = getFileIcon(anexo.type);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-[#242424] border border-[#3A3A3A] rounded-xl px-4 py-3"
                  >
                    <Icon size={20} className="text-[#FFB800] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{anexo.name}</p>
                      <p className="text-[#6A6A6A] text-xs">
                        {formatFileSize(anexo.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAnexo(index)}
                      className="p-1 text-[#6A6A6A] hover:text-red-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Uploading indicator */}
          {uploadingFiles.length > 0 && (
            <div className="flex items-center gap-2 text-[#A0A0A0] text-sm mb-3">
              <Loader2 size={16} className="animate-spin" />
              Enviando: {uploadingFiles.join(', ')}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFiles.length > 0}
            className="flex items-center gap-2 px-4 py-3 border border-dashed border-[#3A3A3A] rounded-xl text-[#A0A0A0] hover:border-[#FFB800] hover:text-[#FFB800] transition-colors disabled:opacity-50"
          >
            <Upload size={18} />
            Anexar arquivos
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Botão de Enviar */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !motivo || !mensagem.trim()}
          className={`
            w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
            ${
              isSubmitting || !motivo || !mensagem.trim()
                ? 'bg-[#3A3A3A] text-[#6A6A6A] cursor-not-allowed'
                : 'bg-[#FFB800] text-[#1A1A1A] hover:bg-[#E5A600]'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send size={20} />
              Enviar Ticket
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CreateTicketForm;
