// Service for fetching user statistics from Supabase
import { supabase } from './supabaseClient';
import { questionsDb } from './questionsDbClient';

export interface MateriaStats {
  materia: string;
  acertos: number;
  total: number;
  percentual: number;
  status: 'forte' | 'medio' | 'fraco';
}

export interface WeeklyStats {
  semana: string;
  questoes: number;
  acerto: number;
}

export interface DailyStats {
  dia: string;
  questoes: number;
  acerto: number;
}

/**
 * Get user statistics by subject (matéria)
 */
export async function getUserMateriaStats(userId: string): Promise<MateriaStats[]> {
  try {
    console.log('[statsService] Fetching materia stats for user:', userId);

    // Get all mission answers for this user
    const { data: answers, error } = await supabase
      .from('mission_answers')
      .select('question_id, is_correct')
      .eq('user_id', userId);

    if (error) {
      console.error('[statsService] Error fetching mission answers:', error);
      return [];
    }

    if (!answers || answers.length === 0) {
      console.log('[statsService] No answers found for user');
      return [];
    }

    // Get unique question IDs
    const questionIds = [...new Set(answers.map(a => a.question_id))];
    console.log(`[statsService] Found ${questionIds.length} unique questions`);

    // Fetch questions from questions DB to get matéria
    const { data: questions, error: questionsError } = await questionsDb
      .from('questoes')
      .select('id, materia')
      .in('id', questionIds);

    if (questionsError) {
      console.error('[statsService] Error fetching questions:', questionsError);
      return [];
    }

    if (!questions || questions.length === 0) {
      console.log('[statsService] No questions found in questions DB');
      return [];
    }

    // Create a map of question_id -> materia
    const questionMateriaMap = new Map(
      questions.map(q => [q.id, q.materia])
    );

    // Group answers by matéria
    const materiaMap = new Map<string, { correct: number; total: number }>();

    answers.forEach(answer => {
      const materia = questionMateriaMap.get(answer.question_id);
      if (!materia) return;

      if (!materiaMap.has(materia)) {
        materiaMap.set(materia, { correct: 0, total: 0 });
      }

      const stats = materiaMap.get(materia)!;
      stats.total++;
      if (answer.is_correct) {
        stats.correct++;
      }
    });

    // Convert to array and calculate percentages
    const materiaStats: MateriaStats[] = Array.from(materiaMap.entries())
      .map(([materia, stats]) => {
        const percentual = Math.round((stats.correct / stats.total) * 100);
        let status: 'forte' | 'medio' | 'fraco';

        if (percentual >= 70) status = 'forte';
        else if (percentual >= 50) status = 'medio';
        else status = 'fraco';

        return {
          materia,
          acertos: stats.correct,
          total: stats.total,
          percentual,
          status,
        };
      })
      .sort((a, b) => b.percentual - a.percentual); // Sort by percentage descending

    console.log('[statsService] Materia stats:', materiaStats);
    return materiaStats;
  } catch (err) {
    console.error('[statsService] Exception in getUserMateriaStats:', err);
    return [];
  }
}

/**
 * Get user weekly evolution (last 4 weeks)
 */
export async function getUserWeeklyEvolution(userId: string): Promise<WeeklyStats[]> {
  try {
    console.log('[statsService] Fetching weekly evolution for user:', userId);

    // Get answers from last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: answers, error } = await supabase
      .from('mission_answers')
      .select('is_correct, created_at')
      .eq('user_id', userId)
      .gte('created_at', fourWeeksAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[statsService] Error fetching weekly answers:', error);
      return [];
    }

    if (!answers || answers.length === 0) {
      console.log('[statsService] No answers found for weekly evolution');
      return [];
    }

    // Group by week
    const weekMap = new Map<number, { correct: number; total: number }>();

    answers.forEach(answer => {
      const date = new Date(answer.created_at);
      const weekNum = Math.floor((Date.now() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = 3 - Math.min(weekNum, 3); // 0 = 4 weeks ago, 3 = current week

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { correct: 0, total: 0 });
      }

      const stats = weekMap.get(weekKey)!;
      stats.total++;
      if (answer.is_correct) {
        stats.correct++;
      }
    });

    // Convert to array
    const weeklyStats: WeeklyStats[] = [];
    for (let i = 0; i < 4; i++) {
      const stats = weekMap.get(i) || { correct: 0, total: 0 };
      const acerto = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

      weeklyStats.push({
        semana: `Sem ${i + 1}`,
        questoes: stats.total,
        acerto,
      });
    }

    console.log('[statsService] Weekly evolution:', weeklyStats);
    return weeklyStats;
  } catch (err) {
    console.error('[statsService] Exception in getUserWeeklyEvolution:', err);
    return [];
  }
}

