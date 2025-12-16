import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Presentation,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Target,
  FileText,
  AlertCircle,
  Lock,
  Check,
  Loader2,
  BarChart2,
  Calendar,
  Menu as MenuIcon,
  ClipboardCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { planejamentoPRF, Rodada as RodadaStatic, Missao as MissaoStatic } from '../lib/planejamentoPRF';
import { SEOHead } from '../components/SEOHead';
import { preparatoriosService, planejamentosService } from '../services/preparatoriosService';
import { PreparatorioCompleto, RodadaComMissoes, Missao as MissaoDB, AdminUser } from '../lib/database.types';
import { useAuth } from '../lib/AuthContext';
import { studentService } from '../services/studentService';
import { missaoService } from '../services/missaoService';

// Interface unificada para rodada (compatível com estático e dinâmico)
interface Rodada {
  numero: number;
  titulo: string;
  nota?: string;
  missoes: Missao[];
}

// Interface unificada para missão
interface Missao {
  numero: string;
  tipo?: string;
  materia?: string;
  assunto?: string;
  instrucoes?: string;
  tema?: string;
  acao?: string;
  extra?: string[];
  obs?: string;
}

interface PlanejamentoData {
  id: string;
  nome_aluno: string;
  email: string | null;
  concurso: string;
  mensagem_incentivo: string;
  created_at: string;
  // Campos dinâmicos
  preparatorio_id?: string;
  cor?: string;
}

// Props do componente MissaoCard
interface MissaoCardProps {
  missao: Missao;
  compact?: boolean;
  isCompleted?: boolean;
  isInteractive?: boolean;
  onClick?: () => void;
}

