import React, { useState, useEffect } from 'react';
import {
  Eye,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  BookOpen,
  Hash,
} from 'lucide-react';
import {
  previewQuestions,
  isExternalDbAvailable,
  ExternalQuestion,
  QuestionFilters,
} from '../../services/externalQuestionsService';

interface QuestionPreviewProps {
  filters: QuestionFilters;
  onCountUpdate?: (count: number) => void;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  filters,
  onCountUpdate,
}) => {
  const [questions, setQuestions] = useState<ExternalQuestion[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [isDbConfigured, setIsDbConfigured] = useState(true);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const { questions: data, total: count, error: fetchError } = await previewQuestions(filters, 10);

      if (fetchError) {
        setError(fetchError);
        setIsDbConfigured(isExternalDbAvailable());
      } else {
        setQuestions(data);
        setTotal(count);
        onCountUpdate?.(count);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load if there are filters to apply
    const hasFilters =
      (filters.materias && filters.materias.length > 0) ||
      (filters.bancas && filters.bancas.length > 0) ||
      (filters.anos && filters.anos.length > 0) ||
      (filters.orgaos && filters.orgaos.length > 0);

    if (hasFilters) {
      loadPreview();
    }
  }, [JSON.stringify(filters)]);

  const toggleQuestion = (id: number) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  const toggleAnswer = (id: number) => {
    setShowAnswer((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatAlternatives = (alternativas: ExternalQuestion['alternativas']) => {
    if (!alternativas) return [];
    return Object.entries(alternativas)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({ key: key.toUpperCase(), value }));
  };

  if (!isDbConfigured) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="text-yellow-500 font-medium">Banco de questões não configurado</p>
            <p className="text-yellow-400/70 text-sm mt-1">
              Configure as variáveis VITE_QUESTIONS_DB_URL e VITE_QUESTIONS_DB_ANON_KEY no arquivo .env.local
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-card border border-white/5 rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-brand-yellow" />
          <h3 className="font-bold text-white uppercase tracking-wide text-sm">
            Preview de Questões
          </h3>
          {total > 0 && (
            <span className="px-2 py-0.5 bg-brand-yellow/20 text-brand-yellow text-xs font-bold rounded">
              {total.toLocaleString('pt-BR')} encontradas
            </span>
          )}
        </div>
        <button
          onClick={loadPreview}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
            <span className="ml-3 text-gray-400">Carregando questões...</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma questão encontrada com os filtros atuais.</p>
            <p className="text-sm mt-1">Ajuste os filtros para ver questões de exemplo.</p>
          </div>
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-brand-dark/50 border border-white/5 rounded-sm overflow-hidden"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-yellow/20 text-brand-yellow text-xs font-bold rounded flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm line-clamp-2">
                        {question.enunciado?.replace(/<[^>]*>/g, '').slice(0, 200)}
                        {question.enunciado && question.enunciado.length > 200 ? '...' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {question.materia && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <BookOpen className="w-3 h-3" />
                            {question.materia}
                          </span>
                        )}
                        {question.banca && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            {question.banca}
                          </span>
                        )}
                        {question.ano && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {question.ano}
                          </span>
                        )}
                        {question.orgao && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Hash className="w-3 h-3" />
                            {question.orgao}
                          </span>
                        )}
                      </div>
                    </div>
                    {expandedQuestion === question.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedQuestion === question.id && (
                  <div className="p-4 pt-0 border-t border-white/5">
                    {/* Full Question */}
                    <div
                      className="text-gray-300 text-sm mb-4 prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: question.enunciado || '' }}
                    />

                    {/* Alternatives */}
                    {question.alternativas && (
                      <div className="space-y-2 mb-4">
                        {formatAlternatives(question.alternativas).map(({ key, value }) => (
                          <div
                            key={key}
                            className={`flex items-start gap-3 p-2 rounded-sm ${
                              showAnswer[question.id] && question.gabarito?.toUpperCase() === key
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-white/5'
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                showAnswer[question.id] && question.gabarito?.toUpperCase() === key
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/10 text-gray-400'
                              }`}
                            >
                              {key}
                            </span>
                            <span
                              className="text-sm text-gray-300"
                              dangerouslySetInnerHTML={{ __html: value || '' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show Answer Button */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleAnswer(question.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                          showAnswer[question.id]
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {showAnswer[question.id] ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Gabarito: {question.gabarito?.toUpperCase()}
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Ver Gabarito
                          </>
                        )}
                      </button>

                      {question.assunto && (
                        <span className="text-xs text-gray-500">
                          Assunto: {question.assunto}
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    {showAnswer[question.id] && question.comentario && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-sm">
                        <p className="text-blue-400 text-xs font-bold uppercase mb-2">Comentário</p>
                        <div
                          className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: question.comentario }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* More Questions Note */}
            {total > questions.length && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Mostrando {questions.length} de {total.toLocaleString('pt-BR')} questões
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
