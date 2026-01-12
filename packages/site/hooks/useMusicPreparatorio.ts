/**
 * Hook para gerenciar o preparatório selecionado no módulo de música admin
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Preparatorio {
  id: string;
  nome: string;
}

const STORAGE_KEY = 'ouse_music_admin_preparatorio_id';

export function useMusicPreparatorio() {
  console.log('[useMusicPreparatorio] ========== HOOK INICIADO ==========');
  const [preparatorios, setPreparatorios] = useState<Preparatorio[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load preparatorios
  useEffect(() => {
    console.log('[useMusicPreparatorio] useEffect - chamando loadPreparatorios');
    loadPreparatorios();
  }, []);

  const loadPreparatorios = async () => {
    console.log('[useMusicPreparatorio] loadPreparatorios iniciado');
    try {
      const { data, error } = await supabase
        .from('preparatorios')
        .select('id, nome')
        .order('nome');

      console.log('[useMusicPreparatorio] Query resultado:', { data, error });

      if (error) throw error;

      setPreparatorios(data || []);

      // Try to load saved selection
      const savedId = localStorage.getItem(STORAGE_KEY);
      console.log('[useMusicPreparatorio] savedId do localStorage:', savedId);

      if (savedId && data?.some(p => p.id === savedId)) {
        console.log('[useMusicPreparatorio] Usando savedId:', savedId);
        setSelectedId(savedId);
      } else if (data && data.length > 0) {
        // Default to first preparatorio
        console.log('[useMusicPreparatorio] Usando primeiro preparatório:', data[0]);
        setSelectedId(data[0].id);
        localStorage.setItem(STORAGE_KEY, data[0].id);
      } else {
        console.log('[useMusicPreparatorio] NENHUM PREPARATORIO ENCONTRADO!');
      }
    } catch (error) {
      console.error('[useMusicPreparatorio] ERRO ao carregar preparatorios:', error);
    } finally {
      setLoading(false);
      console.log('[useMusicPreparatorio] loadPreparatorios finalizado');
    }
  };

  const selectPreparatorio = useCallback((id: string) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedPreparatorio = preparatorios.find(p => p.id === selectedId);

  return {
    preparatorios,
    selectedId,
    selectedPreparatorio,
    selectPreparatorio,
    loading,
  };
}

export default useMusicPreparatorio;