/**
 * Get user daily evolution (last 7 days)
 */
export async function getUserDailyEvolution(userId: string): Promise<DailyStats[]> {
  try {
    console.log('[statsService] Fetching daily evolution for user:', userId);

    // Get answers from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today + 6 days back
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: answers, error } = await supabase
      .from('mission_answers')
      .select('is_correct, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[statsService] Error fetching daily answers:', error);
      return [];
    }

    if (!answers || answers.length === 0) {
      console.log('[statsService] No answers found for daily evolution');
      return [];
    }

    // Group by day
    const dayMap = new Map<string, { correct: number; total: number }>();

    answers.forEach(answer => {
      const date = new Date(answer.created_at);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { correct: 0, total: 0 });
      }

      const stats = dayMap.get(dayKey)!;
      stats.total++;
      if (answer.is_correct) {
        stats.correct++;
      }
    });

    // Generate last 7 days labels
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dailyStats: DailyStats[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const dayName = diasSemana[date.getDay()];

      const stats = dayMap.get(dayKey) || { correct: 0, total: 0 };
      const acerto = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

      dailyStats.push({
        dia: dayName,
        questoes: stats.total,
        acerto,
      });
    }

    console.log('[statsService] Daily evolution:', dailyStats);
    return dailyStats;
  } catch (err) {
    console.error('[statsService] Exception in getUserDailyEvolution:', err);
    return [];
  }
}

/**
 * Get user comparison percentile (how user ranks vs others)
 */
export async function getUserPercentile(userId: string): Promise<number> {
  try {
    console.log('[statsService] Calculating percentile for user:', userId);

    // Get current user's correct answers
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('correct_answers')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('[statsService] Error fetching user profile:', userError);
      return 50; // Default to 50th percentile
    }

    const userCorrect = userProfile.correct_answers || 0;

    // Get count of users with fewer correct answers
    const { count: lowerCount, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .lt('correct_answers', userCorrect);

    if (countError) {
      console.error('[statsService] Error counting users:', countError);
      return 50;
    }

    // Get total user count
    const { count: totalCount, error: totalError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (totalError || !totalCount) {
      console.error('[statsService] Error getting total user count:', totalError);
      return 50;
    }

    const percentile = Math.round(((lowerCount || 0) / totalCount) * 100);
    console.log(`[statsService] User percentile: ${percentile}%`);
    return percentile;
  } catch (err) {
    console.error('[statsService] Exception in getUserPercentile:', err);
    return 50;
  }
}

/**
 * Get user's average answer time (in seconds)
 */
export async function getUserAverageTime(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('mission_answers')
      .select('time_spent')
      .eq('user_id', userId)
      .not('time_spent', 'is', null);

    if (error || !data || data.length === 0) {
      return 0;
    }

    const totalTime = data.reduce((sum, a) => sum + (a.time_spent || 0), 0);
    const avgTime = Math.round(totalTime / data.length);
    return avgTime;
  } catch (err) {
    console.error('[statsService] Exception in getUserAverageTime:', err);
    return 0;
  }
}

/**
 * Get count of completed missions for user
 * Counts missions with status='completed' from the user's trails
 */
