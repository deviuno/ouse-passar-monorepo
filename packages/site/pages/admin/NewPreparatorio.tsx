import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, MessageSquare, FileText, List } from 'lucide-react';
import { PreparatorioWizard, PreparatorioWizardData } from '../../components/admin/PreparatorioWizard';
import { useToast } from '../../components/ui/Toast';
import { preparatoriosService } from '../../services/preparatoriosService';
import { mensagensIncentivoService } from '../../services/mensagensIncentivoService';

export const NewPreparatorio: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [messagesCreated, setMessagesCreated] = useState(0);

  const handleSubmit = async (data: PreparatorioWizardData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Generate slug from name
      const slug = data.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Parse numeric values
      const parseSalario = (value: string): number | null => {
        if (!value) return null;
        const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      const parseNumber = (value: string): number | null => {
        if (!value) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      const parseDate = (value: string): string | null => {
        return value || null;
      };

      const preparatorio = await preparatoriosService.create({
        nome: data.nome,
        slug,
        descricao: data.descricao || undefined,
        imagem_capa: data.imagemCapa || undefined,
        // Technical fields
        banca: data.banca || undefined,
        orgao: data.orgao || undefined,
        cargo: data.cargo || undefined,
        nivel: data.nivel,
        escolaridade: data.escolaridade || undefined,
        modalidade: data.modalidade,
        regiao: data.regiao || undefined,
        // Contest details
        salario: parseSalario(data.salario),
        carga_horaria: data.cargaHoraria || undefined,
        vagas: data.vagas ? parseInt(data.vagas, 10) : null,
        taxa_inscricao: parseSalario(data.taxaInscricao),
        inscricoes_inicio: parseDate(data.inscricoesInicio),
        inscricoes_fim: parseDate(data.inscricoesFim),
        data_prevista: parseDate(data.dataPrevista),
        ano_previsto: data.anoPrevisto ? parseInt(data.anoPrevisto, 10) : null,
        // Sales fields
        preco: parseNumber(data.preco),
        preco_desconto: parseNumber(data.precoDesconto),
        checkout_url: data.checkoutUrl || undefined,
        descricao_curta: data.descricaoCurta || undefined,
        descricao_vendas: data.descricaoVendas || undefined,
        // Default settings
        is_active: false,
        icone: 'book',
        cor: '#3B82F6',
        content_types: ['plano'],
      });

      setCreatedId(preparatorio.id);

      // Criar mensagens de incentivo personalizadas
      const mensagensResult = await mensagensIncentivoService.createForPreparatorio(
        preparatorio.id,
        data.cargo || data.nome, // Usa cargo ou nome como referência
        data.orgao
      );

      if (mensagensResult.success) {
        setMessagesCreated(mensagensResult.count);
      }

      setShowSuccess(true);
      toast.success('Preparatório criado com sucesso!');
    } catch (err: any) {
      console.error('Error creating preparatorio:', err);
      setError(err.message || 'Erro ao criar preparatório');
      toast.error('Erro ao criar preparatório');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/preparatorios');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link
          to="/admin/preparatorios"
          className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Preparatórios
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
          Novo Preparatório
        </h1>
        <p className="text-gray-400 mt-2">
          Preencha as informações do novo preparatório em etapas.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-400">
            &times;
          </button>
        </div>
      )}

      {/* Wizard */}
      {!showSuccess && (
        <PreparatorioWizard
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Criar Preparatório"
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-green-500/20 rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-scale-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase mb-2">
              Preparatório Criado!
            </h2>
            <p className="text-gray-400 mb-4">
              O preparatório foi criado com sucesso.
            </p>
            {messagesCreated > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-sm p-3 mb-4 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <p className="text-purple-400 text-sm text-left">
                  <strong>{messagesCreated} mensagens de incentivo</strong> criadas automaticamente.
                </p>
              </div>
            )}

            {/* Próximos Passos */}
            <div className="bg-white/5 border border-white/10 rounded-sm p-4 mb-6 text-left">
              <p className="text-white font-bold text-sm uppercase tracking-wide mb-3">
                📋 Próximos Passos
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/admin/preparatorios/${createdId}/edital`)}
                  className="w-full bg-brand-yellow hover:bg-white text-brand-darker py-3 px-4 font-bold uppercase tracking-wide rounded-sm transition-colors flex items-center gap-3"
                >
                  <FileText className="w-5 h-5" />
                  <span className="flex-1 text-left">Importar Edital com IA</span>
                  <span className="text-xs bg-brand-darker/20 px-2 py-1 rounded">Recomendado</span>
                </button>
                <button
                  onClick={() => navigate(`/admin/preparatorios/${createdId}/rodadas`)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 font-bold uppercase tracking-wide rounded-sm transition-colors flex items-center gap-3"
                >
                  <List className="w-5 h-5" />
                  <span className="flex-1 text-left">Gerenciar Rodadas</span>
                </button>
                <button
                  onClick={() => navigate(`/admin/preparatorios/${createdId}/mensagens`)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 font-bold uppercase tracking-wide rounded-sm transition-colors flex items-center gap-3"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="flex-1 text-left">Ver Mensagens de Incentivo</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/preparatorios')}
              className="w-full border border-white/10 text-gray-400 py-2 font-bold uppercase tracking-wide rounded-sm hover:text-white hover:border-white/20 transition-colors text-sm"
            >
              Voltar para Lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
