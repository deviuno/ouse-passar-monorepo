import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
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
  Car,
  Utensils,
  Gamepad2,
  Music,
  Tv,
  Heart,
  ShoppingBag,
  GraduationCap,
  Baby,
  Dog,
  Plane,
  Home,
  Sparkles,
  Smile,
  Pencil,
  Trash2,
  Eraser
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/SEOHead';
import { planejadorService } from '../services/planejadorService';
import { Tables } from '../lib/database.types';

type AtividadeTipo = Tables<'atividade_tipos'>;
type AtividadeUsuario = Tables<'atividade_tipos_usuario'>;
type PlanejadorSlot = Tables<'planejador_semanal'>;
type Planejamento = Tables<'planejamentos'>;
import { useQueryClient } from '@tanstack/react-query';
import {
  useDefaultActivities,
  useUserActivities,
  usePlanejadorSlots,
  plannerKeys,
  planejadorKeys,
} from '../hooks/usePlannerData';

// Mapa de ícones
const iconMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  'book-open': BookOpen,
  'briefcase': Briefcase,
  'dumbbell': Dumbbell,
  'coffee': Coffee,
  'car': Car,
  'utensils': Utensils,
  'gamepad': Gamepad2,
  'music': Music,
  'tv': Tv,
  'heart': Heart,
  'shopping': ShoppingBag,
  'graduation': GraduationCap,
  'baby': Baby,
  'dog': Dog,
  'plane': Plane,
  'home': Home,
  'sparkles': Sparkles,
  'smile': Smile
};

// Lista de ícones disponíveis para seleção
const ICONES_DISPONIVEIS = [
  { id: 'book-open', nome: 'Livro', icon: BookOpen },
  { id: 'briefcase', nome: 'Trabalho', icon: Briefcase },
  { id: 'dumbbell', nome: 'Exercício', icon: Dumbbell },
  { id: 'coffee', nome: 'Descanso', icon: Coffee },
  { id: 'car', nome: 'Transporte', icon: Car },
  { id: 'utensils', nome: 'Alimentação', icon: Utensils },
  { id: 'gamepad', nome: 'Games', icon: Gamepad2 },
  { id: 'music', nome: 'Música', icon: Music },
  { id: 'tv', nome: 'TV', icon: Tv },
  { id: 'heart', nome: 'Saúde', icon: Heart },
  { id: 'shopping', nome: 'Compras', icon: ShoppingBag },
  { id: 'graduation', nome: 'Curso', icon: GraduationCap },
  { id: 'baby', nome: 'Família', icon: Baby },
  { id: 'dog', nome: 'Pet', icon: Dog },
  { id: 'plane', nome: 'Viagem', icon: Plane },
  { id: 'home', nome: 'Casa', icon: Home },
  { id: 'sparkles', nome: 'Hobby', icon: Sparkles },
  { id: 'smile', nome: 'Lazer', icon: Smile },
];

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
  '#84CC16', // Lima
  '#A855F7', // Violeta
];

// Dias da semana
// Dias da semana
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DIAS_SEMANA_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

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
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg shadow-xl max-w-xs"
          >
            <p className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{content}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[var(--color-bg-secondary)]" />
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
  isUserActivity: boolean;
  onClick: () => void;
  onEditClick?: () => void;
}> = ({ atividade, isSelected, isUserActivity, onClick, onEditClick }) => {
  const IconComponent = iconMap[atividade.icone || ''] || BookOpen;

  return (
    <Tooltip content={atividade.descricao || atividade.nome}>
      <div className="relative">
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
          <IconComponent className="w-4 h-4" style={{ color: atividade.cor }} />
          <span className="font-bold text-sm uppercase tracking-wide">{atividade.nome}</span>
        </button>
        {/* Ícone de editar - só aparece para atividades do usuário quando selecionadas */}
        {isUserActivity && isSelected && onEditClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-full flex items-center justify-center hover:bg-[var(--color-bg-hover)] transition-colors"
            title="Editar atividade"
          >
            <Pencil className="w-2.5 h-2.5 text-gray-400" />
          </button>
        )}
      </div>
    </Tooltip>
  );
};

