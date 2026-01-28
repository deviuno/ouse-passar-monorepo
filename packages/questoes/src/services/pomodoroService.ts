// Pomodoro Sessions Service - Tracks study time using Pomodoro technique
import { supabase } from './supabaseClient';

export interface PomodoroSession {
  id?: string;
  user_id?: string;
  session_type: 'study' | 'break' | 'long_break';
  duration_seconds: number;
  completed: boolean;
  materia?: string | null;
  assunto?: string | null;
  started_at: string;
  ended_at: string;
  created_at?: string;
}

export interface DailyStudyStats {
  totalSeconds: number;
  studySessions: number;
  breakSessions: number;
}

export interface WeeklyStudyStats {
  totalSeconds: number;
  studySessions: number;
  dailyData: { date: string; seconds: number }[];
}

// Save a completed Pomodoro session
export const savePomodoroSession = async (
  session: Omit<PomodoroSession, 'id' | 'user_id' | 'created_at'>
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[pomodoroService] User not logged in, session not saved');
    return;
  }

  const { error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: user.id,
      session_type: session.session_type,
      duration_seconds: session.duration_seconds,
      completed: session.completed,
      materia: session.materia || null,
      assunto: session.assunto || null,
      started_at: session.started_at,
      ended_at: session.ended_at,
    });

  if (error) {
    console.error('[pomodoroService] Error saving session:', error);
    throw error;
  }

  console.log('[pomodoroService] Session saved successfully');
};

// Get today's total study time in seconds
export const getTodayStudyTime = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .eq('session_type', 'study')
    .eq('completed', true)
    .gte('started_at', today.toISOString());

  if (error) {
    console.error('[pomodoroService] Error fetching today stats:', error);
    return 0;
  }

  const totalSeconds = (data || []).reduce(
    (sum, session) => sum + (session.duration_seconds || 0),
    0
  );

  return totalSeconds;
};

// Get today's complete stats
export const getTodayStats = async (): Promise<DailyStudyStats> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { totalSeconds: 0, studySessions: 0, breakSessions: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('session_type, duration_seconds')
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('started_at', today.toISOString());

  if (error) {
    console.error('[pomodoroService] Error fetching today stats:', error);
    return { totalSeconds: 0, studySessions: 0, breakSessions: 0 };
  }

  const sessions = data || [];

  const studySessions = sessions.filter(s => s.session_type === 'study');
  const breakSessions = sessions.filter(s => s.session_type !== 'study');

  const totalSeconds = studySessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0),
    0
  );

  return {
    totalSeconds,
    studySessions: studySessions.length,
    breakSessions: breakSessions.length,
  };
};

// Get weekly study stats
export const getWeeklyStats = async (): Promise<WeeklyStudyStats> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { totalSeconds: 0, studySessions: 0, dailyData: [] };
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('started_at, duration_seconds')
    .eq('user_id', user.id)
    .eq('session_type', 'study')
    .eq('completed', true)
    .gte('started_at', weekAgo.toISOString())
    .order('started_at', { ascending: true });

  if (error) {
    console.error('[pomodoroService] Error fetching weekly stats:', error);
    return { totalSeconds: 0, studySessions: 0, dailyData: [] };
  }

  const sessions = data || [];

  // Group by day
  const dailyMap = new Map<string, number>();

  sessions.forEach(session => {
    const date = new Date(session.started_at).toISOString().split('T')[0];
    const current = dailyMap.get(date) || 0;
    dailyMap.set(date, current + (session.duration_seconds || 0));
  });

  const dailyData = Array.from(dailyMap.entries()).map(([date, seconds]) => ({
    date,
    seconds,
  }));

  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0),
    0
  );

  return {
    totalSeconds,
    studySessions: sessions.length,
    dailyData,
  };
};

// Get study history
export const getStudyHistory = async (
  days: number = 30
): Promise<PomodoroSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', startDate.toISOString())
    .order('started_at', { ascending: false });

  if (error) {
    console.error('[pomodoroService] Error fetching history:', error);
    return [];
  }

  return data || [];
};

export const pomodoroService = {
  savePomodoroSession,
  getTodayStudyTime,
  getTodayStats,
  getWeeklyStats,
  getStudyHistory,
};

export default pomodoroService;
