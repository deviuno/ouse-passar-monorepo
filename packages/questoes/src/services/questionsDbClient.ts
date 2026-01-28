// Cliente Supabase para o banco de questões
// NOTA: Banco de questões foi unificado com o banco principal
// O projeto secundário (swzosaapqtyhmwdiwdje) foi descontinuado
// Agora sempre usamos o banco principal (avlttxzppcywybiaxxzd)
// Reutilizamos o cliente principal para evitar múltiplas instâncias do GoTrueClient
import { supabase } from './supabaseClient';

export const questionsDb = supabase;

export default questionsDb;
