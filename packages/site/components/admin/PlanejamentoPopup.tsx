import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Calendar, Clock, Target, Check, ExternalLink } from 'lucide-react';
import { LeadWithVendedor } from '../../services/adminUsersService';
// import { AgendamentoWithDetails, Preparatorio } from '../../lib/database.types'; // REMOVED
import { planejamentosService, preparatoriosService, mensagensIncentivoService } from '../../services/preparatoriosService';
import { agendamentosService } from '../../services/schedulingService';
import { leadsService } from '../../services/adminUsersService';
import { studentService, generateRandomPassword } from '../../services/studentService';

// Local definitions to fix missing exports
interface Preparatorio {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  is_active: boolean;
  ordem?: number;
  created_at?: string;
}

interface AgendamentoWithDetails {
  id: string;
  data_hora: string;
  duracao_minutos: number;
  notas?: string | null;
  preparatorio_id: string;
  vendedor?: { name: string } | null;
  status: string;
}

interface PlanejamentoPopupProps {
  lead: LeadWithVendedor;
  agendamento: AgendamentoWithDetails;
  onClose: () => void;
  onSuccess: (planejamentoId: string) => void;
}

export const PlanejamentoPopup: React.FC<PlanejamentoPopupProps> = ({
  lead,
  agendamento,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [planejamentoId, setPlanejamentoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dados do formulário
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [mensagemIncentivo, setMensagemIncentivo] = useState('');
  const [mensagensDisponiveis, setMensagensDisponiveis] = useState<string[]>([]);
  const [notas, setNotas] = useState(agendamento.notas || '');

  useEffect(() => {
    loadPreparatorioData();
  }, [agendamento.preparatorio_id]);

  const loadPreparatorioData = async () => {
    setLoading(true);
    try {
      // Carregar preparatório
      const prep = await preparatoriosService.getById(agendamento.preparatorio_id);
      setPreparatorio(prep);

      // Carregar mensagens de incentivo
      if (prep) {
        const mensagens = await mensagensIncentivoService.getByPreparatorio(prep.id, true);
        setMensagensDisponiveis(mensagens.map(m => m.mensagem));

        // Selecionar uma mensagem aleatória
        if (mensagens.length > 0) {
          const randomIdx = Math.floor(Math.random() * mensagens.length);
          setMensagemIncentivo(mensagens[randomIdx].mensagem);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do preparatório');
    } finally {
      setLoading(false);
    }
  };

  const formatAgendamentoDate = (dataHora: string) => {
    const date = new Date(dataHora);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerate = async () => {
    if (!preparatorio) {
      setError('Preparatório não encontrado');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // 1. Criar o planejamento
      const planejamento = await planejamentosService.create({
        preparatorio_id: preparatorio.id,
        nome_aluno: lead.nome,
        email: lead.email,
        mensagem_incentivo: mensagemIncentivo || null
      });

      // 2. Atualizar o lead com o planejamento_id
      await leadsService.update(lead.id, {
        planejamento_id: planejamento.id,
        status: 'ganho'
      });

      // 3. Atualizar o agendamento para 'realizado'
      await agendamentosService.updateStatus(agendamento.id, 'realizado');

      // 4. Salvar notas se houver
      if (notas !== agendamento.notas) {
        await agendamentosService.updateNotas(agendamento.id, notas);
      }

      // 5. Criar usuário para o aluno (se tiver email)
      if (lead.email) {
        try {
          const emailExists = await studentService.checkEmailExists(lead.email);
          if (!emailExists) {
            const password = generateRandomPassword();
            const studentUser = await studentService.createStudent({
              email: lead.email,
              name: lead.nome,
              password: password
            });
            await studentService.linkUserToLead(lead.id, studentUser.id, password);
          }
        } catch (userError) {
          console.error('Erro ao criar usuário do aluno:', userError);
          // Não interrompe o fluxo se der erro na criação do usuário
        }
      }

      setPlanejamentoId(planejamento.id);
      setSuccess(true);

      // Notificar sucesso após 2 segundos
      setTimeout(() => {
        onSuccess(planejamento.id);
      }, 2000);

    } catch (err) {
      console.error('Erro ao gerar planejamento:', err);
      setError('Erro ao gerar planejamento. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-brand-card border border-white/10 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Gerar Planejamento</h2>
              <p className="text-gray-400 text-sm mt-1">
                Gere o planejamento de estudos para este lead
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" />
                <span className="ml-2 text-gray-400">Carregando...</span>
              </div>
            ) : success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Planejamento Gerado!</h3>
                <p className="text-gray-400 mb-6">
                  O planejamento foi criado com sucesso e vinculado ao lead.
                </p>
                {planejamentoId && (
                  <a
                    href={`/planejamento-prf/${planejamentoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-brand-yellow text-brand-darker px-6 py-3 font-bold uppercase text-sm hover:bg-yellow-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Planejamento
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* Resumo do Lead */}
                <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
                  <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Dados do Lead</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-yellow" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{lead.nome}</p>
                        <p className="text-gray-500 text-sm">{lead.email || 'Sem email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{lead.concurso_almejado}</p>
                        <p className="text-gray-500 text-sm">Concurso almejado</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo do Agendamento */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-sm p-4">
                  <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Reunião</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm capitalize">{formatAgendamentoDate(agendamento.data_hora)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{agendamento.duracao_minutos} min</span>
                    </div>
                  </div>
                  {agendamento.vendedor && (
                    <p className="text-gray-400 text-sm mt-2">
                      Vendedor: {agendamento.vendedor.name}
                    </p>
                  )}
                </div>

                {/* Preparatório */}
                {preparatorio && (
                  <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
                    <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Preparatório</h4>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${preparatorio.cor}20` }}
                      >
                        <span style={{ color: preparatorio.cor }}>
                          {preparatorio.icone === 'shield' ? '🛡️' : '📚'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-bold">{preparatorio.nome}</p>
                        <p className="text-gray-500 text-sm">{preparatorio.slug}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensagem de Incentivo */}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                    Mensagem de Incentivo
                  </label>
                  {mensagensDisponiveis.length > 0 ? (
                    <select
                      value={mensagemIncentivo}
                      onChange={(e) => setMensagemIncentivo(e.target.value)}
                      className="w-full bg-brand-dark border border-white/10 rounded px-4 py-3 text-white text-sm focus:border-brand-yellow outline-none"
                    >
                      {mensagensDisponiveis.map((msg, idx) => (
                        <option key={idx} value={msg}>
                          {msg.length > 80 ? `${msg.substring(0, 80)}...` : msg}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={mensagemIncentivo}
                      onChange={(e) => setMensagemIncentivo(e.target.value)}
                      placeholder="Digite uma mensagem de incentivo personalizada..."
                      className="w-full bg-brand-dark border border-white/10 rounded px-4 py-3 text-white text-sm focus:border-brand-yellow outline-none"
                    />
                  )}
                </div>

                {/* Notas do Vendedor */}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                    Notas da Reunião (opcional)
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Adicione observações sobre a reunião..."
                    rows={3}
                    className="w-full bg-brand-dark border border-white/10 rounded px-4 py-3 text-white text-sm focus:border-brand-yellow outline-none resize-none"
                  />
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && !loading && (
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-bold uppercase text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !preparatorio}
                className="px-6 py-3 bg-brand-yellow text-brand-darker font-bold uppercase text-sm hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Planejamento'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlanejamentoPopup;
