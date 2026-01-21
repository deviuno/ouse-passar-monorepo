import React from 'react';
import {
  Map as MapIcon,
  Target,
  FileText,
  BarChart2,
  ShoppingBag,
  Headphones,
  LayoutGrid,
  Lock,
  CheckCircle,
} from 'lucide-react';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const MODULE_CONFIG = [
  { key: 'trilha', label: 'Minhas Trilhas', icon: MapIcon, description: 'Mapa de estudos com missões e rodadas' },
  { key: 'praticar', label: 'Praticar Questões', icon: Target, description: 'Prática livre de questões (módulo principal)' },
  { key: 'simulados', label: 'Meus Simulados', icon: FileText, description: 'Simulados e provas completas' },
  { key: 'music', label: 'Ouse Music', icon: Headphones, description: 'Músicas e podcasts para estudo' },
  { key: 'estatisticas', label: 'Estatísticas', icon: BarChart2, description: 'Raio-X de desempenho do aluno' },
  { key: 'loja', label: 'Loja', icon: ShoppingBag, description: 'Loja de itens e preparatórios' },
];

const BLOCK_BEHAVIOR_OPTIONS = [
  { value: 'hidden', label: 'Ocultar', description: 'Esconde o módulo da navegação' },
  { value: 'disabled', label: 'Desabilitado', description: 'Mostra com cadeado, sem permitir clique' },
  { value: 'modal', label: 'Modal', description: 'Aparece normal, mostra modal ao clicar' },
];

interface ModulesSectionProps {
  settings: SystemSetting[];
  onValueChange: (setting: SystemSetting, value: any) => void;
  modifiedSettings: Map<string, any>;
}

export function ModulesSection({
  settings,
  onValueChange,
  modifiedSettings,
}: ModulesSectionProps) {
  const moduleSettings = settings.filter((s) => s.category === 'modules');

  const getSettingValue = (key: string): any => {
    const modKey = `modules:${key}`;
    if (modifiedSettings.has(modKey)) {
      return modifiedSettings.get(modKey);
    }
    const setting = moduleSettings.find((s) => s.key === key);
    if (!setting) return null;
    const val = setting.value;
    if (typeof val === 'string') {
      if (val === 'true') return true;
      if (val === 'false') return false;
      // Remove quotes from JSON strings
      return val.replace(/^"|"$/g, '');
    }
    return val;
  };

  const getSetting = (key: string): SystemSetting | undefined => {
    return moduleSettings.find((s) => s.key === key);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-card border border-white/10 rounded-sm">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-brand-yellow/10 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Módulos</h2>
              <p className="text-gray-400 text-sm">Habilitar/desabilitar módulos do app</p>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="divide-y divide-white/5">
          {MODULE_CONFIG.map((module) => {
            const Icon = module.icon;
            const enabledKey = `${module.key}_enabled`;
            const behaviorKey = `${module.key}_block_behavior`;
            const isEnabled = getSettingValue(enabledKey) === true || getSettingValue(enabledKey) === 'true';
            const blockBehavior = getSettingValue(behaviorKey) || 'disabled';
            const enabledSetting = getSetting(enabledKey);
            const behaviorSetting = getSetting(behaviorKey);
            const isEnabledModified = modifiedSettings.has(`modules:${enabledKey}`);
            const isBehaviorModified = modifiedSettings.has(`modules:${behaviorKey}`);

            return (
              <div key={module.key} className={`p-4 ${isEnabledModified || isBehaviorModified ? 'bg-brand-yellow/5' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* Module Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-brand-yellow/20' : 'bg-gray-700'}`}>
                    <Icon className={`w-5 h-5 ${isEnabled ? 'text-brand-yellow' : 'text-gray-500'}`} />
                  </div>

                  {/* Module Info & Controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">{module.label}</h3>
                        {(isEnabledModified || isBehaviorModified) && (
                          <CheckCircle className="w-4 h-4 text-brand-yellow" />
                        )}
                      </div>

                      {/* Toggle */}
                      {enabledSetting && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => onValueChange(enabledSetting, e.target.checked.toString())}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-yellow"></div>
                          <span className="ml-3 text-sm text-gray-400">
                            {isEnabled ? 'Ativo' : 'Inativo'}
                          </span>
                        </label>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm mb-3">{module.description}</p>

                    {/* Block Behavior Selector (only show when module is disabled) */}
                    {!isEnabled && behaviorSetting && (
                      <div className="flex items-center gap-3 mt-2 p-3 bg-black/20 rounded-lg">
                        <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-400 text-sm">Quando bloqueado:</span>
                        <select
                          value={blockBehavior}
                          onChange={(e) => onValueChange(behaviorSetting, `"${e.target.value}"`)}
                          className="bg-brand-dark border border-white/10 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-yellow"
                        >
                          {BLOCK_BEHAVIOR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-sm p-4">
        <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Sobre os Módulos
        </h3>
        <ul className="text-purple-300 text-sm space-y-1">
          <li>• <strong>Acesso Completo:</strong> Administradores e usuários com "Ver Respostas" ativado sempre têm acesso a todos os módulos</li>
          <li>• <strong>Ocultar:</strong> O módulo é completamente removido da navegação</li>
          <li>• <strong>Desabilitado:</strong> O módulo aparece com opacidade reduzida e ícone de cadeado</li>
          <li>• <strong>Modal:</strong> O módulo aparece normal, mas ao clicar exibe um aviso de indisponibilidade</li>
          <li>• <strong>Praticar Questões:</strong> Recomendado manter sempre ativo (é o fallback)</li>
        </ul>
      </div>
    </div>
  );
}
