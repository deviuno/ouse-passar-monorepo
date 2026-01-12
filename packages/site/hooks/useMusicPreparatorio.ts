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
  const [preparatorios, setPreparatorios] = useState<Preparatorio[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load preparatorios
  useEffect(() => {
    loadPreparatorios();
  }, []);

  const loadPreparatorios = async () => {
    try {
      const { data, error } = await supabase
        .from('preparatorios')
        .select('id, nome')
        .order('nome');

      if (error) throw error;

      setPreparatorios(data || []);

      // Try to load saved selection
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && data?.some(p => p.id === savedId)) {
        setSelectedId(savedId);
      } else if (data && data.length > 0) {
        // Default to first preparatorio
        setSelectedId(data[0].id);
        localStorage.setItem(STORAGE_KEY, data[0].id);
      }
    } catch (error) {
      console.error('Error loading preparatorios:', error);
    } finally {
      setLoading(false);
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