export async function getUserCompletedMissions(userId: string): Promise<number> {
  try {
    // First get the user's trail IDs
    const { data: userTrails, error: trailsError } = await supabase
      .from('user_trails')
      .select('id')
      .eq('user_id', userId);

    if (trailsError || !userTrails || userTrails.length === 0) {
      return 0;
    }

    const trailIds = userTrails.map(t => t.id);

    // Get rounds from those trails
    const { data: rounds, error: roundsError } = await supabase
      .from('trail_rounds')
      .select('id')
      .in('trail_id', trailIds);

    if (roundsError || !rounds || rounds.length === 0) {
      return 0;
    }

    const roundIds = rounds.map(r => r.id);

    // Count completed missions in those rounds
    const { count, error } = await supabase
      .from('trail_missions')
      .select('*', { count: 'exact', head: true })
      .in('round_id', roundIds)
      .eq('status', 'completed');

    if (error) {
      console.error('[statsService] Error counting completed missions:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[statsService] Exception in getUserCompletedMissions:', err);
    return 0;
  }
}

/**
 * Get subject evolution comparing last 7 days vs previous 7 days
 */
export interface SubjectEvolution {
  materia: string;
  currentPercentage: number;
  previousPercentage: number;
  evolution: number; // positive = improvement, negative = decline
}

export async function getUserSubjectEvolution(userId: string): Promise<SubjectEvolution[]> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // Get answers from last 14 days
    const { data: answers, error } = await supabase
      .from('mission_answers')
      .select('question_id, is_correct, created_at')
      .eq('user_id', userId)
      .gte('created_at', fourteenDaysAgo.toISOString());

    if (error || !answers || answers.length === 0) {
      return [];
    }

    // Get question IDs
    const questionIds = [...new Set(answers.map(a => a.question_id))];

    // Fetch matérias from questions DB
    const { data: questions, error: qError } = await questionsDb
      .from('questoes')
      .select('id, materia')
      .in('id', questionIds);

    if (qError || !questions) {
      return [];
    }

    const questionMateriaMap = new Map(questions.map(q => [q.id, q.materia]));

    // Group by period and matéria
    const currentPeriod = new Map<string, { correct: number; total: number }>();
    const previousPeriod = new Map<string, { correct: number; total: number }>();

    answers.forEach(answer => {
      const materia = questionMateriaMap.get(answer.question_id);
      if (!materia) return;

      const answerDate = new Date(answer.created_at);
      const isCurrentPeriod = answerDate >= sevenDaysAgo;
      const targetMap = isCurrentPeriod ? currentPeriod : previousPeriod;

      if (!targetMap.has(materia)) {
        targetMap.set(materia, { correct: 0, total: 0 });
      }

      const stats = targetMap.get(materia)!;
      stats.total++;
      if (answer.is_correct) stats.correct++;
    });

    // Calculate evolution for each matéria
    const allMaterias = new Set([...currentPeriod.keys(), ...previousPeriod.keys()]);
    const evolutions: SubjectEvolution[] = [];

    allMaterias.forEach(materia => {
      const current = currentPeriod.get(materia);
      const previous = previousPeriod.get(materia);

      const currentPct = current && current.total > 0
        ? Math.round((current.correct / current.total) * 100)
        : 0;
      const previousPct = previous && previous.total > 0
        ? Math.round((previous.correct / previous.total) * 100)
        : 0;

      // Only include if there's data in current period
      if (current && current.total > 0) {
        evolutions.push({
          materia,
          currentPercentage: currentPct,
          previousPercentage: previousPct,
          evolution: currentPct - previousPct,
        });
      }
    });

    // Sort by absolute evolution (most change first)
    return evolutions.sort((a, b) => Math.abs(b.evolution) - Math.abs(a.evolution)).slice(0, 3);
  } catch (err) {
    console.error('[statsService] Exception in getUserSubjectEvolution:', err);
    return [];
  }
}

/**
 * Get study recommendations based on user performance
 */
export interface Recommendation {
  type: 'weak_subject' | 'review' | 'streak' | 'practice';
  title: string;
  description: string;
  materia?: string;
  count?: number;
  color: string;
}

