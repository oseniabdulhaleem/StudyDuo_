// src/store/useQuestions.ts
import { create } from "zustand";
import type { StudyCard } from "@/types/router";

interface QuestionStore {
  questions: { [revisionId: string]: StudyCard[] };
  isLoading: boolean;
  setQuestions: (revisionId: string, questions: StudyCard[]) => void;
  getQuestions: (revisionId: string) => StudyCard[];
}

export const useQuestions = create<QuestionStore>((set, get) => ({
  questions: {},
  isLoading: true,
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setQuestions: (revisionId, questions) =>
    set((state) => ({
      questions: {
        ...state.questions,
        [revisionId]: questions,
      },
    })),
  getQuestions: (revisionId) => get().questions[revisionId] || [],
}));
