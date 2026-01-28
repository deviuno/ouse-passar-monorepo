import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { Preparatorio } from '../../types';
import { getPreparatorios } from '../../services';
import { getOptimizedImageUrl } from '../../utils/image';

interface ConcursoStepProps {
  selected?: string;
  onSelect: (concurso: string) => void;
}

export function ConcursoStep({ selected, onSelect }: ConcursoStepProps) {
  const [preparatorios, setPreparatorios] = useState<Preparatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreparatorios() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPreparatorios();

        if (!data) {
          setError('Erro: resposta vazia do servidor');
          return;
        }

        setPreparatorios(data);
      } catch (err: any) {
        setError('Erro ao carregar preparatorios: ' + (err?.message || 'desconhecido'));
      } finally {
        setIsLoading(false);
      }
    }
    loadPreparatorios();
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="text-center py-12"
      >
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-brand)] mx-auto mb-4" />
        <p className="text-[var(--color-text-sec)]">Carregando opções de concurso...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="text-center py-12"
      >
        <p className="text-[var(--color-error)] mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[var(--color-brand)] underline"
        >
          Tentar novamente
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Qual concurso você vai fazer?</h2>
      <p className="text-[var(--color-text-sec)] mb-6">
        Isso define qual edital será carregado na sua trilha.
      </p>

      {preparatorios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-sec)] mb-4">Nenhum preparatório disponível no momento.</p>
          <p className="text-[var(--color-text-muted)] text-sm">
            Entre em contato com o suporte ou aguarde novos preparatórios serem adicionados.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[var(--color-brand)] underline text-sm"
          >
            Recarregar página
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {preparatorios.map((prep) => (
            <motion.button
              key={prep.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(prep.id)}
              className={`
                group relative flex flex-col items-start text-left
                rounded-2xl overflow-hidden transition-all duration-200 h-full
                ${selected === prep.id
                  ? 'ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[var(--color-bg-main)]'
                  : 'hover:ring-2 hover:ring-[var(--color-border-strong)] hover:ring-offset-2 hover:ring-offset-[var(--color-bg-main)]'
                }
                bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm
              `}
            >
              {/* Capa do Preparatório */}
              <div className="w-full aspect-[4/3] bg-[var(--color-bg-elevated)] relative overflow-hidden">
                {prep.imagem_capa ? (
                  <img
                    src={getOptimizedImageUrl(prep.imagem_capa, 400, 80)}
                    alt={prep.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-card)]">
                    <span className="text-4xl mb-2 filter drop-shadow-lg">{prep.icone || '📚'}</span>
                  </div>
                )}

                {/* Overlay gradiente para legibilidade se tiver texto na imagem */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Badge de Selecionado */}
                {selected === prep.id && (
                  <div className="absolute top-2 right-2 bg-[var(--color-brand)] text-black p-1 rounded-full shadow-lg z-10">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Conteúdo do Card */}
              <div className="p-3 w-full flex-1 flex flex-col">
                <h3 className="text-[var(--color-text-main)] font-bold text-sm leading-tight mb-1 group-hover:text-[var(--color-brand)] transition-colors">
                  {prep.nome}
                </h3>

                {prep.descricao && (
                  <p className="text-[#A0A0A0] text-xs line-clamp-3 leading-relaxed mt-auto">
                    {prep.descricao}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