export async function getUserRecommendations(userId: string): Promise<Recommendation[]> {
  try {
    const recommendations: Recommendation[] = [];

    // Get matéria stats to find weakest subject
    const materiaStats = await getUserMateriaStats(userId);

    if (materiaStats.length > 0) {
      // Find weakest subject (lowest percentage)
      const weakest = materiaStats.reduce((min, curr) =>
        curr.percentual < min.percentual ? curr : min
      );

      if (weakest.percentual < 70) {
        recommendations.push({
          type: 'weak_subject',
          title: `Foque em ${weakest.materia}`,
          description: `Taxa de acerto: ${weakest.percentual}%`,
          materia: weakest.materia,
          color: '#E74C3C',
        });
      }
    }

    // Count questions that could be reviewed (answered incorrectly)
    const { count: wrongAnswers } = await supabase
      .from('mission_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_correct', false);

    if (wrongAnswers && wrongAnswers > 0) {
      recommendations.push({
        type: 'review',
        title: `Revise ${wrongAnswers} questões`,
        description: 'Questões que você errou anteriormente',
        count: wrongAnswers,
        color: '#3498DB',
      });
    }

    // If no recommendations yet, add a generic practice one
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'practice',
        title: 'Continue praticando',
        description: 'Mantenha seu ritmo de estudos!',
        color: '#2ECC71',
      });
    }

    return recommendations.slice(0, 2); // Max 2 recommendations
  } catch (err) {
    console.error('[statsService] Exception in getUserRecommendations:', err);
    return [];
  }
}

// Types for league ranking
export type LeagueTier = 'ferro' | 'bronze' | 'prata' | 'ouro' | 'diamante';

export interface RankingMember {
  id: string;
  name: string;
  avatar_url?: string;
  xp: number;
  level: number;
  position: number;
  isCurrentUser?: boolean;
}

export interface LeagueRanking {
  league: LeagueTier;
  members: RankingMember[];
  userPosition: number;
  totalMembers: number;
}

/**
 * Get weekly ranking for a user's league
 * Returns 5 members centered around the current user (with edge case handling)
 */
export async function getLeagueRanking(userId: string): Promise<LeagueRanking | null> {
  try {
    console.log('[statsService] Fetching league ranking for user:', userId);

    // First, get the user's league
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url, xp, level, league_tier')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('[statsService] Error fetching user profile for ranking:', userError);
      return null;
    }

    const userLeague: LeagueTier = userProfile.league_tier || 'ferro';

    // Get all members in the same league, ordered by XP
    const { data: leagueMembers, error: leagueError } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url, xp, level')
      .eq('league_tier', userLeague)
      .order('xp', { ascending: false });

    if (leagueError) {
      console.error('[statsService] Error fetching league members:', leagueError);
      return null;
    }

    if (!leagueMembers || leagueMembers.length === 0) {
      return {
        league: userLeague,
        members: [],
        userPosition: 1,
        totalMembers: 0,
      };
    }

    // Add position to each member and mark current user
    const rankedMembers: RankingMember[] = leagueMembers.map((member, index) => ({
      id: member.id,
      name: member.name || 'Estudante',
      avatar_url: member.avatar_url,
      xp: member.xp || 0,
      level: member.level || 1,
      position: index + 1,
      isCurrentUser: member.id === userId,
    }));

    // Find user's position
    const userPosition = rankedMembers.findIndex(m => m.isCurrentUser) + 1;
    const totalMembers = rankedMembers.length;

    // Calculate window of 5 members centered on user
    let startIndex: number;
    let endIndex: number;

    if (totalMembers <= 5) {
      // Show all members if 5 or fewer
      startIndex = 0;
      endIndex = totalMembers;
    } else if (userPosition <= 3) {
      // User is in top 3, show first 5
      startIndex = 0;
      endIndex = 5;
    } else if (userPosition > totalMembers - 2) {
      // User is in bottom 2, show last 5
      startIndex = totalMembers - 5;
      endIndex = totalMembers;
    } else {
      // User is in the middle, center on user (2 above, 2 below)
      startIndex = userPosition - 3; // -3 because position is 1-indexed
      endIndex = userPosition + 2;
    }

    const visibleMembers = rankedMembers.slice(startIndex, endIndex);

    console.log(`[statsService] League ranking: ${userLeague}, position ${userPosition}/${totalMembers}`);

    return {
      league: userLeague,
      members: visibleMembers,
      userPosition,
      totalMembers,
    };
  } catch (err) {
    console.error('[statsService] Exception in getLeagueRanking:', err);
    return null;
  }
}
