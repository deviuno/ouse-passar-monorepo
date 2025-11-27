import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import {
  fetchUserProfile,
  transformProfileToStats,
  fetchUserAnswers,
  fetchUserReviews,
  fetchUserFlashcards,
  fetchUserCourses,
} from '../services/userService';
import { UserStats, UserAnswer, ReviewItem, Flashcard } from '../types';
import { INITIAL_USER_STATS } from '../constants';

interface UseSupabaseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  stats: UserStats;
  globalAnswers: UserAnswer[];
  reviews: ReviewItem[];
  flashcards: Flashcard[];
  ownedCourseIds: string[];
  refreshUserData: () => Promise<void>;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  setGlobalAnswers: React.Dispatch<React.SetStateAction<UserAnswer[]>>;
  setReviews: React.Dispatch<React.SetStateAction<ReviewItem[]>>;
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  setOwnedCourseIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // User data states
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('ousepassar_stats');
    return saved ? JSON.parse(saved) : INITIAL_USER_STATS;
  });

  const [globalAnswers, setGlobalAnswers] = useState<UserAnswer[]>(() => {
    const saved = localStorage.getItem('ousepassar_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('ousepassar_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('ousepassar_flashcards');
    return saved ? JSON.parse(saved) : [];
  });

  const [ownedCourseIds, setOwnedCourseIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ousepassar_owned_courses');
    return saved ? JSON.parse(saved) : ['pf', 'prf', 'pc', 'perito']; // Default free courses
  });

  // Persist to localStorage as fallback
  useEffect(() => {
    localStorage.setItem('ousepassar_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('ousepassar_history', JSON.stringify(globalAnswers));
  }, [globalAnswers]);

  useEffect(() => {
    localStorage.setItem('ousepassar_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('ousepassar_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('ousepassar_owned_courses', JSON.stringify(ownedCourseIds));
  }, [ownedCourseIds]);

  // Fetch user data from Supabase
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch all user data in parallel
      const [profile, answers, userReviews, userFlashcards, userCourses] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserAnswers(userId),
        fetchUserReviews(userId),
        fetchUserFlashcards(userId),
        fetchUserCourses(userId),
      ]);

      if (profile) {
        setStats(transformProfileToStats(profile));
      }

      if (answers.length > 0) {
        setGlobalAnswers(answers);
      }

      if (userReviews.length > 0) {
        setReviews(userReviews);
      }

      if (userFlashcards.length > 0) {
        setFlashcards(userFlashcards);
      }

      // Combine default free courses with purchased courses
      const freeCourses = ['pf', 'prf', 'pc', 'perito'];
      const allOwnedCourses = [...new Set([...freeCourses, ...userCourses])];
      setOwnedCourseIds(allOwnedCourses);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }, [user?.id, fetchUserData]);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserData(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          // Reset to defaults on sign out
          setStats(INITIAL_USER_STATS);
          setGlobalAnswers([]);
          setReviews([]);
          setFlashcards([]);
          setOwnedCourseIds(['pf', 'prf', 'pc', 'perito']);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  return {
    user,
    session,
    loading,
    stats,
    globalAnswers,
    reviews,
    flashcards,
    ownedCourseIds,
    refreshUserData,
    setStats,
    setGlobalAnswers,
    setReviews,
    setFlashcards,
    setOwnedCourseIds,
  };
};
