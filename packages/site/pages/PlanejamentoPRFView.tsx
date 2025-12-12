import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Presentation,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Target,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { planejamentoPRF, Rodada, Missao } from '../lib/planejamentoPRF';
import { SEOHead } from '../components/SEOHead';

interface PlanejamentoData {
  id: string;
  nome_aluno: string;
  email: string | null;
  concurso: string;
  mensagem_incentivo: string;
  created_at: string;
}

// Componente de Card da Missao (Estilo Tabela)
const MissaoCard: React.FC<{ missao: Missao; compact?: boolean }> = ({ missao, compact = false }) => {
  const isTemaOuAcao = !missao.materia && (missao.tema || missao.acao);
  const isRevisao = isTemaOuAcao && (missao.tema?.includes('REVISÃO') || missao.acao?.includes('REVISÃO'));

  // Layout para Células Especiais (Revisão/Ação)
  if (isTemaOuAcao) {
    return (
      <div className={`h-full flex flex-col border border-brand-yellow/30 ${compact ? 'min-h-[100px]' : 'min-h-[180px]'}`}>
        {/* Header da Célula */}
        <div className="bg-brand-darker border-b border-brand-yellow/30 py-1 px-2 text-center">
          <span className="text-brand-yellow font-black text-sm uppercase tracking-wider">
            {missao.numero.includes(',') || missao.numero.includes('e') ? 'Missões' : 'Missão'} {missao.numero}
          </span>
        </div>

        {/* Corpo da Célula */}
        <div className={`flex-1 bg-brand-card flex items-center justify-center p-4 text-center ${isRevisao ? 'bg-gradient-to-br from-brand-card to-red-900/20' : ''}`}>
          {missao.tema && (
            <p className={`font-black uppercase tracking-tight ${isRevisao ? 'text-red-500 text-xl' : 'text-white text-lg'}`}>
              {missao.tema}
            </p>
          )}
          {missao.acao && (
            <p className="text-brand-yellow font-bold text-sm uppercase leading-relaxed">
              {missao.acao}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Layout Padrão (Matéria/Assunto)
  return (
    <div className={`h-full flex flex-col border border-brand-yellow/30 bg-brand-card ${compact ? 'text-xs' : ''}`}>
      {/* Header da Célula */}
      <div className="bg-black border-b border-brand-yellow/30 py-1.5 px-2 text-center relative overflow-hidden">
        <span className="text-brand-yellow font-black text-sm uppercase tracking-wider relative z-10">
          Missão {missao.numero}
        </span>
      </div>

      {/* Corpo da Célula */}
      <div className={`flex-1 p-4 flex flex-col gap-3 ${compact ? 'p-2 gap-1' : ''}`}>

        {/* Matéria */}
        <div className="border-b border-white/5 pb-2">
          <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-widest mb-0.5 opacity-80">Matéria</p>
          <p className="text-white font-bold leading-tight">{missao.materia}</p>
        </div>

        {/* Assunto */}
        <div className="flex-1">
          <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-widest mb-0.5 opacity-80">Assunto</p>
          <p className="text-gray-300 text-sm leading-snug font-medium">{missao.assunto}</p>
        </div>

        {/* Instruções */}
        {!compact && (
          <div className="mt-auto pt-2 border-t border-white/5 bg-black/20 -mx-4 -mb-4 p-3">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Instruções</p>
            <p className="text-gray-400 text-xs italic leading-relaxed">{missao.instrucoes}</p>

            {missao.extra && missao.extra.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Extra</p>
                <ul className="text-gray-400 text-xs list-disc list-inside">
                  {missao.extra.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Rodada
// Componente de Rodada
const RodadaSection: React.FC<{ rodada: Rodada }> = ({ rodada }) => {
  // Dividir missoes em paginas de 6 (para garantir que caiba em uma pagina com margens)
  const chunks: Missao[][] = [];
  for (let i = 0; i < rodada.missoes.length; i += 6) {
    chunks.push(rodada.missoes.slice(i, i + 6));
  }

  return (
    <>
      {chunks.map((chunk, index) => (
        <div key={index} className="mb-16 page-break-inside-avoid relative print:h-screen print:flex print:flex-col print:justify-start print:pt-12 print:pb-8">
          {/* Header da Rodada (Repetido em todas as paginas) */}
          <div className="flex flex-col items-center justify-center mb-8 relative">
            <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/50 to-transparent top-1/2 -z-10"></div>
            <div className="bg-brand-darker px-8 py-2 border border-brand-yellow/30 rounded-full shadow-[0_0_30px_rgba(255,184,0,0.15)]">
              <h3 className="text-3xl font-black text-brand-yellow uppercase tracking-tighter font-display">
                {rodada.numero}ª RODADA
              </h3>
            </div>
            {rodada.titulo.replace(/^\d+a RODADA /, '') && (
              <p className="mt-2 text-gray-500 text-sm uppercase tracking-widest font-bold">
                {rodada.titulo.replace(/^\d+a RODADA /, '').replace(/[()]/g, '')}
              </p>
            )}
          </div>

          {/* Nota apenas na primeira pagina */}
          {index === 0 && rodada.nota && (
            <div className="max-w-3xl mx-auto mb-8 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-500/80 text-sm font-medium">{rodada.nota}</p>
            </div>
          )}

          {/* Grid de Missões - Estilo Tabela */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chunk.map((missao, mIndex) => (
              <div key={mIndex}>
                <MissaoCard missao={missao} />
              </div>
            ))}
          </div>

          {/* Footer de Paginacao Interna (opcional, visual apenas) */}

        </div>
      ))}
    </>
  );
};

// Componente de Slide para Apresentacao
const SlideView: React.FC<{
  rodada: Rodada;
  missoes: Missao[];
  slideIndex: number;
  totalSlides: number;
  nomeAluno: string;
}> = ({ rodada, missoes, slideIndex, totalSlides, nomeAluno }) => {
  // Dividir missoes em duas linhas de 4
  const linha1 = missoes.slice(0, 4);
  const linha2 = missoes.slice(4, 8);

  return (
    <div className="w-full h-full bg-brand-darker flex flex-col p-8 overflow-hidden">
      {/* Header do Slide */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="bg-brand-yellow text-brand-darker px-6 py-2 font-black text-2xl rounded-sm shadow-lg shadow-yellow-500/20">
            {rodada.numero}ª RODADA
          </div>
          <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">
            Slide {slideIndex + 1} / {totalSlides}
          </span>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Cadete</p>
          <p className="text-white font-bold text-lg">{nomeAluno}</p>
        </div>
      </div>

      {/* Grid de Missoes */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Linha 1 */}
        <div className="grid grid-cols-4 gap-4">
          {linha1.map((missao, index) => (
            <MissaoCard key={index} missao={missao} compact />
          ))}
          {/* Preencher espacos vazios */}
          {linha1.length < 4 && Array(4 - linha1.length).fill(null).map((_, i) => (
            <div key={`empty1-${i}`} className="bg-brand-card/10 border border-white/5 rounded-sm border-dashed" />
          ))}
        </div>

        {/* Linha 2 (se houver mais de 4 missoes) */}
        {linha2.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {linha2.map((missao, index) => (
              <MissaoCard key={index} missao={missao} compact />
            ))}
            {/* Preencher espacos vazios */}
            {linha2.length < 4 && Array(4 - linha2.length).fill(null).map((_, i) => (
              <div key={`empty2-${i}`} className="bg-brand-card/10 border border-white/5 rounded-sm border-dashed" />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-gray-600 text-xs uppercase tracking-widest font-bold">
        <span>OUSE PASSAR - A Elite dos Concursos</span>
        <span>Missões {missoes[0]?.numero} - {missoes[missoes.length - 1]?.numero}</span>
      </div>
    </div>
  );
};
// Componente de Capa (Slide 0)
const CoverSlideView: React.FC<{
  nomeAluno: string;
  concurso: string;
  mensagem?: string;
  totalSlides: number;
}> = ({ nomeAluno, concurso, mensagem, totalSlides }) => {
  return (
    <div className="w-full h-full bg-brand-darker flex flex-col p-8 overflow-hidden relative">
      {/* Background Image */}
      <div className="absolute bottom-0 right-0 opacity-20 pointer-events-none">
        <img
          src="https://ousepassar.com/wp-content/uploads/2025/02/PQ-devo-escolher-copiar.webp"
          alt=""
          className="w-[800px] max-w-[80vw] object-contain"
        />
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-12">
        <img
          src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
          alt="Ouse Passar"
          className="h-16 object-contain"
        />
        <div className="text-right">
          <span className="text-brand-yellow font-black text-xl uppercase tracking-widest">
            Slide 01 / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center z-10">
        <h1 className="text-4xl md:text-6xl font-black text-brand-yellow uppercase tracking-tighter mb-4 shadow-yellow-500/20 drop-shadow-2xl">
          CRONOGRAMA TÁTICO
        </h1>
        <p className="text-white text-2xl md:text-3xl font-bold uppercase tracking-widest mb-12">
          {concurso}
        </p>

        <div className="bg-brand-card/50 backdrop-blur-sm border border-brand-yellow/30 p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
          <p className="text-brand-yellow text-sm font-bold uppercase tracking-widest mb-2">Cadete</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase mb-6">{nomeAluno}</h2>

          {mensagem && (
            <div className="border-t border-white/10 pt-6 mt-6">
              <p className="text-xl text-gray-300 italic font-medium">"{mensagem}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export const PlanejamentoPRFView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [planejamento, setPlanejamento] = useState<PlanejamentoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apresentacaoAtiva, setApresentacaoAtiva] = useState(false);
  const [slideAtual, setSlideAtual] = useState(0);

  // Gerar slides para apresentacao
  const gerarSlides = () => {
    const slides: { rodada: Rodada; missoes: Missao[] }[] = [];

    planejamentoPRF.forEach(rodada => {
      // Dividir missoes em grupos de 8 (maximo por slide)
      for (let i = 0; i < rodada.missoes.length; i += 8) {
        slides.push({
          rodada,
          missoes: rodada.missoes.slice(i, i + 8)
        });
      }
    });

    return slides;
  };

  const contentSlides = gerarSlides();
  const totalSlides = contentSlides.length + 1; // +1 para a capa

  useEffect(() => {
    const fetchPlanejamento = async () => {
      if (!id) {
        setError('ID do planejamento não encontrado');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('planejamentos_prf')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Planejamento não encontrado');

        setPlanejamento(data);
      } catch (err: any) {
        console.error('Erro ao buscar planejamento:', err);
        setError('Planejamento não encontrado. Verifique o link.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanejamento();
  }, [id]);

  // Handler de teclas para apresentacao
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!apresentacaoAtiva) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        setSlideAtual(prev => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft') {
        setSlideAtual(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setApresentacaoAtiva(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [apresentacaoAtiva, totalSlides]);

  const handlePrint = () => {
    window.print();
  };

  const handleApresentar = () => {
    setSlideAtual(0);
    setApresentacaoAtiva(true);
    // Tentar entrar em fullscreen
    document.documentElement.requestFullscreen?.().catch(() => { });
  };

  const fecharApresentacao = () => {
    setApresentacaoAtiva(false);
    document.exitFullscreen?.().catch(() => { });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(255,184,0,0.2)]" />
          <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Carregando Missão...</p>
        </div>
      </div>
    );
  }

  if (error || !planejamento) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 backdrop-blur-sm">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-2 uppercase">Acesso Negado</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/planejamento-prf')}
              className="bg-brand-yellow text-brand-darker px-8 py-3 font-black uppercase text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
            >
              Criar Novo Planejamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal de Apresentacao
  if (apresentacaoAtiva) {
    return (
      <div className="fixed inset-0 bg-brand-darker z-50 flex flex-col">
        {/* Controles */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setSlideAtual(prev => Math.max(prev - 1, 0))}
            disabled={slideAtual === 0}
            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <span className="text-white px-4 font-mono font-bold">
            {String(slideAtual + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
          <button
            onClick={() => setSlideAtual(prev => Math.min(prev + 1, totalSlides - 1))}
            disabled={slideAtual === totalSlides - 1}
            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <button
            onClick={fecharApresentacao}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors group"
          >
            <X className="w-6 h-6 text-red-500 group-hover:text-red-400" />
          </button>
        </div>

        {/* Slide Atual */}
        <div className="flex-1">
          {slideAtual === 0 ? (
            <CoverSlideView
              nomeAluno={planejamento.nome_aluno}
              concurso={planejamento.concurso}
              mensagem={planejamento.mensagem_incentivo}
              totalSlides={totalSlides}
            />
          ) : (
            <SlideView
              rodada={contentSlides[slideAtual - 1].rodada}
              missoes={contentSlides[slideAtual - 1].missoes}
              slideIndex={slideAtual}
              totalSlides={totalSlides}
              nomeAluno={planejamento.nome_aluno}
            />
          )}
        </div>

        {/* Instrucoes */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-[10px] uppercase tracking-widest font-bold">
          Use as setas do teclado para navegar | ESC para sair
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker text-white">
      <SEOHead
        title={`Planejamento PRF - ${planejamento.nome_aluno} | Ouse Passar`}
        description="Seu planejamento personalizado para o concurso da PRF"
      />

      {/* Estilos para impressao */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html, body {
            background-color: #0a0a0a !important;
            color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* Padding para simular margem na impressão, mas com background escuro */
          .print-content {
            padding: 8mm !important;
            min-height: 100vh;
            background-color: #0a0a0a !important;
            padding-top: 5mm !important;
          }

          .no-print {
            display: none !important;
          }

          .print-header {
            display: block !important;
          }

          /* Manter grid de 4 colunas na impressão */
          .grid {
            display: grid !important;
          }

          .grid-cols-1 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }

          .md\\:grid-cols-2, .lg\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }

          /* Forçar quebra de página antes de cada rodada */
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Cada rodada controla sua propria paginacao via classes print: */
          .space-y-24 {
            gap: 0 !important;
          }

          /* Preservar cores escuras */
          .bg-brand-darker {
            background-color: #0a0a0a !important;
          }

          .bg-brand-card {
            background-color: #151515 !important;
          }

          .bg-black {
            background-color: #000000 !important;
          }

          .bg-black\\/30 {
            background-color: rgba(0, 0, 0, 0.3) !important;
          }

          /* Preservar cores do texto */
          .text-white {
            color: #ffffff !important;
          }

          .text-gray-300 {
            color: #d1d5db !important;
          }

          .text-gray-400 {
            color: #9ca3af !important;
          }

          .text-gray-500 {
            color: #6b7280 !important;
          }

          .text-gray-600 {
            color: #4b5563 !important;
          }

          .text-brand-yellow {
            color: #FFB800 !important;
          }

          .text-red-500 {
            color: #ef4444 !important;
          }

          /* Preservar bordas */
          .border-brand-yellow\\/30 {
            border-color: rgba(255, 184, 0, 0.3) !important;
          }

          .border-brand-yellow\\/20 {
            border-color: rgba(255, 184, 0, 0.2) !important;
          }

          .border-white\\/10 {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }

          .border-white\\/5 {
            border-color: rgba(255, 255, 255, 0.05) !important;
          }

          /* Ajustar tamanhos para impressão */
          .mb-16 {
            margin-bottom: 20px !important;
          }

          .mb-8 {
            margin-bottom: 10px !important;
          }

          .gap-4 {
            gap: 8px !important;
          }

          .p-4 {
            padding: 8px !important;
          }

          .text-3xl {
            font-size: 1.5rem !important;
          }

          .text-xl {
            font-size: 1rem !important;
          }

          .text-lg {
            font-size: 0.9rem !important;
          }

          .text-sm {
            font-size: 0.7rem !important;
          }

          .text-xs {
            font-size: 0.6rem !important;
          }

          .text-\\[10px\\] {
            font-size: 8px !important;
          }

          /* Cards menores para caber na página */
          .min-h-\\[180px\\] {
            min-height: 120px !important;
          }

          /* Esconder elementos decorativos */
          .blur-3xl, .shadow-2xl, .shadow-lg {
            filter: none !important;
            box-shadow: none !important;
          }

          /* Header da rodada mais compacto */
          .rounded-full {
            border-radius: 4px !important;
            padding: 4px 16px !important;
          }
        }

        @media screen {
          .print-header { display: none; }
        }
      `}</style>

      {/* Header com Botoes de Acao */}
      <div className="no-print sticky top-0 z-40 bg-brand-darker/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/planejamento-prf')}
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
          >
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline font-medium uppercase tracking-wide text-sm">Voltar</span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-card border border-white/10 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline font-medium uppercase tracking-wide text-xs">Imprimir</span>
            </button>
            <button
              onClick={handleApresentar}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-yellow text-brand-darker font-black uppercase tracking-wide text-xs rounded-lg hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:-translate-y-0.5"
            >
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">APRESENTAR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteudo para Impressao e Visualizacao */}
      <div ref={printRef} className="max-w-[1600px] mx-auto px-6 py-12 print-content">
        {/* Header do Planejamento */}
        {/* Header do Planejamento */}
        {/* Header do Planejamento */}
        <div className="mb-8 print:mb-0 text-center relative print:h-[250mm] print:flex print:flex-col print:justify-start print:items-center isolate print:break-after-page print:overflow-hidden print:pt-12">
          {/* Header visivel apenas na impressao */}
          <div className="print-header mb-6 relative z-10">
            <div className="flex justify-center mb-4">
              <img
                src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
                alt="Ouse Passar"
                className="h-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-brand-yellow uppercase tracking-tight">
              CRONOGRAMA OUSE PASSAR - PRF
            </h1>
          </div>



          <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-brand-card border border-brand-yellow/20 rounded-xl p-6 shadow-2xl relative overflow-hidden z-10 max-w-3xl w-full mx-auto">


            <div className="p-3 bg-brand-yellow/10 rounded-lg border border-brand-yellow/20">
              <Target className="w-10 h-10 text-brand-yellow" />
            </div>

            <div className="text-center md:text-left z-10 flex-1">
              <p className="text-brand-yellow font-bold uppercase tracking-widest text-[10px] mb-1">Plano de Estudos Tático</p>
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2">
                {planejamento.nome_aluno}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded px-2.5 py-1">
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300 text-[10px] font-bold uppercase">{planejamento.concurso}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded px-2.5 py-1">
                  <BookOpen className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300 text-[10px] font-bold uppercase">16 Rodadas | 184 Missões</span>
                </div>
              </div>
            </div>
          </div>

          {planejamento.mensagem_incentivo && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="relative py-4 px-6">
                <span className="absolute top-0 left-0 text-4xl text-brand-yellow/20 font-serif">"</span>
                <p className="text-lg text-gray-300 font-medium italic relative z-10">
                  {planejamento.mensagem_incentivo}
                </p>
                <span className="absolute bottom-0 right-0 text-4xl text-brand-yellow/20 font-serif leading-[0] h-3">"</span>
              </div>
            </div>
          )}


        </div>

        {/* Rodadas */}
        <div className="space-y-24">
          {planejamentoPRF.map((rodada, index) => (
            <RodadaSection key={index} rodada={rodada} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-24 pt-12 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">
            Planejamento gerado em {new Date(planejamento.created_at).toLocaleDateString('pt-BR')} | OUSE PASSAR - A Elite dos Concursos
          </p>
        </div>
      </div>
    </div >
  );
};

export default PlanejamentoPRFView;
