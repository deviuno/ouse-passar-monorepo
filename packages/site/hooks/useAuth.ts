/**
 * Hook de autenticação para o painel admin
 * Re-exporta o hook principal e adiciona currentPreparatorio
 */

import { useAuth as useAuthBase } from '../lib/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Preparatorio {
  id: string;
  nome: string;
  slug: string;
}

const STORAGE_KEY = 'ouse_admin_preparatorio_id';

// ID padrão usado quando não há preparatórios cadastrados
const DEFAULT_PREPARATORIO_ID = '00000000-0000-0000-0000-000000000001';

export function useAuth() {
  const auth = useAuthBase();
  const [preparatorios, setPreparatorios] = useState<Preparatorio[]>([]);
  const [currentPreparatorio, setCurrentPreparatorio] = useState<Preparatorio | null>(null);
  const [loadingPreparatorios, setLoadingPreparatorios] = useState(true);

  // Carregar preparatórios do banco
  useEffect(() => {
    loadPreparatorios();
  }, []);

  const loadPreparatorios = async () => {
    console.log('[useAuth] Iniciando carregamento de preparatórios...');
    try {
      const { data, error } = await supabase
        .from('preparatorios')
        .select('id, nome, slug')
        .eq('is_active', true)
        .order('nome');

      console.log('[useAuth] Resultado query preparatorios:', { data, error });

      if (error) {
        // Se a tabela não existir, usar preparatório padrão
        console.warn('[useAuth] Erro na query, usando padrão:', error);
        const defaultPrep: Preparatorio = {
          id: DEFAULT_PREPARATORIO_ID,
          nome: 'Ouse Passar',
          slug: 'ouse-passar'
        };
        setPreparatorios([defaultPrep]);
        setCurrentPreparatorio(defaultPrep);
        localStorage.setItem(STORAGE_KEY, defaultPrep.id);
        setLoadingPreparatorios(false);
        return;
      }

      if (data && data.length > 0) {
        console.log('[useAuth] Preparatórios encontrados:', data.length);
        setPreparatorios(data);

        // Tentar carregar seleção salva
        const savedId = localStorage.getItem(STORAGE_KEY);
        console.log('[useAuth] ID salvo no localStorage:', savedId);
        const savedPrep = data.find(p => p.id === savedId);

        if (savedPrep) {
          console.log('[useAuth] Usando preparatório salvo:', savedPrep);
          setCurrentPreparatorio(savedPrep);
        } else {
          // Usar primeiro preparatório
          console.log('[useAuth] Usando primeiro preparatório:', data[0]);
          setCurrentPreparatorio(data[0]);
          localStorage.setItem(STORAGE_KEY, data[0].id);
        }
      } else {
        // Nenhum preparatório encontrado, usar padrão
        console.warn('[useAuth] Nenhum preparatório encontrado, usando padrão');
        const defaultPrep: Preparatorio = {
          id: DEFAULT_PREPARATORIO_ID,
          nome: 'Ouse Passar',
          slug: 'ouse-passar'
        };
        setPreparatorios([defaultPrep]);
        setCurrentPreparatorio(defaultPrep);
        localStorage.setItem(STORAGE_KEY, defaultPrep.id);
      }
    } catch (err) {
      console.error('[useAuth] Erro ao carregar preparatórios:', err);
      // Fallback para preparatório padrão
      const defaultPrep: Preparatorio = {
        id: DEFAULT_PREPARATORIO_ID,
        nome: 'Ouse Passar',
        slug: 'ouse-passar'
      };
      setPreparatorios([defaultPrep]);
      setCurrentPreparatorio(defaultPrep);
    } finally {
      setLoadingPreparatorios(false);
      console.log('[useAuth] Carregamento finalizado');
    }
  };

  const selectPreparatorio = (id: string) => {
    const prep = preparatorios.find(p => p.id === id);
    if (prep) {
      setCurrentPreparatorio(prep);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  return {
    ...auth,
    // Preparatório atual selecionado
    currentPreparatorio,
    // Lista de preparatórios disponíveis
    preparatorios,
    // Função para trocar preparatório
    selectPreparatorio,
    // Loading state
    loadingPreparatorios,
    // Loading combinado
    isLoading: auth.isLoading || loadingPreparatorios,
  };
}

export default useAuth;
