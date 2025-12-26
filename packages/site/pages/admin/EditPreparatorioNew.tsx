import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, Trash2, List, MessageSquare, FileText } from 'lucide-react';
import { PreparatorioWizard, PreparatorioWizardData } from '../../components/admin/PreparatorioWizard';
import { useToast } from '../../components/ui/Toast';
import { preparatoriosService } from '../../services/preparatoriosService';
import { mensagensIncentivoService } from '../../services/mensagensIncentivoService';
import { editalService } from '../../services/editalService';
import { Preparatorio } from '../../lib/database.types';

export const EditPreparatorioNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // Ler step inicial da URL (ex: ?step=4 para ir direto para Vendas)
  const initialStep = parseInt(searchParams.get('step') || '1', 10);

  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messagesCount, setMessagesCount] = useState(0);
  const [editalItemsCount, setEditalItemsCount] = useState(0);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Load preparatorio data
  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const data = await preparatoriosService.getById(id);
        if (!data) throw new Error('Preparatório não encontrado');
        setPreparatorio(data);

        // Load messages and edital items count
        const [messages, editalItems] = await Promise.all([
          mensagensIncentivoService.getByPreparatorio(id),
          editalService.getByPreparatorio(id)
        ]);
        setMessagesCount(messages.length);
        setEditalItemsCount(editalItems.length);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (data: PreparatorioWizardData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
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

      const parseDate = (value: string): string | undefined => {
        return value || undefined;
      };

      await preparatoriosService.update(id, {
        nome: data.nome,
        descricao: data.descricao || undefined,
        imagem_capa: data.imagemCapa || undefined,
        logo_url: data.logoUrl || undefined,
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
        // Preços por produto
        preco_planejador: parseNumber(data.precoPlanejador),
        preco_planejador_desconto: parseNumber(data.precoPlanejadorDesconto),
        checkout_planejador: data.checkoutPlanejador || undefined,
        guru_product_id_planejador: data.guruProductIdPlanejador || undefined,
        preco_8_questoes: parseNumber(data.preco8Questoes),
        preco_8_questoes_desconto: parseNumber(data.preco8QuestoesDesconto),
        checkout_8_questoes: data.checkout8Questoes || undefined,
        guru_product_id_8_questoes: data.guruProductId8Questoes || undefined,
        preco_simulados: parseNumber(data.precoSimulados),
        preco_simulados_desconto: parseNumber(data.precoSimuladosDesconto),
        checkout_simulados: data.checkoutSimulados || undefined,
        guru_product_id_simulados: data.guruProductIdSimulados || undefined,
        preco_reta_final: parseNumber(data.precoRetaFinal),
        preco_reta_final_desconto: parseNumber(data.precoRetaFinalDesconto),
        checkout_reta_final: data.checkoutRetaFinal || undefined,
        guru_product_id_reta_final: data.guruProductIdRetaFinal || undefined,
        preco_plataforma_completa: parseNumber(data.precoPlataformaCompleta),
        preco_plataforma_completa_desconto: parseNumber(data.precoPlataformaCompletaDesconto),
        checkout_plataforma_completa: data.checkoutPlataformaCompleta || undefined,
        guru_product_id_plataforma_completa: data.guruProductIdPlataformaCompleta || undefined,
        // Campos legados
        preco: parseNumber(data.precoPlanejador),
        preco_desconto: parseNumber(data.precoPlanejadorDesconto),
        checkout_url: data.checkoutPlanejador || undefined,
        descricao_curta: data.descricaoCurta || undefined,
        descricao_vendas: data.descricaoVendas || undefined,
      });

      setShowSuccess(true);
      toast.success('Preparatório atualizado com sucesso!');
    } catch (err: any) {
      console.error('Error updating preparatorio:', err);
      setError(err.message || 'Erro ao atualizar preparatório');
      toast.error('Erro ao atualizar preparatório');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/preparatorios');
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await preparatoriosService.delete(id);
      toast.success('Preparatório excluído com sucesso!');
      navigate('/admin/preparatorios');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao excluir preparatório');
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!id || !preparatorio) return;

    setIsTogglingPublish(true);
    try {
      const newStatus = !preparatorio.is_active;
      await preparatoriosService.toggleActive(id, newStatus);
      setPreparatorio({ ...preparatorio, is_active: newStatus });
      toast.success(newStatus ? 'Preparatório publicado!' : 'Preparatório despublicado!');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao alterar status');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // Convert preparatorio to wizard data format
  const getInitialData = (): Partial<PreparatorioWizardData> | undefined => {
    if (!preparatorio) return undefined;

    // @ts-ignore - campos novos ainda não estão no tipo Preparatorio
    const prep = preparatorio as any;

    return {
      nome: prep.nome,
      descricao: prep.descricao || '',
      imagemCapa: prep.imagem_capa || '',
      logoUrl: prep.logo_url || '',
      banca: prep.banca || '',
      orgao: prep.orgao || '',
      cargo: prep.cargo || '',
      nivel: prep.nivel || 'medio',
      escolaridade: prep.escolaridade || '',
      modalidade: prep.modalidade || 'presencial',
      regiao: prep.regiao || '',
      salario: prep.salario?.toString() || '',
      cargaHoraria: prep.carga_horaria || '',
      vagas: prep.vagas?.toString() || '',
      taxaInscricao: prep.taxa_inscricao?.toString() || '',
      inscricoesInicio: prep.inscricoes_inicio || '',
      inscricoesFim: prep.inscricoes_fim || '',
      dataPrevista: prep.data_prevista || '',
      anoPrevisto: prep.ano_previsto?.toString() || '',
      // Preços por produto
      precoPlanejador: prep.preco_planejador?.toString() || prep.preco?.toString() || '',
      precoPlanejadorDesconto: prep.preco_planejador_desconto?.toString() || prep.preco_desconto?.toString() || '',
      checkoutPlanejador: prep.checkout_planejador || prep.checkout_url || '',
      guruProductIdPlanejador: prep.guru_product_id_planejador || '',
      preco8Questoes: prep.preco_8_questoes?.toString() || '',
      preco8QuestoesDesconto: prep.preco_8_questoes_desconto?.toString() || '',
      checkout8Questoes: prep.checkout_8_questoes || '',
      guruProductId8Questoes: prep.guru_product_id_8_questoes || '',
      precoSimulados: prep.preco_simulados?.toString() || '',
      precoSimuladosDesconto: prep.preco_simulados_desconto?.toString() || '',
      checkoutSimulados: prep.checkout_simulados || '',
      guruProductIdSimulados: prep.guru_product_id_simulados || '',
      precoRetaFinal: prep.preco_reta_final?.toString() || '',
      precoRetaFinalDesconto: prep.preco_reta_final_desconto?.toString() || '',
      checkoutRetaFinal: prep.checkout_reta_final || '',
      guruProductIdRetaFinal: prep.guru_product_id_reta_final || '',
      precoPlataformaCompleta: prep.preco_plataforma_completa?.toString() || '',
      precoPlataformaCompletaDesconto: prep.preco_plataforma_completa_desconto?.toString() || '',
      checkoutPlataformaCompleta: prep.checkout_plataforma_completa || '',
      guruProductIdPlataformaCompleta: prep.guru_product_id_plataforma_completa || '',
      // Campos legados
      preco: prep.preco?.toString() || '',
      precoDesconto: prep.preco_desconto?.toString() || '',
      checkoutUrl: prep.checkout_url || '',
      descricaoCurta: prep.descricao_curta || '',
      descricaoVendas: prep.descricao_vendas || '',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (error && !preparatorio) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link to="/admin/preparatorios" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Preparatórios
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

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
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
            Editar Preparatório
          </h1>
          <p className="text-gray-400 mt-2">
            Atualize as informações do preparatório.
          </p>
        </div>
        {/* Menu de ações - linha separada */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          {/* Publish Toggle - minimalista */}
          {preparatorio && (
            <button
              onClick={handleTogglePublish}
              disabled={isTogglingPublish}
              className={`
                inline-flex items-center gap-2 mr-auto
                ${isTogglingPublish ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={preparatorio.is_active ? 'Clique para despublicar' : 'Clique para publicar'}
            >
              <span
                className={`
                  w-9 h-5 rounded-full relative transition-colors duration-200
                  ${preparatorio.is_active ? 'bg-green-500' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200
                    ${preparatorio.is_active ? 'translate-x-4' : 'translate-x-0'}
                  `}
                />
              </span>
              {isTogglingPublish ? (
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              ) : (
                <span className={`text-sm ${preparatorio.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                  {preparatorio.is_active ? 'Publicado' : 'Despublicado'}
                </span>
              )}
            </button>
          )}
          <Link
            to={`/admin/preparatorios/${id}/edital`}
            className={`px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${
              editalItemsCount > 0
                ? 'text-green-400 hover:bg-green-500/10'
                : 'text-red-400 hover:bg-red-500/10 animate-pulse'
            }`}
            title={editalItemsCount > 0 ? 'Gerenciar Edital' : 'Configurar Edital (Recomendado)'}
          >
            <FileText className="w-4 h-4" />
            Edital
            {editalItemsCount > 0 && (
              <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded">
                {editalItemsCount}
              </span>
            )}
          </Link>
          <Link
            to={`/admin/preparatorios/${id}/rodadas`}
            className="px-4 py-2 text-brand-yellow hover:bg-brand-yellow/10 rounded-sm transition-colors flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Rodadas
          </Link>
          <Link
            to={`/admin/preparatorios/${id}/mensagens`}
            className="px-4 py-2 text-purple-400 hover:bg-purple-500/10 rounded-sm transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Mensagens
            {messagesCount > 0 && (
              <span className="text-xs bg-purple-500/20 px-1.5 py-0.5 rounded">
                {messagesCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
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

      {/* Status Badges */}
      {preparatorio && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Edital Status Badge */}
          {editalItemsCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold uppercase rounded">
              <FileText className="w-4 h-4" />
              Edital ({editalItemsCount} itens)
            </span>
          ) : (
            <Link
              to={`/admin/preparatorios/${id}/edital`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 text-sm font-bold uppercase rounded hover:bg-red-500/30 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Sem Edital - Configurar
            </Link>
          )}
          {preparatorio.banca && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-bold uppercase rounded">
              {preparatorio.banca}
            </span>
          )}
          {preparatorio.orgao && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-bold uppercase rounded">
              {preparatorio.orgao}
            </span>
          )}
        </div>
      )}

      {/* Wizard */}
      {!showSuccess && preparatorio && (
        <PreparatorioWizard
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Salvar Alterações"
          initialStep={initialStep}
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
              Alterações Salvas!
            </h2>
            <p className="text-gray-400 mb-6">
              O preparatório foi atualizado com sucesso.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/admin/preparatorios/${id}/rodadas`)}
                className="w-full bg-brand-yellow hover:bg-white text-brand-darker py-3 font-bold uppercase tracking-wide rounded-sm transition-colors"
              >
                Gerenciar Rodadas
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  // Reload data
                  window.location.reload();
                }}
                className="w-full border border-white/10 text-gray-400 py-3 font-bold uppercase tracking-wide rounded-sm hover:text-white hover:border-white/20 transition-colors"
              >
                Continuar Editando
              </button>
              <button
                onClick={() => navigate('/admin/preparatorios')}
                className="w-full text-gray-500 py-2 font-bold uppercase tracking-wide hover:text-white transition-colors"
              >
                Voltar para Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir o preparatório{' '}
              <span className="text-white font-medium">"{preparatorio?.nome}"</span>?
            </p>
            <p className="text-red-400 text-sm mb-6">
              Esta ação irá excluir permanentemente todas as rodadas, missões e configurações associadas.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-sm font-bold uppercase tracking-wide hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
