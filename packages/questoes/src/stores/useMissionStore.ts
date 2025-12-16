import { create } from 'zustand';
import {
  TrailMission,
  MissionAnswer,
  MissionResult,
  MassificationCheck,
  ParsedQuestion,
  Conteudo,
} from '../types';
import { PASSING_SCORE } from '../constants';

type MissionPhase = 'content' | 'questions' | 'result' | 'massification';

interface MissionState {
  // Current mission
  currentMission: TrailMission | null;
  phase: MissionPhase;

  // Content phase
  content: Conteudo | null;
  contentRead: boolean;

  // Questions phase
  questions: ParsedQuestion[];
  currentQuestionIndex: number;
  answers: MissionAnswer[];
  startTime: number | null;

  // Result
  result: MissionResult | null;
  massificationCheck: MassificationCheck | null;

  // Actions
  startMission: (mission: TrailMission, content: Conteudo | null, questions: ParsedQuestion[]) => void;
  setPhase: (phase: MissionPhase) => void;
  markContentRead: () => void;
  startQuestions: () => void;

  // Question actions
  answerQuestion: (answer: MissionAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;

  // Finish
  finishMission: () => MissionResult;
  checkMassification: (result: MissionResult) => MassificationCheck;
  retryMission: () => void;

  // Computed
  getCurrentQuestion: () => ParsedQuestion | null;
  getProgress: () => { current: number; total: number; percentage: number };
  getScore: () => { correct: number; total: number; percentage: number };

  // Reset
  reset: () => void;
}

export const useMissionStore = create<MissionState>()((set, get) => ({
  currentMission: null,
  phase: 'content',
  content: null,
  contentRead: false,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  startTime: null,
  result: null,
  massificationCheck: null,

  startMission: (mission, content, questions) => {
    set({
      currentMission: mission,
      phase: content ? 'content' : 'questions',
      content,
      contentRead: false,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: null,
      result: null,
      massificationCheck: null,
    });
  },

  setPhase: (phase) => set({ phase }),

  markContentRead: () => set({ contentRead: true }),

  startQuestions: () => {
    set({
      phase: 'questions',
      startTime: Date.now(),
    });
  },

  answerQuestion: (answer) => {
    set((state) => {
      const existingIndex = state.answers.findIndex(
        (a) => a.question_id === answer.question_id
      );

      if (existingIndex >= 0) {
        const newAnswers = [...state.answers];
        newAnswers[existingIndex] = answer;
        return { answers: newAnswers };
      }

      return { answers: [...state.answers, answer] };
    });
  },

  nextQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.questions.length - 1
      ),
    }));
  },

  previousQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    }));
  },

  goToQuestion: (index) => {
    set((state) => ({
      currentQuestionIndex: Math.max(0, Math.min(index, state.questions.length - 1)),
    }));
  },

  finishMission: () => {
    const { currentMission, questions, answers, startTime } = get();

    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    const result: MissionResult = {
      missionId: currentMission?.id || '',
      totalQuestions,
      correctAnswers,
      score,
      timeSpent,
      answers,
    };

    const massificationCheck = get().checkMassification(result);

    set({
      result,
      massificationCheck,
      phase: massificationCheck.passed ? 'result' : 'massification',
    });

    return result;
  },

  checkMassification: (result) => {
    const passed = result.score >= PASSING_SCORE;

    return {
      passed,
      score: result.score,
      requiredScore: PASSING_SCORE,
      action: passed ? 'unlock_next' : 'massification_required',
    };
  },

  retryMission: () => {
    const { currentMission, content, questions } = get();
    if (currentMission) {
      set({
        phase: content ? 'content' : 'questions',
        contentRead: false,
        currentQuestionIndex: 0,
        answers: [],
        startTime: null,
        result: null,
        massificationCheck: null,
      });
    }
  },

  getCurrentQuestion: () => {
    const { questions, currentQuestionIndex } = get();
    return questions[currentQuestionIndex] || null;
  },

  getProgress: () => {
    const { questions, currentQuestionIndex } = get();
    const total = questions.length;
    const current = currentQuestionIndex + 1;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return { current, total, percentage };
  },

  getScore: () => {
    const { questions, answers } = get();
    const total = questions.length;
    const correct = answers.filter((a) => a.is_correct).length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    return { correct, total, percentage };
  },

  reset: () =>
    set({
      currentMission: null,
      phase: 'content',
      content: null,
      contentRead: false,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      startTime: null,
      result: null,
      massificationCheck: null,
    }),
}));
