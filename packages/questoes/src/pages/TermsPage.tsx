import React, { useEffect, useState } from 'react';
import { FileText, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLegalText } from '../services/legalTextsService';

export default function TermsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<{
    title: string;
    content: string;
    lastUpdated: string;
  } | null>(null);

  useEffect(() => {
    async function loadTerms() {
      setLoading(true);
      const data = await getLegalText('terms_of_service');
      setText(data);
      setLoading(false);
    }

    loadTerms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (!text) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
            <div>
              <p className="text-red-400 font-bold mb-2">Erro ao carregar</p>
              <p className="text-red-400 text-sm">
                Não foi possível carregar os Termos de Uso. Por favor, tente novamente mais
                tarde.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 text-[#FFB800] hover:underline text-sm"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header */}
      <div className="bg-[#252525] border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="flex items-center gap-3">
            <FileText className="text-[#FFB800]" size={32} />
            <div>
              <h1 className="text-2xl font-bold">{text.title}</h1>
              <p className="text-sm text-gray-400 mt-1">
                Última atualização: {text.lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed text-gray-300">
            {text.content}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 py-8 border-t border-gray-700 mt-8">
        <p className="text-center text-gray-500 text-sm">
          Se tiver dúvidas sobre estes termos, entre em contato conosco em{' '}
          <a
            href="mailto:contato@ousepassar.com.br"
            className="text-[#FFB800] hover:underline"
          >
            contato@ousepassar.com.br
          </a>
        </p>
      </div>
    </div>
  );
}
