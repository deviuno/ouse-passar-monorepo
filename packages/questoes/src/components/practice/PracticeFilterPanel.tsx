import React from 'react';
import {
  BookOpen,
  Building2,
  GraduationCap,
  Calendar,
  FileText,
  Briefcase,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { HierarchicalAssuntosDropdown } from './HierarchicalAssuntosDropdown';
import { TaxonomyNode, OPTIONS_ESCOLARIDADE, OPTIONS_MODALIDADE, OPTIONS_DIFICULDADE } from '../../services/questionsService';
import { FilterOptions, ToggleFilters } from '../../utils/filterUtils';
import { formatBancaDisplay, sortBancas } from '../../utils/bancaFormatter';

export interface PracticeFilterPanelProps {
  // Filter state
  filters: FilterOptions;
  toggleFilters: ToggleFilters;

  // Available options
  availableMaterias: string[];
  availableAssuntos: string[];
  availableBancas: string[];
  availableOrgaos: string[];
  availableCargos: string[];
  availableAnos: string[];

  // Taxonomy
  taxonomyByMateria: Map<string, TaxonomyNode[]>;

  // Loading states
  isLoadingAssuntos?: boolean;
  isLoadingTaxonomy?: boolean;

  // Actions
  onToggleFilter: (category: keyof FilterOptions, value: string) => void;
  onSetFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onToggleToggleFilter: (key: keyof ToggleFilters) => void;
  onSetToggleFilters: React.Dispatch<React.SetStateAction<ToggleFilters>>;

  // Optional: hide certain sections
  showEscolaridade?: boolean;
  showModalidade?: boolean;
  showDificuldade?: boolean;
}

const HISTORY_FILTERS = [
  { key: 'resolvi' as const, label: 'Resolvi' },
  { key: 'naoResolvi' as const, label: 'Não resolvi' },
  { key: 'acertei' as const, label: 'Acertei' },
  { key: 'errei' as const, label: 'Errei' },
];

const DIFFICULTY_FILTERS = [
  { key: 'facil' as const, label: 'Fácil' },
  { key: 'medio' as const, label: 'Médio' },
  { key: 'dificil' as const, label: 'Difícil' },
];

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button onClick={onChange} className="flex items-center gap-3 group">
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#ffac00]' : 'bg-[var(--color-border)]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </div>
      <span
        className={`text-sm transition-colors ${
          checked
            ? 'text-[var(--color-text-main)]'
            : 'text-[var(--color-text-sec)] group-hover:text-[var(--color-text-main)]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function FilterChip({ active, onClick, label }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-[#ffac00] hover:bg-[#ffbc33] text-black border-[#ffac00] hover:border-[#ffbc33]'
          : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-sec)] border-[var(--color-border)] hover:border-[#ffac00] hover:text-[var(--color-text-main)]'
      }`}
    >
      {label}
    </button>
  );
}

