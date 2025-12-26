import { supabase } from './supabase';
import { StudyMode } from '../types';

export interface PracticeSession {
    id: string;
    user_id: string;
    study_mode: StudyMode;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy_percentage: number;
    time_spent_seconds: number | null;
    filters: any;
    xp_earned: number;
    created_at: string;
    completed_at: string;
}

export interface CreateSessionData {
    user_id: string;
    study_mode: StudyMode;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    time_spent_seconds?: number;
    filters?: any;
    xp_earned: number;
}

export async function createPracticeSession(data: CreateSessionData): Promise<PracticeSession | null> {
    try {
        const { data: session, error } = await supabase
            .from('practice_sessions')
            .insert({
                user_id: data.user_id,
                study_mode: data.study_mode,
                total_questions: data.total_questions,
                correct_answers: data.correct_answers,
                wrong_answers: data.wrong_answers,
                time_spent_seconds: data.time_spent_seconds || null,
                filters: data.filters || {},
                xp_earned: data.xp_earned,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar sessão de prática:', error);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Erro ao criar sessão de prática:', error);
        return null;
    }
}

export async function getUserPracticeSessions(userId: string, limit = 50): Promise<PracticeSession[]> {
    try {
        const { data, error } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Erro ao buscar sessões de prática:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro ao buscar sessões de prática:', error);
        return [];
    }
}

export async function getUserStats(userId: string) {
    try {
        const { data, error } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return null;
        }

        const sessions = data || [];

        const totalSessions = sessions.length;
        const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
        const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
        const totalWrong = sessions.reduce((sum, s) => sum + s.wrong_answers, 0);
        const averageAccuracy = totalSessions > 0
            ? sessions.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) / totalSessions
            : 0;
        const totalXP = sessions.reduce((sum, s) => sum + s.xp_earned, 0);

        return {
            totalSessions,
            totalQuestions,
            totalCorrect,
            totalWrong,
            averageAccuracy,
            totalXP,
            recentSessions: sessions.slice(0, 10),
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return null;
    }
}