// Modal para criar nova atividade
const NewActivityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { nome: string; descricao: string; cor: string; icone: string }) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0]);
  const [icone, setIcone] = useState(ICONES_DISPONIVEIS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onCreate({ nome: nome.trim(), descricao: descricao.trim(), cor, icone });
    setNome('');
    setDescricao('');
    setCor(CORES_DISPONIVEIS[0]);
    setIcone(ICONES_DISPONIVEIS[0].id);
    onClose();
  };

  if (!isOpen) return null;

  const IconeSelecionado = ICONES_DISPONIVEIS.find(i => i.id === icone)?.icon || BookOpen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col theme-transition"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-light)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Nova Atividade</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-[var(--color-bg-secondary)]/50 rounded-xl">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2"
              style={{ borderColor: cor, backgroundColor: `${cor}20` }}
            >
              <IconeSelecionado className="w-5 h-5" style={{ color: cor }} />
              <span className="font-bold text-sm uppercase" style={{ color: cor }}>
                {nome || 'Nome da atividade'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
              Nome da Atividade *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Alimentação, Transporte..."
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Breve descrição da atividade"
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50"
            />
          </div>

          {/* Seleção de Ícone */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-[var(--color-bg-secondary)]/30 rounded-lg max-h-32 overflow-y-auto">
              {ICONES_DISPONIVEIS.map(item => {
                const IconComponent = item.icon;
                const isSelected = icone === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcone(item.id)}
                    title={item.nome}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isSelected
                        ? 'bg-white/20 ring-2 ring-white scale-110'
                        : 'bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: isSelected ? cor : '#9CA3AF' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de Cor */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
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
              className="flex-1 py-3 border border-[var(--color-border-light)] text-[var(--color-text-secondary)] font-bold uppercase text-sm rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              className="flex-1 py-3 bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-bold uppercase text-sm rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Modal para editar atividade existente
const EditActivityModal: React.FC<{
  isOpen: boolean;
  atividade: AtividadeUsuario | null;
  onClose: () => void;
  onSave: (data: { nome: string; descricao: string; cor: string; icone: string }) => void;
  onDelete: () => void;
}> = ({ isOpen, atividade, onClose, onSave, onDelete }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0]);
  const [icone, setIcone] = useState(ICONES_DISPONIVEIS[0].id);

  // Preencher dados quando a atividade mudar
  useEffect(() => {
    if (atividade) {
      setNome(atividade.nome);
      setDescricao(atividade.descricao || '');
      setCor(atividade.cor);
      setIcone(atividade.icone || ICONES_DISPONIVEIS[0].id);
    }
  }, [atividade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onSave({ nome: nome.trim(), descricao: descricao.trim(), cor, icone });
  };

  if (!isOpen || !atividade) return null;

  const IconeSelecionado = ICONES_DISPONIVEIS.find(i => i.id === icone)?.icon || BookOpen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col theme-transition"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-light)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Editar Atividade</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-[var(--color-error-light)] rounded-lg transition-colors group"
              title="Excluir atividade"
            >
              <Trash2 className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-error)]" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-[var(--color-bg-secondary)]/50 rounded-xl">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2"
              style={{ borderColor: cor, backgroundColor: `${cor}20` }}
            >
              <IconeSelecionado className="w-5 h-5" style={{ color: cor }} />
              <span className="font-bold text-sm uppercase" style={{ color: cor }}>
                {nome || 'Nome da atividade'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
              Nome da Atividade *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Alimentação, Transporte..."
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Breve descrição da atividade"
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50"
            />
          </div>

          {/* Seleção de Ícone */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-[var(--color-bg-secondary)]/30 rounded-lg max-h-32 overflow-y-auto">
              {ICONES_DISPONIVEIS.map(item => {
                const IconComponent = item.icon;
                const isSelected = icone === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcone(item.id)}
                    title={item.nome}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isSelected
                        ? 'bg-white/20 ring-2 ring-white scale-110'
                        : 'bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: isSelected ? cor : '#9CA3AF' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de Cor */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">
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
              className="flex-1 py-3 border border-[var(--color-border-light)] text-[var(--color-text-secondary)] font-bold uppercase text-sm rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              className="flex-1 py-3 bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-bold uppercase text-sm rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Modal de confirmação de exclusão
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  atividadeNome: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, atividadeNome, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl w-full max-w-sm overflow-hidden theme-transition"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-[var(--color-error-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-[var(--color-error)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Excluir Atividade</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">
            Tem certeza que deseja excluir <span className="text-[var(--color-text-primary)] font-medium">"{atividadeNome}"</span>?
            <br />
            <span className="text-[var(--color-error)]/80 text-xs">Esta ação não pode ser desfeita.</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-[var(--color-border-light)] text-[var(--color-text-secondary)] font-bold uppercase text-sm rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-[var(--color-error)] text-white font-bold uppercase text-sm rounded-lg hover:bg-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
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
        className="bg-[var(--color-bg-card)] border-2 rounded-xl px-6 py-4 shadow-2xl pointer-events-auto theme-transition"
        style={{ borderColor: atividadeCor }}
      >
        <p className="text-[var(--color-text-primary)] text-center">
          Agora, selecione os horários para{' '}
          <span className="font-bold" style={{ color: atividadeCor }}>
            {atividadeNome}
          </span>
        </p>
        <p className="text-[var(--color-text-muted)] text-xs text-center mt-1">
          Clique nos slots para marcar • Clique novamente para desmarcar
        </p>
      </motion.div>
    </div>
  );
};

// Componente Principal
// Tipo do contexto do layout
interface PlannerContext {
  planejamento: Planejamento | null;
  slug: string;
  id: string;
}

export const PlanejadorSemanalView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const context = useOutletContext<PlannerContext>();
  const planejamento = context?.planejamento;
  const queryClient = useQueryClient();

  // React Query hooks para cache de dados
  const { data: defaultActivitiesData, isLoading: loadingDefault } = useDefaultActivities();
  const { data: userActivitiesData, isLoading: loadingUser } = useUserActivities(id);
  const { data: slotsData, isLoading: loadingSlots } = usePlanejadorSlots(id);

  // Estados locais para edições otimistas
  const [localSlots, setLocalSlots] = useState<PlanejadorSlot[]>([]);
  const [localUserActivities, setLocalUserActivities] = useState<AtividadeUsuario[]>([]);

  // Combinar loading states
  const loading = loadingDefault || loadingUser || loadingSlots;

  // Dados com fallback
  const defaultActivities = defaultActivitiesData || [];
  const userActivities = localUserActivities.length > 0 ? localUserActivities : (userActivitiesData || []);
  const slots = localSlots.length > 0 ? localSlots : (slotsData || []);

  // Sincronizar dados do cache com estados locais
  useEffect(() => {
    if (slotsData) setLocalSlots(slotsData);
  }, [slotsData]);

  useEffect(() => {
    if (userActivitiesData) setLocalUserActivities(userActivitiesData);
  }, [userActivitiesData]);

  const today = new Date().getDay();
  // Ajustar para visualIndex onde 0=Segunda ... 6=Domingo (Date.getDay retorna 0=Domingo)
  const currentDay = today === 0 ? 6 : today - 1;

  // Helper para mapear índice visual para índice do banco (0=Dom, 1=Seg, etc)
  const getDbDayIndex = (visualIndex: number) => (visualIndex + 1) % 7;

  const [selectedActivity, setSelectedActivity] = useState<AtividadeTipo | AtividadeUsuario | null>(null);
  const [eraserMode, setEraserMode] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<AtividadeUsuario | null>(null);

  // Estados para feedback de interação
  const [isShaking, setIsShaking] = useState(false);
  const [interactionTooltip, setInteractionTooltip] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  });
  const buttonsContainerRef = useRef<HTMLDivElement>(null);

  // Estados para drag-to-select
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');
  const [pendingSlots, setPendingSlots] = useState<Set<string>>(new Set());
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [horaAcordar, setHoraAcordar] = useState('06:00');
  const [horaDormir, setHoraDormir] = useState('22:00');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horasSono, setHorasSono] = useState(8);

  // Configurar horários quando planejamento estiver disponível do contexto
  useEffect(() => {
    if (planejamento) {
      // Garantir formato HH:MM (remover segundos se vier HH:MM:SS)
      const acordar = (planejamento.hora_acordar || '06:00').substring(0, 5);
      const dormir = (planejamento.hora_dormir || '22:00').substring(0, 5);

      setHoraAcordar(acordar);
      setHoraDormir(dormir);

      const horariosGerados = planejadorService.gerarHorarios(acordar, dormir);
      // Se não gerou horários (ex: horários inválidos), usar valores padrão
      if (horariosGerados.length === 0) {
        console.warn('Horários inválidos, usando padrão 06:00-22:00');
        setHorarios(planejadorService.gerarHorarios('06:00', '22:00'));
        setHorasSono(8);
      } else {
        setHorarios(horariosGerados);
        setHorasSono(planejadorService.calcularHorasSono(acordar, dormir));
      }
    }
  }, [planejamento]);


  // Todas as atividades
  const allActivities = [...defaultActivities, ...userActivities];

  // Handler para selecionar atividade
  const handleSelectActivity = (atividade: AtividadeTipo | AtividadeUsuario) => {
    setEraserMode(false); // Desativa modo borracha ao selecionar atividade
    if (selectedActivity?.id === atividade.id) {
      setSelectedActivity(null);
    } else {
      setSelectedActivity(atividade);
      setShowSelectionModal(true);
    }
  };

  // Handler para ativar modo borracha
  const handleEraserMode = () => {
    setSelectedActivity(null);
    setEraserMode(!eraserMode);
  };

  // Verificar se slot já está marcado com a atividade selecionada
  const isSlotMarkedWithSelected = useCallback((dia: number, hora: string): boolean => {
    if (!selectedActivity) return false;
    const slot = slots.find(s => s.dia_semana === dia && s.hora_inicio === hora);
    if (!slot) return false;
    const atividadeId = slot.atividade_tipo_id || slot.atividade_usuario_id;
    return atividadeId === selectedActivity.id;
  }, [slots, selectedActivity]);

  // Verificar se um slot está marcado (independente da atividade)
  const isSlotMarked = useCallback((dia: number, hora: string): boolean => {
    return slots.some(s => s.dia_semana === dia && s.hora_inicio === hora);
  }, [slots]);

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
    setLocalSlots(prev => {
      const filtered = prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora));
      return [...filtered, newSlot];
    });

    // Salvar no banco em background (não espera, não remove se falhar)
    planejadorService.setSlot(id, dia, hora, atividadeTipoId, atividadeUsuarioId)
      .then(savedSlot => {
        // Atualizar com o ID real do banco
        setLocalSlots(prev => prev.map(s =>
          (s.dia_semana === dia && s.hora_inicio === hora) ? savedSlot : s
        ));
        // Invalidar cache de atividades de hoje para refletir no Cockpit
        queryClient.invalidateQueries({ queryKey: plannerKeys.atividadesHoje(id) });
      })
      .catch(error => {
        console.error('Erro ao salvar slot no banco:', error);
        // Mantém o slot na UI mesmo com erro
      });
  }, [selectedActivity, id, slots, queryClient]);

  // Desmarcar um slot - com atualização otimista
  const unmarkSlot = useCallback((dia: number, hora: string) => {
    if (!id) return;

    // Remove da UI imediatamente
    setLocalSlots(prev => prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora)));

    // Remover do banco em background (não restaura se falhar)
    planejadorService.clearSlot(id, dia, hora)
      .then(() => {
        // Invalidar cache de atividades de hoje para refletir no Cockpit
        queryClient.invalidateQueries({ queryKey: plannerKeys.atividadesHoje(id) });
      })
      .catch(error => {
        console.error('Erro ao desmarcar slot no banco:', error);
        // Mantém removido na UI mesmo com erro
      });
  }, [id, queryClient]);

  // Handler para iniciar drag (mousedown)
  const handleSlotMouseDown = useCallback((dia: number, hora: string, e: React.MouseEvent) => {
    // Modo borracha - sempre inicia drag para remover
    if (eraserMode) {
      e.preventDefault();
      setDragMode('remove');
      setIsDragging(true);
      // Se o slot inicial tem tarefa, apaga
      if (isSlotMarked(dia, hora)) {
        unmarkSlot(dia, hora);
      }
      return;
    }

    // Se não tiver atividade selecionada, pedir para selecionar
    if (!selectedActivity) {
      e.preventDefault();
      e.stopPropagation();

      // 1. Scroll para botões
      buttonsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 2. Shake effect
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      // 3. Tooltip
      setInteractionTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY
      });
      setTimeout(() => setInteractionTooltip(prev => ({ ...prev, visible: false })), 2000);

      return;
    }

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
  }, [selectedActivity, eraserMode, isSlotMarkedWithSelected, isSlotMarked, markSlot, unmarkSlot]);

  // Handler para drag (mouseenter enquanto arrastando)
  const handleSlotMouseEnter = useCallback((dia: number, hora: string) => {
    if (!isDragging) return;

    // Modo borracha - só remove
    if (eraserMode) {
      if (isSlotMarked(dia, hora)) {
        unmarkSlot(dia, hora);
      }
      return;
    }

    if (!selectedActivity) return;

    if (dragMode === 'add') {
      markSlot(dia, hora);
    } else {
      unmarkSlot(dia, hora);
    }
  }, [isDragging, selectedActivity, eraserMode, dragMode, markSlot, unmarkSlot, isSlotMarked]);

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
    if (!id) return;
    // Se não tiver activity, a lógica já foi tratada no mouseDown (feedback visual)
    if (!selectedActivity) return;

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
        setLocalSlots(prev => prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora)));
      } else if (result.slot) {
        setLocalSlots(prev => {
          const filtered = prev.filter(s => !(s.dia_semana === dia && s.hora_inicio === hora));
          return [...filtered, result.slot!];
        });
      }
      // Invalidar cache de atividades de hoje para refletir no Cockpit
      queryClient.invalidateQueries({ queryKey: plannerKeys.atividadesHoje(id) });
    } catch (error) {
      console.error('Erro ao atualizar slot:', error);
    }
  }, [selectedActivity, id, slots, queryClient]);

  // Handler para criar nova atividade
  const handleCreateActivity = async (data: { nome: string; descricao: string; cor: string; icone: string }) => {
    if (!id) return;

    try {
      const newActivity = await planejadorService.createUserActivity({
        planejamento_id: id,
        nome: data.nome,
        descricao: data.descricao,
        cor: data.cor,
        icone: data.icone
      });
      setLocalUserActivities(prev => [...prev, newActivity]);
      setSelectedActivity(newActivity);
      setShowSelectionModal(true);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
    }
  };

  // Handler para abrir modal de edição
  const handleOpenEditModal = (atividade: AtividadeUsuario) => {
    setEditingActivity(atividade);
    setShowEditModal(true);
  };

  // Handler para salvar edição de atividade
  const handleSaveActivity = async (data: { nome: string; descricao: string; cor: string; icone: string }) => {
    if (!editingActivity) return;

    try {
      const updated = await planejadorService.updateUserActivity(editingActivity.id, {
        nome: data.nome,
        descricao: data.descricao,
        cor: data.cor,
        icone: data.icone
      });
      setLocalUserActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
      // Se a atividade editada estava selecionada, atualizar a seleção
      if (selectedActivity?.id === updated.id) {
        setSelectedActivity(updated);
      }
      setShowEditModal(false);
      setEditingActivity(null);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
    }
  };

  // Handler para abrir modal de confirmação de exclusão
  const handleOpenDeleteModal = () => {
    setShowEditModal(false);
    setShowDeleteModal(true);
  };

  // Handler para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!editingActivity || !id) return;

    try {
      await planejadorService.deleteUserActivity(editingActivity.id);
      // Remover a atividade da lista
      setLocalUserActivities(prev => prev.filter(a => a.id !== editingActivity.id));
      // Se a atividade excluída estava selecionada, limpar seleção
      if (selectedActivity?.id === editingActivity.id) {
        setSelectedActivity(null);
      }
      // Remover slots associados a essa atividade do estado local
      setLocalSlots(prev => prev.filter(s => s.atividade_usuario_id !== editingActivity.id));
      // Invalidar cache de atividades de hoje para refletir no Cockpit
      queryClient.invalidateQueries({ queryKey: plannerKeys.atividadesHoje(id) });
      setShowDeleteModal(false);
      setEditingActivity(null);
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
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

  // Obter nome da atividade do slot para tooltip
  const getSlotActivityName = (dia: number, hora: string): string | null => {
    const slot = slots.find(s => s.dia_semana === dia && s.hora_inicio === hora);
    if (!slot) return null;

    const atividadeId = slot.atividade_tipo_id || slot.atividade_usuario_id;
    const atividade = allActivities.find(a => a.id === atividadeId);

    return atividade?.nome || null;
  };

  // Verificar se é hora inteira ou meia hora
  const isFullHour = (hora: string) => hora.endsWith(':00');
  const isHalfHour = (hora: string) => hora.endsWith(':30');
  const isTimeMarker = (hora: string) => hora.endsWith(':00') || hora.endsWith(':30');

  // Obter hora atual para destacar
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Verificar se um grupo de 30 min contém a hora atual
  const isCurrentTimeGroup = (inicio: string): boolean => {
    const [h, m] = inicio.split(':').map(Number);
    // O grupo começa em 'inicio' e vai até inicio + 29 minutos
    const grupoMinutoInicio = h * 60 + m;
    const grupoMinutoFim = grupoMinutoInicio + 29;
    const agoraMinutos = currentHour * 60 + currentMinute;
    return agoraMinutos >= grupoMinutoInicio && agoraMinutos <= grupoMinutoFim;
  };

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
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center theme-transition">
        <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-20 theme-transition">
      <SEOHead title="Planejador Semanal | Ouse Passar" />

      <main className="pt-20 px-4 max-w-7xl mx-auto">
        {/* Resumo - Cards no topo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-lg p-4 theme-transition">
            <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Total Semanal</p>
            <p className="text-2xl font-black text-[var(--color-text-primary)]">{resumo.totalHoras}h</p>
          </div>
          {Object.entries(resumo.horasPorAtividade).slice(0, 3).map(([atId, data]) => (
            <div key={atId} className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-lg p-4 theme-transition">
              <p className="text-xs uppercase font-bold" style={{ color: data.cor }}>
                {data.nome}
              </p>
              <p className="text-2xl font-black text-[var(--color-text-primary)]">{data.horas}h</p>
            </div>
          ))}
        </div>

        {/* Barra de Atividades - Abaixo dos cards */}
        <div ref={buttonsContainerRef} className={`sticky top-16 z-40 bg-[var(--color-bg-primary)]/95 backdrop-blur-md py-4 border-b border-[var(--color-border-light)] -mx-4 px-4 mb-4 transition-transform theme-transition ${isShaking ? 'animate-shake' : ''}`}>
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {/* Botão Borracha - Fixo, sempre visível */}
            <Tooltip content="Remover marcações">
              <button
                onClick={handleEraserMode}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all duration-200 ${eraserMode
                    ? 'border-white bg-white/10 shadow-lg scale-105'
                    : 'border-white/10 hover:border-white/30'
                  }`}
              >
                <Eraser className={`w-5 h-5 ${eraserMode ? 'text-white' : 'text-gray-400'}`} />
              </button>
            </Tooltip>

            {/* Separador visual */}
            <div className="w-px h-8 bg-white/10 mx-1" />

            {defaultActivities.map(atividade => (
              <ActivityButton
                key={atividade.id}
                atividade={atividade}
                isSelected={selectedActivity?.id === atividade.id}
                isUserActivity={false}
                onClick={() => handleSelectActivity(atividade)}
              />
            ))}

            {userActivities.map(atividade => (
              <ActivityButton
                key={atividade.id}
                atividade={atividade}
                isSelected={selectedActivity?.id === atividade.id}
                isUserActivity={true}
                onClick={() => handleSelectActivity(atividade)}
                onEditClick={() => handleOpenEditModal(atividade)}
              />
            ))}

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[var(--color-border-light)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold text-sm uppercase tracking-wide">Novo</span>
            </button>
          </div>

          {(selectedActivity || eraserMode) && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
              {eraserMode ? (
                <>
                  <span className="font-bold text-[var(--color-text-primary)]">Modo Borracha</span>
                  {' '}• Clique ou arraste para remover marcações
                </>
              ) : (
                <>
                  Selecionado:{' '}
                  <span className="font-bold" style={{ color: selectedActivity?.cor }}>
                    {selectedActivity?.nome}
                  </span>
                  {' '}• Clique ou arraste para marcar vários horários
                </>
              )}
            </p>
          )}
        </div>

        {/* Calendário */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl overflow-hidden theme-transition">
          {/* Header do calendário - com padding-right compensando o scrollbar */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-border-light)] pr-[9px]">
            <div className="p-2 bg-[var(--color-bg-secondary)]/50 border-r border-[var(--color-border-light)]">
              <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">Hora</span>
            </div>
            {DIAS_SEMANA.map((dia, index) => {
              const isToday = currentDay === index;
              return (
                <div
                  key={dia}
                  className={`p-2 text-center border-r border-[var(--color-border-light)] last:border-r-0 ${isToday ? 'bg-black/40' : 'bg-[var(--color-bg-secondary)]/50'}`}
                >
                  <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}>
                    <span className="md:hidden">{dia}</span>
                    <span className="hidden md:inline">{DIAS_SEMANA_FULL[index]}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid de horários - Agrupado em blocos de 30 min */}
          {/* Grid de horários - Agrupado em blocos de 30 min */}
          <div className="max-h-[55vh] overflow-y-scroll">
            {horariosAgrupados.map((grupo, grupoIdx) => {
              const isCurrentTime = isCurrentTimeGroup(grupo.inicio);
              return (
                <div
                  key={grupo.inicio}
                  className={`grid grid-cols-[60px_repeat(7,1fr)] ${isCurrentTime
                      ? 'border-y-2 border-[var(--color-accent)]'
                      : isFullHour(grupo.inicio)
                        ? 'border-t-2 border-[var(--color-border)]'
                        : 'border-t border-[var(--color-border-light)]'
                    }`}
                >
                  {/* Coluna de hora - Mostra :00 e :30 */}
                  <div className={`border-r flex items-center justify-center ${isCurrentTime
                      ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)]/30'
                      : 'bg-[var(--color-bg-secondary)]/20 border-[var(--color-border-light)]'
                    }`}>
                    <span className={`text-[10px] font-mono font-bold ${isCurrentTime ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                      }`}>{grupo.inicio}</span>
                  </div>

                  {/* Slots de cada dia - 2 linhas de 15 min por grupo */}
                  {DIAS_SEMANA.map((_, colIdx) => {
                    const dbDayIndex = getDbDayIndex(colIdx);
                    return (
                      <div
                        key={colIdx}
                        className={`flex flex-col border-r border-[var(--color-border-light)] last:border-r-0 ${colIdx === currentDay ? 'bg-black/30' : ''}`}
                      >
                        {grupo.slots.map((hora, slotIdx) => {
                          const slotColor = getSlotColor(dbDayIndex, hora);
                          const marked = isSlotMarked(dbDayIndex, hora);
                          const activityName = marked ? getSlotActivityName(dbDayIndex, hora) : null;
                          const isSelected = selectedActivity !== null;
                          // Cor efetiva: se marcado, usa a cor do slot (ou amarelo). Se não marcado, null.
                          const effectiveColor = marked ? (slotColor || '#FFB800') : null;

                          // Determinar classes do slot
                          const slotClasses = [
                            'h-5 relative select-none',
                            slotIdx !== 0 && 'border-t border-[var(--color-border-light)]',
                            isSelected && `cursor-pointer slot-hover-${selectedActivity.id}`,
                            eraserMode && marked && 'cursor-pointer eraser-mode-slot',
                            !isSelected && !eraserMode && 'cursor-default transition-all duration-150 active:bg-[var(--color-error)]/10',
                          ].filter(Boolean).join(' ');

                          const slotElement = (
                            <div
                              onMouseDown={(e) => handleSlotMouseDown(dbDayIndex, hora, e)}
                              onMouseEnter={() => handleSlotMouseEnter(dbDayIndex, hora)}
                              onMouseUp={handleSlotMouseUp}
                              className={slotClasses}
                              style={{
                                backgroundColor: effectiveColor ? addAlpha(effectiveColor, 0.4) : undefined,
                              }}
                            >
                              {marked && activityName && (
                                <span
                                  className="absolute inset-0 flex items-center justify-center text-[8px] font-medium uppercase tracking-wider truncate px-0.5 pointer-events-none"
                                  style={{ color: effectiveColor ? effectiveColor : undefined, opacity: 0.7 }}
                                >
                                  {activityName}
                                </span>
                              )}
                            </div>
                          );

                          // Se slot está marcado, envolve com tooltip
                          if (marked && activityName) {
                            return (
                              <Tooltip key={`${dbDayIndex}-${hora}`} content={activityName}>
                                {slotElement}
                              </Tooltip>
                            );
                          }

                          return <React.Fragment key={`${dbDayIndex}-${hora}`}>{slotElement}</React.Fragment>;
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Tooltip flutuante de instrução */}
          <AnimatePresence>
            {interactionTooltip.visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed z-50 pointer-events-none bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-bold text-xs px-3 py-1.5 rounded shadow-lg uppercase"
                style={{
                  left: interactionTooltip.x,
                  top: interactionTooltip.y - 40,
                  transform: 'translateX(-50%)'
                }}
              >
                Selecione uma atividade
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-accent)]" />
              </motion.div>
            )}
          </AnimatePresence>
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
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {atividade.nome}: <span className="text-[var(--color-text-primary)] font-bold">{horas}h</span>
                </span>
              </div>
            );
          })}
        </div>

      </main>

      {/* Modais */}
      <NewActivityModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreateActivity}
      />

      <EditActivityModal
        isOpen={showEditModal}
        atividade={editingActivity}
        onClose={() => {
          setShowEditModal(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        onDelete={handleOpenDeleteModal}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        atividadeNome={editingActivity?.nome || ''}
        onClose={() => {
          setShowDeleteModal(false);
          setEditingActivity(null);
        }}
        onConfirm={handleConfirmDelete}
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

      {/* Estilos Dinâmicos e Animações */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        /* Hover dinâmico para a atividade selecionada - 20% opacidade */
        ${selectedActivity ? `
          .slot-hover-${selectedActivity.id}:hover {
            background-color: ${addAlpha(selectedActivity.cor, 0.2)} !important;
          }
        ` : ''}
        /* Hover para modo borracha */
        ${eraserMode ? `
          .eraser-mode-slot:hover {
            background-color: rgba(239, 68, 68, 0.2) !important;
          }
        ` : ''}
      `}</style>
    </div>
  );
};
