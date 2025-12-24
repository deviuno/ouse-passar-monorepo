import React, { useEffect, useState } from 'react';
import { Shield, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLegalText } from '../services/legalTextsService';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<{
    title: string;
    content: string;
    lastUpdated: string;
  } | null>(null);

  useEffect(() => {
    async function loadPrivacy() {
      setLoading(true);
      const data = await getLegalText('privacy_policy');
      setText(data);
      setLoading(false);
    }

    loadPrivacy();
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
                Não foi possível carregar a Política de Privacidade. Por favor, tente novamente
                mais tarde.
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
            <Shield className="text-[#FFB800]" size={32} />
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
        <div className="space-y-4">
          <p className="text-center text-gray-500 text-sm">
            Para exercer seus direitos previstos na LGPD ou tirar dúvidas sobre privacidade,
            entre em contato:
          </p>
          <div className="text-center">
            <a
              href="mailto:privacidade@ousepassar.com.br"
              className="text-[#FFB800] hover:underline font-medium"
            >
              privacidade@ousepassar.com.br
            </a>
            <br />
            <a
              href="mailto:dpo@ousepassar.com.br"
              className="text-gray-400 hover:text-[#FFB800] hover:underline text-sm"
            >
              DPO: dpo@ousepassar.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
