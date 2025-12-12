import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Target, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMensagemAleatoria } from '../lib/planejamentoPRF';
import { SEOHead } from '../components/SEOHead';
import { PageHero } from '../components/PageHero';

export const PlanejamentoPRFForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_aluno: '',
    email: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const mensagemIncentivo = getMensagemAleatoria();

      const { data, error: insertError } = await supabase
        .from('planejamentos_prf')
        .insert({
          nome_aluno: formData.nome_aluno,
          email: formData.email || null,
          concurso: 'PRF - Policia Rodoviaria Federal',
          mensagem_incentivo: mensagemIncentivo
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirecionar para a pagina do planejamento
      navigate(`/planejamento-prf/${data.id}`);
    } catch (err: any) {
      console.error('Erro ao criar planejamento:', err);
      setError('Erro ao gerar seu planejamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <SEOHead
        title="Planejamento PRF - Cronograma de Estudos | Ouse Passar"
        description="Gere seu planejamento personalizado para o concurso da PRF - Policia Rodoviaria Federal. Cronograma completo com 16 rodadas e 184 missoes."
      />

      <PageHero
        title="Planejamento"
        titleHighlight="PRF"
        description="Gere seu cronograma personalizado de estudos para o concurso da Policia Rodoviaria Federal"
      />

      <div className="py-16 bg-brand-darker">
        <div className="max-w-2xl mx-auto px-4">
          {/* Card de informacoes */}
          <div className="bg-brand-card border border-white/10 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-yellow" />
              O que voce vai receber
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                <span>Cronograma completo com <strong className="text-white">16 rodadas</strong> de estudo</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">184 missoes</strong> organizadas por materia</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                <span>Instrucoes detalhadas para cada assunto</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                <span>Opcao de <strong className="text-white">imprimir</strong> ou <strong className="text-white">apresentar em slides</strong></span>
              </li>
            </ul>
          </div>

          {/* Formulario */}
          <div className="bg-brand-card border border-white/10 rounded-lg p-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-brand-yellow" />
              Gerar Planejamento
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nome_aluno" className="block text-sm font-medium text-gray-300 mb-2">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  id="nome_aluno"
                  required
                  value={formData.nome_aluno}
                  onChange={(e) => setFormData({ ...formData, nome_aluno: e.target.value })}
                  className="w-full px-4 py-3 bg-brand-darker border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-brand-darker border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
                  placeholder="seu@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informe seu e-mail para receber novidades sobre o concurso
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-yellow text-brand-darker px-8 py-4 font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-brand-darker border-t-transparent rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Gerar Meu Planejamento
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanejamentoPRFForm;
