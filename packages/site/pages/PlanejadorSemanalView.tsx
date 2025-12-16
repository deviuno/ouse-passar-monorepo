import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  BookOpen,
  Briefcase,
  Dumbbell,
  Coffee,
  Plus,
  X,
  Moon,
  Check,
  Palette,
  Calendar,
  Target,
  FileText,
  Menu as MenuIcon,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/SEOHead';
import { planejadorService } from '../services/planejadorService';
import {
  AtividadeTipo,
  AtividadeUsuario,
  PlanejadorSlot,
  Planejamento
} from '../lib/database.types';

// Mapa de ícones
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  'book-open': BookOpen,
  'briefcase': Briefcase,
  'dumbbell': Dumbbell,
  'coffee': Coffee
};

// Helper para adicionar transparência a uma cor hex
const addAlpha = (hexColor: string, opacity: number): string => {
  // Converte opacity (0-1) para hex (00-FF)
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hexColor}${alphaHex}`;
};

// Cores disponíveis para novas atividades
const CORES_DISPONIVEIS = [
  '#FFB800', // Amarelo (brand)
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#F97316', // Laranja
  '#06B6D4', // Ciano
  '#EF4444', // Vermelho
];

// Dias da semana
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Componente de Tooltip
const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
}> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-brand-dark border border-white/10 rounded-lg shadow-xl max-w-xs"
          >
            <p className="text-xs text-gray-300 whitespace-nowrap">{content}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-brand-dark" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de Botão de Atividade
const ActivityButton: React.FC<{
  atividade: AtividadeTipo | AtividadeUsuario;
  isSelected: boolean;
  onClick: () => void;
}> = ({ atividade, isSelected, onClick }) => {
  const IconComponent = iconMap[atividade.icone || ''] || BookOpen;

  return (
    <Tooltip content={atividade.descricao || atividade.nome}>
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all duration-200 ${isSelected
          ? 'border-current shadow-lg scale-105'
          : 'border-white/10 hover:border-white/30'
          }`}
        style={{
          borderColor: isSelected ? atividade.cor : undefined,
          backgroundColor: isSelected ? `${atividade.cor}20` : undefined,
          color: isSelected ? atividade.cor : '#9CA3AF'
        }}
      >
        <IconComponent className="w-4 h-4" />
        <span className="font-bold text-sm uppercase tracking-wide">{atividade.nome}</span>
      </button>
    </Tooltip>
  );
};

