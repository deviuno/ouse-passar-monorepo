import React, { useState, useEffect } from 'react';
import { Flag, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  createQuestionReport,
  REPORT_MOTIVOS,
  ReportMotivo,
} from '../../services/questionReportsService';
import { useAuthStore } from '../../stores/useAuthStore';

interface ReportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
  questionInfo: {
    materia?: string;
    assunto?: string;
    banca?: string;
    ano?: number;
  };
  onSuccess?: () => void;
  initialMotivo?: ReportMotivo;
}

export function ReportQuestionModal({
  isOpen,
  onClose,
  questionId,
  questionInfo,
  onSuccess,
  initialMotivo,
}: ReportQuestionModalProps) {
  const { user } = useAuthStore();
  const [motivo, setMotivo] = useState<ReportMotivo | ''>(initialMotivo || '');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Atualiza motivo quando initialMotivo muda (ao abrir com motivo pré-selecionado)
  useEffect(() => {
    if (initialMotivo) {
      setMotivo(initialMotivo);
    }
  }, [initialMotivo]);

  const handleSubmit = async () => {
    if (!motivo) {
      setError('Selecione o motivo do problema');
      return;
    }

    if (!user?.id) {
      setError('Você precisa estar logado para reportar');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const success = await createQuestionReport({
      questionId,
      userId: user.id,
      motivo,
      descricao: descricao.trim() || undefined,
      questionInfo,
    });

    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
      onSuccess?.();
      // Fechar após 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setError('Erro ao enviar o report. Tente novamente.');
    }
  };

  const handleClose = () => {
    setMotivo('');
    setDescricao('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reportar Problema"
      icon={<Flag size={20} className="text-[#E74C3C]" />}
      size="md"
    >
      {submitted ? (
        // Tela de sucesso
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            Report enviado!
          </h3>
          <p className="text-[#A0A0A0] text-sm">
            Obrigado por nos ajudar a melhorar. Vamos analisar seu report.
          </p>
        </div>
      ) : (
        // Formulário
        <div className="space-y-4">
          {/* Info da questão */}
          <div className="bg-[#1A1A1A] rounded-lg p-3 text-sm">
            <p className="text-[#A0A0A0]">
              Questão #{questionId}
              {questionInfo.materia && ` • ${questionInfo.materia}`}
              {questionInfo.banca && ` • ${questionInfo.banca}`}
              {questionInfo.ano && ` ${questionInfo.ano}`}
            </p>
          </div>

          {/* Seleção de motivo */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Qual o problema? <span className="text-red-400">*</span>
            </label>
            <div className="grid gap-2">
              {REPORT_MOTIVOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setMotivo(item.value);
                    setError(null);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border transition-all
                    ${
                      motivo === item.value
                        ? 'border-[#FFB800] bg-[#FFB800]/10 text-white'
                        : 'border-[#3A3A3A] bg-[#1A1A1A] text-[#A0A0A0] hover:border-[#5A5A5A]'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição opcional */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Detalhes (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema com mais detalhes..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-[#3A3A3A] bg-[#1A1A1A] text-white placeholder-[#6A6A6A] resize-none focus:outline-none focus:border-[#FFB800] transition-colors"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Botão de enviar */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !motivo}
            className={`
              w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
              ${
                isSubmitting || !motivo
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
              'Enviar Report'
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}

export default ReportQuestionModal;