// Componente de Card da Missao (Estilo Tabela)
const MissaoCard: React.FC<MissaoCardProps> = ({
  missao,
  compact = false,
  isCompleted = false,
  isInteractive = false,
  onClick
}) => {
  const isTemaOuAcao = !missao.materia && (missao.tema || missao.acao);
  const isRevisao = isTemaOuAcao && (missao.tema?.includes('REVISÃO') || missao.acao?.includes('REVISÃO'));

  // Estilos de borda baseados no estado
  const borderColor = isCompleted
    ? 'border-green-700/50' // Verde discreto quando completo
    : 'border-brand-yellow/30';

  // Classes de hover para cards interativos
  const hoverClasses = isInteractive
    ? 'cursor-pointer transition-all duration-300 ease-out hover:-translate-y-[5px] hover:shadow-lg hover:border-brand-yellow/70'
    : '';

  const completedHoverClasses = isCompleted && isInteractive
    ? 'hover:border-green-600/70'
    : '';

  // Layout para Células Especiais (Revisão/Ação)
  if (isTemaOuAcao) {
    return (
      <div
        className={`h-full flex flex-col border ${borderColor} ${compact ? 'min-h-[100px]' : 'min-h-[180px]'} ${hoverClasses} ${completedHoverClasses}`}
        onClick={onClick}
      >
        {/* Header da Célula */}
        <div className={`bg-brand-darker border-b ${borderColor} py-1 px-2 text-center flex items-center justify-center gap-2`}>
          {isCompleted && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          <span className={`font-black text-sm uppercase tracking-wider ${isCompleted ? 'text-green-500' : 'text-brand-yellow'}`}>
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
    <div
      className={`h-full flex flex-col border ${borderColor} bg-brand-card ${compact ? 'text-xs' : ''} ${hoverClasses} ${completedHoverClasses}`}
      onClick={onClick}
    >
      {/* Header da Célula */}
      <div className={`bg-black border-b ${borderColor} py-1.5 px-2 text-center relative overflow-hidden flex items-center justify-center gap-2`}>
        {isCompleted && (
          <Check className="w-4 h-4 text-green-500" />
        )}
        <span className={`font-black text-sm uppercase tracking-wider relative z-10 ${isCompleted ? 'text-green-500' : 'text-brand-yellow'}`}>
          Missão {missao.numero}
        </span>
      </div>

      {/* Corpo da Célula */}
      <div className={`flex-1 p-4 flex flex-col gap-3 ${compact ? 'p-2 gap-1' : ''}`}>

        {/* Matéria */}
        <div className="border-b border-white/5 pb-2">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-80 ${isCompleted ? 'text-green-500' : 'text-brand-yellow'}`}>Matéria</p>
          <p className="text-white font-bold leading-tight">{missao.materia}</p>
        </div>

        {/* Assunto */}
        <div className="flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-80 ${isCompleted ? 'text-green-500' : 'text-brand-yellow'}`}>Assunto</p>
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

// Props do componente RodadaSection
interface RodadaSectionProps {
  rodada: Rodada;
  isInteractive?: boolean;
  isMissaoCompleta?: (rodadaNumero: number, missaoNumero: string) => boolean;
  onMissaoClick?: (rodadaNumero: number, missao: Missao) => void;
}

// Componente de Rodada
const RodadaSection: React.FC<RodadaSectionProps> = ({
  rodada,
  isInteractive = false,
  isMissaoCompleta,
  onMissaoClick
}) => {
  // Dividir missoes em paginas de 6 (apenas para impressao)
  const chunks: Missao[][] = [];
  for (let i = 0; i < rodada.missoes.length; i += 6) {
    chunks.push(rodada.missoes.slice(i, i + 6));
  }

  return (
    <>
      {/* Versao para Tela - Todas as missoes juntas */}
      <div className="mb-16 relative print:hidden">
        {/* Header da Rodada */}
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

        {rodada.nota && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-500/80 text-sm font-medium">{rodada.nota}</p>
          </div>
        )}

        {/* Grid de Missoes - Todas as missoes da rodada */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rodada.missoes.map((missao, mIndex) => (
            <div key={mIndex}>
              <MissaoCard
                missao={missao}
                isInteractive={isInteractive}
                isCompleted={isMissaoCompleta ? isMissaoCompleta(rodada.numero, missao.numero) : false}
                onClick={onMissaoClick ? () => onMissaoClick(rodada.numero, missao) : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Versao para Impressao - Missoes em chunks de 6 por pagina */}
      {chunks.map((chunk, index) => (
        <div key={index} className="hidden print:block mb-16 page-break-inside-avoid relative print:h-screen print:flex print:flex-col print:justify-start print:pt-12 print:pb-8">
          {/* Header da Rodada (Repetido em todas as paginas de impressao) */}
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

          {/* Nota apenas na primeira pagina de impressao */}
          {index === 0 && rodada.nota && (
            <div className="max-w-3xl mx-auto mb-8 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-500/80 text-sm font-medium">{rodada.nota}</p>
            </div>
          )}

          {/* Grid de Missoes - Chunk atual (sem interatividade para impressão) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chunk.map((missao, mIndex) => (
              <div key={mIndex}>
                <MissaoCard
                  missao={missao}
                  isCompleted={isMissaoCompleta ? isMissaoCompleta(rodada.numero, missao.numero) : false}
                />
              </div>
            ))}
          </div>
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
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { user: adminUser, isLoading: isAdminLoading } = useAuth();

  const [planejamento, setPlanejamento] = useState<PlanejamentoData | null>(null);
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apresentacaoAtiva, setApresentacaoAtiva] = useState(false);
  const [slideAtual, setSlideAtual] = useState(0);
  const [isDynamic, setIsDynamic] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Estado para marcação de missões executadas
  const [currentStudent, setCurrentStudent] = useState<AdminUser | null>(null);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [selectedMission, setSelectedMission] = useState<{ rodadaNumero: number; missao: Missao } | null>(null);
  const [showMissionPopup, setShowMissionPopup] = useState(false);
  const [loadingMission, setLoadingMission] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Links de navegação
  const navLinks = [
    { label: 'Calendário', path: `/planejador-semanal/${slug || 'prf'}/${id}`, icon: Calendar, active: false },
    { label: 'Planner', path: `/planner/${slug || 'prf'}/${id}`, icon: ClipboardCheck, active: false },
    { label: 'Planejamento', path: `/planejamento/${slug || 'prf'}/${id}`, icon: Target, active: true },
    { label: 'Edital', path: `/edital-verticalizado/${slug || 'prf'}/${id}`, icon: FileText, active: false },
  ];

  // Gerar slides para apresentacao
  const gerarSlides = () => {
    const slides: { rodada: Rodada; missoes: Missao[] }[] = [];

    rodadas.forEach(rodada => {
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

  // Calcular totais para exibição
  const totalRodadas = rodadas.length;
  const totalMissoes = rodadas.reduce((acc, r) => acc + r.missoes.length, 0);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      if (isAdminLoading) return;

      // Se é admin ou vendedor, tem acesso
      if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'vendedor')) {
        setHasAccess(true);
        setAuthChecked(true);
        return;
      }

      // Verificar se é um aluno logado
      const storedStudent = localStorage.getItem('ouse_student_user');
      if (storedStudent) {
        try {
          const student: AdminUser = JSON.parse(storedStudent);
          if (student && student.role === 'cliente' && id) {
            const canAccess = await studentService.canAccessPlanning(student.id, student.role, id);
            if (canAccess) {
              setCurrentStudent(student); // Salvar o estudante para uso posterior
              setHasAccess(true);
              setAuthChecked(true);
              return;
            }
          }
        } catch (error) {
          console.error('Erro ao verificar acesso do aluno:', error);
        }
      }

      // Se não tem acesso, redirecionar para login
      setAuthChecked(true);
      setHasAccess(false);
    };

    checkAuth();
  }, [adminUser, isAdminLoading, id]);

  // Carregar missões executadas quando o estudante e planejamento estiverem disponíveis
  useEffect(() => {
    const loadCompletedMissions = async () => {
      if (!currentStudent || !id || !isDynamic) return;

      try {
        const executadasSet = await missaoService.getExecutadasSet(currentStudent.id, id);
        setCompletedMissions(executadasSet);
      } catch (error) {
        console.error('Erro ao carregar missões executadas:', error);
      }
    };

    loadCompletedMissions();
  }, [currentStudent, id, isDynamic]);

  // Função para verificar se uma missão está completa
  const isMissaoCompleta = (rodadaNumero: number, missaoNumero: string): boolean => {
    // Extrair o número da missão (pode ser "1", "2,3", etc.)
    const nums = missaoNumero.split(/[,e]/).map(n => n.trim());
    // Se qualquer uno dos números estiver completo, considera como completa
    return nums.some(num => completedMissions.has(`${rodadaNumero}-${num}`));
  };

  // Função para abrir popup de missão
  const handleMissaoClick = (rodadaNumero: number, missao: Missao) => {
    // Só permite interação se for aluno logado e planejamento dinâmico
    if (!currentStudent || !isDynamic) return;

    setSelectedMission({ rodadaNumero, missao });
    setShowMissionPopup(true);
  };

  // Função para marcar missão como executada
  const handleMarcarExecutada = async () => {
    if (!selectedMission || !currentStudent || !id) return;

    setLoadingMission(true);
    try {
      // Extrair números da missão (pode ser "1", "2,3", etc.)
      const nums = selectedMission.missao.numero.split(/[,e]/).map(n => n.trim());

      // Marcar cada número como executado
      for (const num of nums) {
        const numInt = parseInt(num);
        if (!isNaN(numInt)) {
          await missaoService.marcarExecutada(
            currentStudent.id,
            id,
            selectedMission.rodadaNumero,
            numInt
          );
        }
      }

      // Atualizar o set de missões completadas
      const newCompleted = new Set(completedMissions);
      nums.forEach(num => {
        newCompleted.add(`${selectedMission.rodadaNumero}-${num.trim()}`);
      });
      setCompletedMissions(newCompleted);

      setShowMissionPopup(false);
      setSelectedMission(null);
    } catch (error) {
      console.error('Erro ao marcar missão como executada:', error);
    } finally {
      setLoadingMission(false);
    }
  };

  useEffect(() => {
    const fetchPlanejamento = async () => {
      // Aguardar verificação de auth
      if (!authChecked || !hasAccess) return;

      if (!id) {
        setError('ID do planejamento não encontrado');
        setLoading(false);
        return;
      }

      try {
        // Se temos um slug, é uma rota dinâmica
        if (slug) {
          setIsDynamic(true);

          // Buscar planejamento da nova tabela
          const planejamentoData = await planejamentosService.getById(id);
          if (!planejamentoData) throw new Error('Planejamento não encontrado');

          // Buscar preparatório completo com rodadas e missões
          const preparatorio = await preparatoriosService.getCompletoById(planejamentoData.preparatorio_id);
          if (!preparatorio) throw new Error('Preparatório não encontrado');

          // Converter para formato unificado
          const rodadasUnificadas: Rodada[] = preparatorio.rodadas.map((r: RodadaComMissoes) => ({
            numero: r.numero,
            titulo: r.titulo,
            nota: r.nota || undefined,
            missoes: r.missoes.map((m: MissaoDB) => ({
              numero: m.numero,
              tipo: m.tipo,
              materia: m.materia || undefined,
              assunto: m.assunto || undefined,
              instrucoes: m.instrucoes || undefined,
              tema: m.tema || undefined,
              acao: m.acao || undefined,
              extra: m.extra || undefined,
              obs: m.obs || undefined
            }))
          }));

          setRodadas(rodadasUnificadas);
          setPlanejamento({
            id: planejamentoData.id,
            nome_aluno: planejamentoData.nome_aluno,
            email: planejamentoData.email,
            concurso: preparatorio.nome,
            mensagem_incentivo: planejamentoData.mensagem_incentivo || '',
            created_at: planejamentoData.created_at,
            preparatorio_id: planejamentoData.preparatorio_id,
            cor: preparatorio.cor
          });
        } else {
          // Rota sem slug - tentar primeiro na nova tabela, depois na legada

          // Primeiro, tentar buscar na tabela nova (planejamentos)
          const planejamentoData = await planejamentosService.getById(id);

          if (planejamentoData) {
            // Encontrado na tabela nova
            setIsDynamic(true);

            // Buscar preparatório completo com rodadas e missões
            const preparatorio = await preparatoriosService.getCompletoById(planejamentoData.preparatorio_id);
            if (!preparatorio) throw new Error('Preparatório não encontrado');

            // Converter para formato unificado
            const rodadasUnificadas: Rodada[] = preparatorio.rodadas.map((r: RodadaComMissoes) => ({
              numero: r.numero,
              titulo: r.titulo,
              nota: r.nota || undefined,
              missoes: r.missoes.map((m: MissaoDB) => ({
                numero: m.numero,
                tipo: m.tipo,
                materia: m.materia || undefined,
                assunto: m.assunto || undefined,
                instrucoes: m.instrucoes || undefined,
                tema: m.tema || undefined,
                acao: m.acao || undefined,
                extra: m.extra || undefined,
                obs: m.obs || undefined
              }))
            }));

            setRodadas(rodadasUnificadas);
            setPlanejamento({
              id: planejamentoData.id,
              nome_aluno: planejamentoData.nome_aluno,
              email: planejamentoData.email,
              concurso: preparatorio.nome,
              mensagem_incentivo: planejamentoData.mensagem_incentivo || '',
              created_at: planejamentoData.created_at,
              preparatorio_id: planejamentoData.preparatorio_id,
              cor: preparatorio.cor
            });
          } else {
            // Fallback para tabela legada (planejamentos_prf)
            setIsDynamic(false);

            const { data, error: fetchError } = await supabase
              .from('planejamentos_prf')
              .select('*')
              .eq('id', id)
              .single();

            if (fetchError) throw fetchError;
            if (!data) throw new Error('Planejamento não encontrado');

            // Converter dados estáticos para formato unificado
            const rodadasUnificadas: Rodada[] = planejamentoPRF.map((r: RodadaStatic) => ({
              numero: r.numero,
              titulo: r.titulo,
              nota: r.nota,
              missoes: r.missoes.map((m: MissaoStatic) => ({
                numero: m.numero,
                materia: m.materia,
                assunto: m.assunto,
                instrucoes: m.instrucoes,
                tema: m.tema,
                acao: m.acao,
                extra: m.extra,
                obs: m.obs
              }))
            }));

            setRodadas(rodadasUnificadas);
            setPlanejamento(data);
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar planejamento:', err);
        setError('Planejamento não encontrado. Verifique o link.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanejamento();
  }, [id, slug, authChecked, hasAccess]);

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

  // Aguardando verificação de auth
  if (!authChecked || isAdminLoading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(255,184,0,0.2)]" />
          <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Sem acesso - mostrar tela de login
  if (!hasAccess) {
    const currentPath = window.location.pathname;
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
              alt="Ouse Passar"
              className="h-12 mx-auto mb-4"
            />
          </div>

          <div className="bg-brand-card border border-white/10 rounded-sm p-8">
            <div className="w-16 h-16 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-brand-yellow" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
              Acesso Restrito
            </h2>
            <p className="text-gray-400 mb-8">
              Para visualizar este planejamento, você precisa fazer login com os dados de acesso que recebeu.
            </p>

            <button
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)}
              className="w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase tracking-wide hover:bg-brand-yellow/90 transition-colors"
            >
              Fazer Login
            </button>
          </div>

          <p className="text-gray-600 text-sm mt-6">
            Ainda não tem acesso? Entre em contato com seu consultor.
          </p>
        </div>
      </div>
    );
  }

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

      {/* Header com Menu de Navegação */}
      <header className="no-print fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Nome do Aluno */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-brand-yellow font-black text-lg uppercase tracking-tight">
                  {planejamento?.nome_aluno}
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-lg ${
                      link.active
                        ? 'text-brand-yellow bg-brand-yellow/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Botões de Ação (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => navigate(`/dashboard-aluno/${id}`)}
                className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold py-2 px-3 rounded-lg border border-purple-500/30 transition-colors uppercase text-xs"
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden lg:inline">Estatísticas</span>
              </button>
              <button
                onClick={handleApresentar}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-wide text-xs"
              >
                <Presentation className="w-4 h-4" />
                <span className="hidden lg:inline">Apresentar</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-brand-yellow focus:outline-none p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-brand-card border-b border-white/10">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      navigate(link.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 transition-all ${
                      link.active
                        ? 'border-brand-yellow text-brand-yellow bg-white/5'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.label}
                    {link.active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}

              {/* Ações no mobile */}
              <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={() => {
                    navigate(`/dashboard-aluno/${id}`);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase text-purple-400 hover:bg-purple-500/10 transition-all"
                >
                  <BarChart2 className="w-4 h-4" />
                  Estatísticas
                </button>
                <button
                  onClick={() => {
                    handleApresentar();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Presentation className="w-4 h-4" />
                  Modo Apresentação
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Conteudo para Impressao e Visualizacao */}
      <div ref={printRef} className="max-w-[1600px] mx-auto px-6 pt-24 pb-12 print-content">
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
                  <span className="text-gray-300 text-[10px] font-bold uppercase">{totalRodadas} Rodadas | {totalMissoes} Missões</span>
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
          {rodadas.map((rodada, index) => (
            <RodadaSection
              key={index}
              rodada={rodada}
              isInteractive={!!currentStudent && isDynamic}
              isMissaoCompleta={isMissaoCompleta}
              onMissaoClick={handleMissaoClick}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-24 pt-12 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">
            Planejamento gerado em {new Date(planejamento.created_at).toLocaleDateString('pt-BR')} | OUSE PASSAR - A Elite dos Concursos
          </p>
        </div>
      </div>

      {/* Popup de Confirmação de Missão */}
      {showMissionPopup && selectedMission && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => {
              setShowMissionPopup(false);
              setSelectedMission(null);
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-brand-card border border-white/10 rounded-sm w-full max-w-md shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 text-center">
                <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-brand-yellow" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                  Missão {selectedMission.missao.numero}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedMission.rodadaNumero}ª Rodada
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-white text-center text-lg font-medium mb-2">
                  Você já executou esta missão?
                </p>
                {selectedMission.missao.materia && (
                  <p className="text-gray-400 text-center text-sm">
                    {selectedMission.missao.materia}
                    {selectedMission.missao.assunto && ` - ${selectedMission.missao.assunto}`}
                  </p>
                )}
                {selectedMission.missao.tema && (
                  <p className="text-gray-400 text-center text-sm">
                    {selectedMission.missao.tema}
                  </p>
                )}
              </div>

              {/* Footer com botões */}
              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setShowMissionPopup(false);
                    setSelectedMission(null);
                  }}
                  disabled={loadingMission}
                  className="flex-1 px-6 py-3 border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors font-bold uppercase text-sm rounded-sm disabled:opacity-50"
                >
                  Não
                </button>
                <button
                  onClick={handleMarcarExecutada}
                  disabled={loadingMission}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-bold uppercase text-sm hover:bg-green-500 transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingMission ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Sim, executei
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div >
  );
};

export default PlanejamentoPRFView;