// Modal para criar nova atividade
const NewActivityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { nome: string; descricao: string; cor: string }) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim(), cor });
    setNome('');
    setDescricao('');
    setCor(CORES_DISPONIVEIS[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-brand-card border border-white/10 rounded-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Nova Atividade</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">
              Nome da Atividade *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Alimentação, Transporte..."
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-yellow/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Breve descrição da atividade"
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">
              <Palette className="w-3 h-3 inline mr-1" />
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {CORES_DISPONIVEIS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${cor === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: c }}
                >
                  {cor === c && <Check className="w-4 h-4 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-white/20 text-gray-400 font-bold uppercase text-sm rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              className="flex-1 py-3 bg-brand-yellow text-brand-darker font-bold uppercase text-sm rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Modal de seleção ativa
const SelectionActiveModal: React.FC<{
  isOpen: boolean;
  atividadeNome: string;
  atividadeCor: string;
  onClose: () => void;
}> = ({ isOpen, atividadeNome, atividadeCor, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-brand-card border-2 rounded-xl px-6 py-4 shadow-2xl pointer-events-auto"
        style={{ borderColor: atividadeCor }}
      >
        <p className="text-white text-center">
          Agora, selecione os horários para{' '}
          <span className="font-bold" style={{ color: atividadeCor }}>
            {atividadeNome}
          </span>
        </p>
        <p className="text-gray-500 text-xs text-center mt-1">
          Clique nos slots para marcar • Clique novamente para desmarcar
        </p>
      </motion.div>
    </div>
  );
};

// Componente Principal
export const PlanejadorSemanalView: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [defaultActivities, setDefaultActivities] = useState<AtividadeTipo[]>([]);
  const [userActivities, setUserActivities] = useState<AtividadeUsuario[]>([]);
  const [slots, setSlots] = useState<PlanejadorSlot[]>([]);

  const [selectedActivity, setSelectedActivity] = useState<AtividadeTipo | AtividadeUsuario | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  // Estados para drag-to-select
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');
  const [pendingSlots, setPendingSlots] = useState<Set<string>>(new Set());
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [horaAcordar, setHoraAcordar] = useState('06:00');
  const [horaDormir, setHoraDormir] = useState('22:00');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horasSono, setHorasSono] = useState(8);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Links de navegação
  const navLinks = [
    { label: 'Calendário', path: `/planejador-semanal/${slug}/${id}`, icon: Calendar, active: true },
    { label: 'Planejamento', path: `/planejamento/${slug}/${id}`, icon: Target, active: false },
    { label: 'Edital', path: `/edital-verticalizado/${slug}/${id}`, icon: FileText, active: false },
  ];

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Buscar planejamento
        const { data: planData } = await supabase
          .from('planejamentos')
          .select('*')
          .eq('id', id)
          .single();

        if (planData) {
          setPlanejamento(planData);
          const acordar = planData.hora_acordar || '06:00';
          const dormir = planData.hora_dormir || '22:00';
          setHoraAcordar(acordar);
          setHoraDormir(dormir);
          setHorarios(planejadorService.gerarHorarios(acordar, dormir));
          setHorasSono(planejadorService.calcularHorasSono(acordar, dormir));
        }

        // Buscar atividades padrão
        const defaultActs = await planejadorService.getDefaultActivities();
        setDefaultActivities(defaultActs);

        // Buscar atividades do usuário
        const userActs = await planejadorService.getUserActivities(id);
        setUserActivities(userActs);

        // Buscar slots
        const slotsData = await planejadorService.getSlots(id);
        setSlots(slotsData);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Todas as atividades
  const allActivities = [...defaultActivities, ...userActivities];

  // Handler para selecionar atividade
  const handleSelectActivity = (atividade: AtividadeTipo | AtividadeUsuario) => {
    if (selectedActivity?.id === atividade.id) {
      setSelectedActivity(null);
    } else {
      setSelectedActivity(atividade);
      setShowSelectionModal(true);
    }
  };

  // Verificar se slot já está marcado com a atividade selecionada
  const isSlotMarkedWithSelected = useCallback((dia: number, hora: string): boolean => {
    if (!selectedActivity) return false;
    const slot = slots.find(s => s.dia_semana === dia && s.hora_inicio === hora);
    if (!slot) return false;
    const atividadeId = slot.atividade_tipo_id || slot.atividade_usuario_id;
    return atividadeId === selectedActivity.id;
  }, [slots, selectedActivity]);

  // Marcar um slot (sem toggle, apenas adicionar/sobrescrever) - com atualização otimista
  const markSlot = useCallback((dia: number, hora: string) => {
    if (!selectedActivity || !id) return;

    const isDefault = 'is_default' in selectedActivity;
    const atividadeTipoId = isDefault ? selectedActivity.id : null;
    const atividadeUsuarioId = isDefault ? null : selectedActivity.id;

    // Verificar se já está marcado com a MESMA atividade (não faz nada)
    const existingSlot = slots.find(s => s.dia_semana === dia && s.hora_inicio === hora);
    if (existingSlot) {
      const existingAtividadeId = existingSlot.atividade_tipo_id || existingSlot.atividade_usuario_id;
      if (existingAtividadeId === selectedActivity.id) {
        return; // Já está marcado com a mesma atividade, não precisa fazer nada
      }
    }

    // Criar slot local
    const newSlot: PlanejadorSlot = {
      id: `local-${Date.now()}-${dia}-${hora}`,
      planejamento_id: id,
      dia_semana: dia,
      hora_inicio: hora,
      atividade_tipo_id: atividadeTipoId,
      atividade_usuario_id: atividadeUsuarioId,
      created_at: new Date().toISOString()
    };

    // Adicionar à UI imediatamente (remove o existente se houver, depois adiciona o novo)
    setSlots(prev => {
      const filtered = prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora));
      return [...filtered, newSlot];
    });

    // Salvar no banco em background (não espera, não remove se falhar)
    planejadorService.setSlot(id, dia, hora, atividadeTipoId, atividadeUsuarioId)
      .then(savedSlot => {
        // Atualizar com o ID real do banco
        setSlots(prev => prev.map(s =>
          (s.dia_semana === dia && s.hora_inicio === hora) ? savedSlot : s
        ));
      })
      .catch(error => {
        console.error('Erro ao salvar slot no banco:', error);
        // Mantém o slot na UI mesmo com erro
      });
  }, [selectedActivity, id, slots]);

  // Desmarcar um slot - com atualização otimista
  const unmarkSlot = useCallback((dia: number, hora: string) => {
    if (!id) return;

    // Remove da UI imediatamente
    setSlots(prev => prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora)));

    // Remover do banco em background (não restaura se falhar)
    planejadorService.clearSlot(id, dia, hora)
      .catch(error => {
        console.error('Erro ao desmarcar slot no banco:', error);
        // Mantém removido na UI mesmo com erro
      });
  }, [id]);

  // Handler para iniciar drag (mousedown)
  const handleSlotMouseDown = useCallback((dia: number, hora: string, e: React.MouseEvent) => {
    if (!selectedActivity) return;
    e.preventDefault();

    // Determinar modo: se o slot já está marcado com a atividade atual, modo é 'remove'
    const alreadyMarked = isSlotMarkedWithSelected(dia, hora);
    setDragMode(alreadyMarked ? 'remove' : 'add');
    setIsDragging(true);

    // Marcar/desmarcar o primeiro slot imediatamente
    if (alreadyMarked) {
      unmarkSlot(dia, hora);
    } else {
      markSlot(dia, hora);
    }
  }, [selectedActivity, isSlotMarkedWithSelected, markSlot, unmarkSlot]);

  // Handler para drag (mouseenter enquanto arrastando)
  const handleSlotMouseEnter = useCallback((dia: number, hora: string) => {
    if (!isDragging || !selectedActivity) return;

    if (dragMode === 'add') {
      markSlot(dia, hora);
    } else {
      unmarkSlot(dia, hora);
    }
  }, [isDragging, selectedActivity, dragMode, markSlot, unmarkSlot]);

  // Handler para finalizar drag (mouseup)
  const handleSlotMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Adicionar listener global para mouseup (caso o usuário solte fora do grid)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Handler para clique simples (toggle)
  const handleSlotClick = useCallback(async (dia: number, hora: string) => {
    if (!selectedActivity || !id) return;

    const isDefault = 'is_default' in selectedActivity;
    const atividadeTipoId = isDefault ? selectedActivity.id : null;
    const atividadeUsuarioId = isDefault ? null : selectedActivity.id;

    try {
      const result = await planejadorService.toggleSlot(
        id,
        dia,
        hora,
        atividadeTipoId,
        atividadeUsuarioId,
        slots
      );

      if (result.action === 'removed') {
        setSlots(prev => prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora)));
      } else if (result.slot) {
        setSlots(prev => {
          const filtered = prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora));
          return [...filtered, result.slot!];
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar slot:', error);
    }
  }, [selectedActivity, id, slots]);

  // Handler para criar nova atividade
  const handleCreateActivity = async (data: { nome: string; descricao: string; cor: string }) => {
    if (!id) return;

    try {
      const newActivity = await planejadorService.createUserActivity({
        planejamento_id: id,
        nome: data.nome,
        descricao: data.descricao,
        cor: data.cor
      });
      setUserActivities(prev => [...prev, newActivity]);
      setSelectedActivity(newActivity);
      setShowSelectionModal(true);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
    }
  };

  // Obter cor do slot - retorna amarelo (#FFB800) como fallback se slot existe mas cor não encontrada
  const getSlotColor = (dia: number, hora: string): string | null => {
    const slot = slots.find(s => s.dia_semana === dia && s.hora_inicio === hora);
    if (!slot) return null;

    const atividadeId = slot.atividade_tipo_id || slot.atividade_usuario_id;
    const atividade = allActivities.find(a => a.id === atividadeId);

    // Se encontrou a atividade, usa a cor dela. Senão, usa amarelo como fallback.
    return atividade?.cor || '#FFB800';
  };

  // Verificar se um slot está marcado (independente da atividade)
  const isSlotMarked = (dia: number, hora: string): boolean => {
    return slots.some(s => s.dia_semana === dia && s.hora_inicio === hora);
  };

  // Verificar se é hora inteira ou meia hora
  const isFullHour = (hora: string) => hora.endsWith(':00');
  const isHalfHour = (hora: string) => hora.endsWith(':30');
  const isTimeMarker = (hora: string) => hora.endsWith(':00') || hora.endsWith(':30');

  // Agrupar horários em pares de 30 minutos para exibição
  const horariosAgrupados: { inicio: string; slots: string[] }[] = [];
  for (let i = 0; i < horarios.length; i += 2) {
    horariosAgrupados.push({
      inicio: horarios[i],
      slots: horarios.slice(i, i + 2)
    });
  }

  // Calcular resumo
  const resumo = planejadorService.calcularResumo(slots, allActivities);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker text-white pb-20">
      <SEOHead title="Planejador Semanal | Ouse Passar" />

      {/* Header Fixo com Menu */}
      <header className="fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 z-50">
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

            {/* Info de sono (desktop) */}
            <div className="hidden md:flex items-center gap-2 bg-brand-card border border-white/10 rounded-lg px-3 py-2">
              <Moon className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">
                <span className="font-bold text-white">{horasSono}h</span> de sono
              </span>
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
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-brand-card border-b border-white/10"
            >
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

                {/* Info de sono no mobile */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 mt-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">
                    <span className="font-bold text-white">{horasSono}h</span> de sono
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20 px-4 max-w-7xl mx-auto">
        {/* Resumo - Cards no topo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-brand-card border border-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Semanal</p>
            <p className="text-2xl font-black text-white">{resumo.totalHoras}h</p>
          </div>
          {Object.entries(resumo.horasPorAtividade).slice(0, 3).map(([atId, data]) => (
            <div key={atId} className="bg-brand-card border border-white/5 rounded-lg p-4">
              <p className="text-xs uppercase font-bold" style={{ color: data.cor }}>
                {data.nome}
              </p>
              <p className="text-2xl font-black text-white">{data.horas}h</p>
            </div>
          ))}
        </div>

        {/* Barra de Atividades - Abaixo dos cards */}
        <div className="sticky top-16 z-40 bg-brand-darker/95 backdrop-blur-md py-4 border-b border-white/5 -mx-4 px-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {defaultActivities.map(atividade => (
              <ActivityButton
                key={atividade.id}
                atividade={atividade}
                isSelected={selectedActivity?.id === atividade.id}
                onClick={() => handleSelectActivity(atividade)}
              />
            ))}

            {userActivities.map(atividade => (
              <ActivityButton
                key={atividade.id}
                atividade={atividade}
                isSelected={selectedActivity?.id === atividade.id}
                onClick={() => handleSelectActivity(atividade)}
              />
            ))}

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-white/20 text-gray-500 hover:border-white/40 hover:text-gray-300 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold text-sm uppercase tracking-wide">Novo</span>
            </button>
          </div>

          {selectedActivity && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Selecionado:{' '}
              <span className="font-bold" style={{ color: selectedActivity.cor }}>
                {selectedActivity.nome}
              </span>
              {' '}• Clique ou arraste para marcar vários horários
            </p>
          )}
        </div>

        {/* Calendário */}
        <div className="bg-brand-card border border-white/5 rounded-xl overflow-hidden">
          {/* Header do calendário */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/10">
            <div className="p-2 bg-brand-dark/50 border-r border-white/5">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Hora</span>
            </div>
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="p-2 bg-brand-dark/50 text-center border-r border-white/5 last:border-r-0"
              >
                <span className="text-[10px] text-gray-400 font-bold uppercase">{dia}</span>
              </div>
            ))}
          </div>

          {/* Grid de horários - Agrupado em blocos de 30 min */}
          <div className="max-h-[55vh] overflow-y-auto">
            {horariosAgrupados.map((grupo, grupoIdx) => (
              <div
                key={grupo.inicio}
                className={`grid grid-cols-[60px_repeat(7,1fr)] ${isFullHour(grupo.inicio) ? 'border-t-2 border-white/20' : 'border-t border-white/10'}`}
              >
                {/* Coluna de hora - Mostra :00 e :30 */}
                <div className="border-r border-white/5 flex items-center justify-center bg-brand-dark/20">
                  <span className="text-[10px] text-gray-500 font-mono">{grupo.inicio}</span>
                </div>

                {/* Slots de cada dia - 2 linhas de 15 min por grupo */}
                {DIAS_SEMANA.map((_, diaIdx) => (
                  <div key={diaIdx} className="flex flex-col border-r border-white/5 last:border-r-0">
                    {grupo.slots.map((hora, slotIdx) => {
                      const slotColor = getSlotColor(diaIdx, hora);
                      const marked = isSlotMarked(diaIdx, hora);
                      const isSelected = selectedActivity !== null;
                      // Cor efetiva: se marcado, usa a cor do slot (ou amarelo). Se não marcado, null.
                      const effectiveColor = marked ? (slotColor || '#FFB800') : null;

                      return (
                        <div
                          key={`${diaIdx}-${hora}`}
                          onMouseDown={(e) => handleSlotMouseDown(diaIdx, hora, e)}
                          onMouseEnter={() => handleSlotMouseEnter(diaIdx, hora)}
                          onMouseUp={handleSlotMouseUp}
                          className={`h-5 relative select-none ${
                            slotIdx === 0 ? '' : 'border-t border-white/5'
                          } ${
                            isSelected
                              ? 'cursor-pointer'
                              : 'cursor-default'
                          } ${
                            !marked && isSelected
                              ? 'hover:bg-brand-yellow/20'
                              : ''
                          } ${
                            isDragging ? 'transition-none' : 'transition-all duration-150'
                          }`}
                          style={{
                            backgroundColor: effectiveColor
                              ? addAlpha(effectiveColor, 0.2)
                              : (isSelected ? 'rgba(10,10,10,0.5)' : 'rgba(10,10,10,0.3)')
                          }}
                        >
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {allActivities.map(atividade => {
            const horas = resumo.horasPorAtividade[atividade.id]?.horas || 0;
            return (
              <div key={atividade.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: atividade.cor }}
                />
                <span className="text-sm text-gray-400">
                  {atividade.nome}: <span className="text-white font-bold">{horas}h</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Botão Ver Planejamento */}
        <div className="mt-10 mb-6">
          <button
            onClick={() => navigate(`/planejamento/${slug}/${id}`)}
            className="w-full md:w-auto bg-brand-yellow text-brand-darker px-8 py-4 font-black uppercase tracking-wider text-sm hover:bg-yellow-400 transition-all flex items-center justify-center gap-3 rounded-lg shadow-lg shadow-brand-yellow/20 hover:shadow-brand-yellow/30 hover:scale-[1.02]"
          >
            <Target className="w-5 h-5" />
            Ver Planejamento
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-gray-500 text-xs mt-2 text-center md:text-left">
            Acesse suas missões e acompanhe seu progresso
          </p>
        </div>
      </main>

      {/* Modais */}
      <NewActivityModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreateActivity}
      />

      <AnimatePresence>
        {showSelectionModal && selectedActivity && (
          <SelectionActiveModal
            isOpen={showSelectionModal}
            atividadeNome={selectedActivity.nome}
            atividadeCor={selectedActivity.cor}
            onClose={() => setShowSelectionModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
