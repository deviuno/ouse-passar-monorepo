import React, { useState, useEffect } from 'react';
import { X, Loader2, ListChecks, ChevronDown } from 'lucide-react';
import { Tables } from '../../../lib/database.types';
import { missoesService } from '../../../services/preparatoriosService';
import { QuestionFilters, getQuestionsForFilters, ExternalQuestion } from '../../../services/externalQuestionsService';

type Missao = Tables<'missoes'>;

interface QuestionsPreviewModalProps {
  missao: Missao;
  onClose: () => void;
}

export const QuestionsPreviewModal: React.FC<QuestionsPreviewModalProps> = ({ missao, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ExternalQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const filtros = await missoesService.getQuestaoFiltros(missao.id);

        if (!filtros || !filtros.filtros) {
          setError('Nenhum filtro de questoes configurado para esta missao.');
          return;
        }

        const filters: QuestionFilters = {
          materias: filtros.filtros.materias || [],
          assuntos: filtros.filtros.assuntos || [],
          bancas: filtros.filtros.bancas || [],
          orgaos: filtros.filtros.orgaos || [],
          anos: filtros.filtros.anos || [],
          escolaridade: filtros.filtros.escolaridade || [],
          modalidade: filtros.filtros.modalidade || [],
        };

        const { questions: qs, error: fetchError } = await getQuestionsForFilters(filters, {
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        });

        if (fetchError) {
          setError(fetchError);
          return;
        }

        setQuestions(qs);
        setTotalCount(filtros.questoes_count || 0);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar questoes');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [missao.id, page]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const truncateText = (text: string, maxLines: number = 3) => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) {
      const words = text.split(' ');
      if (words.length > 50) {
        return words.slice(0, 50).join(' ') + '...';
      }
      return text;
    }
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card border border-white/10 w-full max-w-4xl rounded-sm my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">Questoes da Missao</h3>
            <p className="text-gray-500 text-sm mt-1">
              {missao.materia} {missao.assunto && `- ${missao.assunto}`}
              {totalCount > 0 && (
                <span className="text-brand-yellow ml-2">({totalCount} questoes)</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
              <p className="text-gray-400">Carregando questoes...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div className="text-center py-12">
              <ListChecks className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma questao encontrada com os filtros configurados.</p>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((q, index) => {
                const isExpanded = expandedId === q.id;
                const questionNumber = (page - 1) * ITEMS_PER_PAGE + index + 1;

                return (
                  <div
                    key={q.id}
                    className="bg-brand-dark border border-white/10 rounded-sm overflow-hidden"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-brand-yellow/20 text-brand-yellow rounded flex items-center justify-center font-bold text-sm">
                        {questionNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {q.banca && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold uppercase rounded">
                              {q.banca}
                            </span>
                          )}
                          {q.ano && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                              {q.ano}
                            </span>
                          )}
                          {q.materia && (
                            <span className="text-gray-500 text-xs truncate">{q.materia}</span>
                          )}
                        </div>
                        <p className={`text-gray-300 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {isExpanded ? q.enunciado : truncateText(q.enunciado)}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/5">
                        <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">
                          {q.enunciado}
                        </p>

                        <div className="space-y-2">
                          {Object.entries(q.alternativas || {}).map(([letra, texto]) => {
                            if (!texto) return null;
                            const isCorrect = q.gabarito?.toLowerCase() === letra.toLowerCase();
                            return (
                              <div
                                key={letra}
                                className={`flex items-start gap-2 p-2 rounded ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'}`}
                              >
                                <span
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                                >
                                  {letra.toUpperCase()}
                                </span>
                                <span className={`text-sm ${isCorrect ? 'text-green-300' : 'text-gray-400'}`}>
                                  {texto}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {q.comentario && (
                          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                            <p className="text-blue-400 text-xs font-bold uppercase mb-1">Comentario:</p>
                            <p className="text-blue-300/80 text-sm">{q.comentario}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 flex-shrink-0">
          <div className="text-gray-500 text-sm">
            Pagina {page} de {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-brand-dark border border-white/10 text-gray-400 font-bold text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-brand-dark border border-white/10 text-gray-400 font-bold text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Proxima
            </button>
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-brand-yellow text-brand-darker font-bold uppercase text-sm hover:bg-brand-yellow/90 transition-colors ml-2"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
