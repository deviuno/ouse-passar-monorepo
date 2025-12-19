import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  BookOpen,
  Check,
  Loader2,
  ShoppingCart,
  Star,
  Users,
  Clock,
} from 'lucide-react';
import { Button, Card, Modal } from '../components/ui';
import { Preparatorio, UserLevel } from '../types';
import { userPreparatoriosService } from '../services';
import { useAuthStore, useTrailStore, useUIStore } from '../stores';

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
        setSelectedPreparatorioId(userPrep.id);
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
            <div className="grid gap-4">
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
            title="Adicionar Preparatório"
          >
            <div className="p-4">
              {/* Preview do preparatório */}
              <div className="bg-[#1E1E1E] rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${selectedPrep.cor || '#FFB800'}20` }}
                  >
                    {selectedPrep.icone ? (
                      <span className="text-3xl">{selectedPrep.icone}</span>
                    ) : (
                      <BookOpen size={32} style={{ color: selectedPrep.cor || '#FFB800' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{selectedPrep.nome}</h3>
                    {selectedPrep.descricao && (
                      <p className="text-[#A0A0A0] text-sm mt-1">{selectedPrep.descricao}</p>
                    )}
                    {selectedPrep.banca && (
                      <p className="text-[#6E6E6E] text-xs mt-2">Banca: {selectedPrep.banca}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-[#A0A0A0]">
                  <Check size={18} className="text-[#2ECC71]" />
                  <span className="text-sm">Trilha personalizada para seu nível</span>
                </div>
                <div className="flex items-center gap-3 text-[#A0A0A0]">
                  <Check size={18} className="text-[#2ECC71]" />
                  <span className="text-sm">Questões comentadas</span>
                </div>
                <div className="flex items-center gap-3 text-[#A0A0A0]">
                  <Check size={18} className="text-[#2ECC71]" />
                  <span className="text-sm">Simulados e revisões</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isAcquiring}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  onClick={handleAcquirePrep}
                  isLoading={isAcquiring}
                  leftIcon={!isAcquiring ? <ShoppingCart size={18} /> : undefined}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Card de preparatório
function PreparatorioCard({
  preparatorio,
  index,
  onSelect,
}: {
  preparatorio: Preparatorio;
  index: number;
  onSelect: () => void;
}) {
  const iconeBg = preparatorio.cor || '#FFB800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        padding="none"
        className="overflow-hidden hover:border-[#FFB800]/50 transition-all cursor-pointer group"
        onClick={onSelect}
      >
        {/* Imagem de capa (se houver) */}
        {preparatorio.imagem_capa && (
          <div className="h-32 overflow-hidden">
            <img
              src={preparatorio.imagem_capa}
              alt={preparatorio.nome}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Ícone */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${iconeBg}20` }}
            >
              {preparatorio.icone ? (
                <span className="text-3xl">{preparatorio.icone}</span>
              ) : (
                <BookOpen size={28} style={{ color: iconeBg }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">
                {preparatorio.nome}
              </h3>
              {preparatorio.descricao && (
                <p className="text-[#A0A0A0] text-sm line-clamp-2 mt-1">
                  {preparatorio.descricao}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {preparatorio.banca && (
                  <span className="px-2 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A0A0A0]">
                    {preparatorio.banca}
                  </span>
                )}
                {preparatorio.orgao && (
                  <span className="px-2 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A0A0A0]">
                    {preparatorio.orgao}
                  </span>
                )}
              </div>
            </div>

            {/* Botão */}
            <Button
              size="sm"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