export function PracticeFilterPanel({
  filters,
  toggleFilters,
  availableMaterias,
  availableAssuntos,
  availableBancas,
  availableOrgaos,
  availableCargos,
  availableAnos,
  taxonomyByMateria,
  isLoadingAssuntos = false,
  isLoadingTaxonomy = false,
  onToggleFilter,
  onSetFilters,
  onToggleToggleFilter,
  onSetToggleFilters,
  showEscolaridade = true,
  showModalidade = true,
  showDificuldade = false,
}: PracticeFilterPanelProps) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 md:p-5 theme-transition">
      {/* Main Filters Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <MultiSelectDropdown
          label="Matérias"
          icon={<BookOpen size={16} />}
          items={availableMaterias}
          selected={filters.materia}
          onToggle={(item) => onToggleFilter('materia', item)}
          onClear={() => onSetFilters((prev) => ({ ...prev, materia: [] }))}
          placeholder="Selecione matérias..."
        />
        <HierarchicalAssuntosDropdown
          label="Assuntos"
          icon={<FileText size={16} />}
          taxonomyByMateria={taxonomyByMateria}
          flatAssuntos={availableAssuntos}
          selectedAssuntos={filters.assunto}
          onToggleAssunto={(item) => onToggleFilter('assunto', item)}
          onToggleMultiple={(assuntos, select) => {
            onSetFilters((prev) => {
              const current = new Set(prev.assunto);
              assuntos.forEach((a) => {
                if (select) {
                  current.add(a);
                } else {
                  current.delete(a);
                }
              });
              return { ...prev, assunto: Array.from(current) };
            });
          }}
          onClear={() => onSetFilters((prev) => ({ ...prev, assunto: [] }))}
          placeholder="Selecionar assuntos..."
          isLoading={isLoadingAssuntos}
          isLoadingTaxonomy={isLoadingTaxonomy}
        />
        <MultiSelectDropdown
          label="Bancas"
          icon={<Building2 size={16} />}
          items={sortBancas(availableBancas)}
          selected={filters.banca}
          onToggle={(item) => onToggleFilter('banca', item)}
          onClear={() => onSetFilters((prev) => ({ ...prev, banca: [] }))}
          placeholder="Selecione bancas..."
          displayFormatter={formatBancaDisplay}
        />
        <MultiSelectDropdown
          label="Órgãos"
          icon={<Building2 size={16} />}
          items={availableOrgaos}
          selected={filters.orgao}
          onToggle={(item) => onToggleFilter('orgao', item)}
          onClear={() => onSetFilters((prev) => ({ ...prev, orgao: [] }))}
          placeholder="Selecione órgãos..."
        />
        <MultiSelectDropdown
          label="Cargos"
          icon={<Briefcase size={16} />}
          items={availableCargos}
          selected={filters.cargo}
          onToggle={(item) => onToggleFilter('cargo', item)}
          onClear={() => onSetFilters((prev) => ({ ...prev, cargo: [] }))}
          placeholder="Selecione cargos..."
        />
        <MultiSelectDropdown
          label="Anos"
          icon={<Calendar size={16} />}
          items={availableAnos}
          selected={filters.ano}
          onToggle={(item) => onToggleFilter('ano', item)}
          onClear={() => onSetFilters((prev) => ({ ...prev, ano: [] }))}
          placeholder="Selecione anos..."
        />
        {showEscolaridade && (
          <MultiSelectDropdown
            label="Escolaridade"
            icon={<GraduationCap size={16} />}
            items={OPTIONS_ESCOLARIDADE.map((opt) => opt.value)}
            selected={filters.escolaridade}
            onToggle={(item) => onToggleFilter('escolaridade', item)}
            onClear={() => onSetFilters((prev) => ({ ...prev, escolaridade: [] }))}
            placeholder="Selecione escolaridade..."
          />
        )}
        {showModalidade && (
          <MultiSelectDropdown
            label="Modalidade"
            icon={<CheckCircle size={16} />}
            items={OPTIONS_MODALIDADE.map((opt) => opt.value)}
            selected={filters.modalidade}
            onToggle={(item) => onToggleFilter('modalidade', item)}
            onClear={() => onSetFilters((prev) => ({ ...prev, modalidade: [] }))}
            placeholder="Selecione modalidade..."
          />
        )}
        {showDificuldade && (
          <MultiSelectDropdown
            label="Dificuldade"
            icon={<Zap size={16} />}
            items={OPTIONS_DIFICULDADE.map((opt) => opt.value)}
            selected={filters.dificuldade}
            onToggle={(item) => onToggleFilter('dificuldade', item)}
            onClear={() => onSetFilters((prev) => ({ ...prev, dificuldade: [] }))}
            placeholder="Selecione dificuldade..."
          />
        )}
      </div>

      {/* Toggle Filters */}
      <div className="flex flex-wrap gap-6 pt-4 border-t border-[var(--color-border)]">
        <ToggleSwitch
          checked={toggleFilters.apenasRevisadas}
          onChange={() => onToggleToggleFilter('apenasRevisadas')}
          label="Apenas questões revisadas"
        />
        <ToggleSwitch
          checked={toggleFilters.apenasComComentario}
          onChange={() => onToggleToggleFilter('apenasComComentario')}
          label="Apenas com comentário"
        />
      </div>

      {/* History and Difficulty Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--color-border)]">
        {/* My History */}
        <div className="flex flex-wrap gap-3">
          <span className="text-xs text-[var(--color-text-muted)] uppercase font-bold w-full mb-1">
            Meu Histórico
          </span>
          {HISTORY_FILTERS.map(({ key, label }) => (
            <FilterChip
              key={key}
              active={toggleFilters[key]}
              onClick={() => onToggleToggleFilter(key)}
              label={label}
            />
          ))}
        </div>

        {/* Difficulty Level */}
        <div className="flex flex-wrap gap-3">
          <span className="text-xs text-[var(--color-text-muted)] uppercase font-bold w-full mb-1">
            Nível de Dificuldade
          </span>
          {DIFFICULTY_FILTERS.map(({ key, label }) => (
            <FilterChip
              key={key}
              active={toggleFilters[key]}
              onClick={() => onToggleToggleFilter(key)}
              label={label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PracticeFilterPanel;
