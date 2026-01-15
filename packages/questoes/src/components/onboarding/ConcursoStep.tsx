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
        <Loader2 className="w-12 h-12 animate-spin text-[#FFB800] mx-auto mb-4" />
        <p className="text-[#A0A0A0]">Carregando opcoes de concurso...</p>
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
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[#FFB800] underline"
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
      <h2 className="text-2xl font-bold text-white mb-2">Qual concurso voce vai fazer?</h2>
      <p className="text-[#A0A0A0] mb-6">
        Isso define qual edital sera carregado na sua trilha.
      </p>

      {preparatorios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#A0A0A0] mb-4">Nenhum preparatorio disponivel no momento.</p>
          <p className="text-[#6E6E6E] text-sm">
            Entre em contato com o suporte ou aguarde novos preparatorios serem adicionados.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[#FFB800] underline text-sm"
          >
            Recarregar pagina
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
                  ? 'ring-2 ring-[#FFB800] ring-offset-2 ring-offset-[#121212]'
                  : 'hover:ring-2 hover:ring-[#3A3A3A] hover:ring-offset-2 hover:ring-offset-[#121212]'
                }
                bg-[#252525]
              `}
            >
              {/* Capa do Preparatorio */}
              <div className="w-full aspect-[4/3] bg-[#333] relative overflow-hidden">
                {prep.imagem_capa ? (
                  <img
                    src={getOptimizedImageUrl(prep.imagem_capa, 400, 80)}
                    alt={prep.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#333] to-[#252525]">
                    <span className="text-4xl mb-2 filter drop-shadow-lg">{prep.icone || '📚'}</span>
                  </div>
                )}

                {/* Overlay gradiente para legibilidade se tiver texto na imagem */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Badge de Selecionado */}
                {selected === prep.id && (
                  <div className="absolute top-2 right-2 bg-[#FFB800] text-black p-1 rounded-full shadow-lg z-10">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Conteudo do Card */}
              <div className="p-3 w-full flex-1 flex flex-col">
                <h3 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-[#FFB800] transition-colors">
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
