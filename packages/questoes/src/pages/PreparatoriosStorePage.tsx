import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  BookOpen,
  Check,
  Loader2,
  ShoppingCart,
  X,
} from 'lucide-react';
import { Button, Modal } from '../components/ui';
import { Preparatorio, UserLevel } from '../types';
import { userPreparatoriosService } from '../services';
import { useAuthStore, useTrailStore, useUIStore } from '../stores';
import { getOptimizedImageUrl } from '../utils/image';

export default function PreparatoriosStorePage() {
  const navigate = useNavigate();
  const { user, onboarding } = useAuthStore();
  const { addUserPreparatorio, setSelectedPreparatorioId } = useTrailStore();
  const { addToast } = useUIStore();

  const [availablePreparatorios, setAvailablePreparatorios] = useState<Preparatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrep, setSelectedPrep] = useState<Preparatorio | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Carregar preparatórios disponíveis
  useEffect(() => {
    async function loadAvailablePreparatorios() {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const preparatorios = await userPreparatoriosService.getAvailablePreparatorios(user.id);
        setAvailablePreparatorios(preparatorios);
      } catch (err) {
        console.error('Erro ao carregar preparatórios:', err);
        addToast('error', 'Erro ao carregar preparatórios');
      } finally {
        setIsLoading(false);
      }
    }

    loadAvailablePreparatorios();
  }, [user?.id]);

  const handleSelectPrep = (prep: Preparatorio) => {
    setSelectedPrep(prep);
    setShowConfirmModal(true);
  };

  const handleAcquirePrep = async () => {
    if (!selectedPrep || !user?.id) return;

    setIsAcquiring(true);
    try {
      const nivelUsuario = (onboarding?.nivel_conhecimento as UserLevel) || 'iniciante';
      const userPrep = await userPreparatoriosService.addPreparatorioToUser(
        user.id,
        selectedPrep.id,
        nivelUsuario
      );

      if (userPrep) {
        addUserPreparatorio(userPrep);
        // Passa userId para persistir como preparatório principal
        setSelectedPreparatorioId(userPrep.id, user.id);
        addToast('success', `${selectedPrep.nome} adicionado com sucesso!`);
        navigate('/');
      } else {
        addToast('error', 'Erro ao adicionar preparatório');
      }
    } catch (err) {
      console.error('Erro ao adquirir preparatório:', err);
      addToast('error', 'Erro ao adquirir preparatório');
    } finally {
      setIsAcquiring(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-full pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-[#121212] z-30 border-b border-[#3A3A3A]">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-[#252525] transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Loja de Preparatórios</h1>
            <p className="text-[#A0A0A0] text-sm">Adicione novos concursos à sua trilha</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#FFB800] mx-auto mb-4" />
              <p className="text-[#A0A0A0]">Carregando preparatórios...</p>
            </div>
          </div>
        ) : availablePreparatorios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">
              Você já tem todos!
            </h2>
            <p className="text-[#A0A0A0] max-w-xs">
              Você já possui todos os preparatórios disponíveis. Continue estudando!
            </p>
            <Button onClick={() => navigate('/')} className="mt-6">
              Voltar para Trilha
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[#A0A0A0] text-sm mb-6">
              {availablePreparatorios.length} preparatório{availablePreparatorios.length !== 1 ? 's' : ''} disponíve{availablePreparatorios.length !== 1 ? 'is' : 'l'}
            </p>

            {/* Grid de preparatórios */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {availablePreparatorios.map((prep, index) => (
                <PreparatorioCard
                  key={prep.id}
                  preparatorio={prep}
                  index={index}
                  onSelect={() => handleSelectPrep(prep)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {showConfirmModal && selectedPrep && (
          <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            hideHeader
            noPadding
          >
            <div className="overflow-hidden">
              {/* Cover Image Section - vai até o topo com bordas arredondadas */}
              <div className="relative h-[17rem] w-full">
                {selectedPrep.imagem_capa ? (
                  <img
                    src={getOptimizedImageUrl(selectedPrep.imagem_capa, 600, 80)}
                    alt={selectedPrep.nome}
                    className="w-full h-full object-cover rounded-t-2xl"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center rounded-t-2xl"
                    style={{ backgroundColor: selectedPrep.cor || '#FFB800' }}
                  >
                    {selectedPrep.icone ? (
                      <span className="text-6xl">{selectedPrep.icone}</span>
                    ) : (
                      <BookOpen size={64} className="text-white/50" />
                    )}
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#252525] via-transparent to-transparent" />

                {/* Botão fechar */}
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 -mt-6 relative z-10">
                {/* Title & Badge */}
                <div className="mb-4">
                  {selectedPrep.banca && (
                    <span className="inline-block px-3 py-1 bg-[#FFB800]/20 text-[#FFB800] text-xs font-medium rounded-full mb-2">
                      {selectedPrep.banca}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {selectedPrep.nome}
                  </h3>
                  {selectedPrep.orgao && (
                    <p className="text-[#A0A0A0] text-sm mt-1">{selectedPrep.orgao}</p>
                  )}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-[#252525] rounded-xl p-3 text-center">
                    <div className="w-8 h-8 bg-[#2ECC71]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Check size={16} className="text-[#2ECC71]" />
                    </div>
                    <p className="text-[10px] text-[#A0A0A0] leading-tight">Trilha Personalizada</p>
                  </div>
                  <div className="bg-[#252525] rounded-xl p-3 text-center">
                    <div className="w-8 h-8 bg-[#3498DB]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <BookOpen size={16} className="text-[#3498DB]" />
                    </div>
                    <p className="text-[10px] text-[#A0A0A0] leading-tight">Questões Comentadas</p>
                  </div>
                  <div className="bg-[#252525] rounded-xl p-3 text-center">
                    <div className="w-8 h-8 bg-[#9B59B6]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Check size={16} className="text-[#9B59B6]" />
                    </div>
                    <p className="text-[10px] text-[#A0A0A0] leading-tight">Simulados & Revisões</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    fullWidth
                    onClick={handleAcquirePrep}
                    isLoading={isAcquiring}
                    className="py-3 text-base font-bold"
                  >
                    {isAcquiring ? 'Adicionando...' : '🚀 Começar Agora'}
                  </Button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isAcquiring}
                    className="w-full py-2 text-sm text-[#A0A0A0] hover:text-white transition-colors disabled:opacity-50"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Card de preparatório - estilo igual ao onboarding
function PreparatorioCard({
  preparatorio,
  index,
  onSelect,
}: {
  preparatorio: Preparatorio;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        group relative flex flex-col items-start text-left cursor-pointer
        rounded-2xl overflow-hidden transition-all duration-200 h-full
        hover:ring-2 hover:ring-[#FFB800] hover:ring-offset-2 hover:ring-offset-[#121212]
        bg-[#252525]
      `}
    >
      {/* Capa do Preparatório */}
      <div className="w-full aspect-[4/3] bg-[#333] relative overflow-hidden">
        {preparatorio.imagem_capa ? (
          <img
            src={getOptimizedImageUrl(preparatorio.imagem_capa, 400, 80)}
            alt={preparatorio.nome}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#333] to-[#252525]">
            <span className="text-4xl mb-2 filter drop-shadow-lg">{preparatorio.icone || '📚'}</span>
          </div>
        )}

        {/* Overlay gradiente para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
      </div>

      {/* Conteúdo do Card */}
      <div className="p-3 w-full flex-1 flex flex-col">
        <h3 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-[#FFB800] transition-colors">
          {preparatorio.nome}
        </h3>

        {preparatorio.descricao && (
          <p className="text-[#A0A0A0] text-xs line-clamp-2 leading-relaxed mt-auto">
            {preparatorio.descricao}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {preparatorio.banca && (
            <span className="px-2 py-0.5 bg-[#3A3A3A] rounded-full text-[10px] text-[#A0A0A0]">
              {preparatorio.banca}
            </span>
          )}
        </div>

        {/* Botão */}
        <Button
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Adicionar
        </Button>
      </div>
    </motion.div>
  );
}

