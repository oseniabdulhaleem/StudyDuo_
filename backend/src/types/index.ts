// src/types/index.ts
export interface StudyCard {
  id: string;
  userId: string;
  questionId: string;
  revisionId: string;
  nextReviewDate: Date;
  dueDate: Date;
  actualReviewDate?: Date;
  interval: number; // in minutes
  ease: number;
  repetitions: number;
  status: "new" | "learning" | "review" | "overdue";
  createdAt: Date;
  lastReviewDate: Date | null;
}

export interface Question {
  id: string;
  type: "multiple-choice" | "fill-in-blank" | "matching";
  question: string;
  answer: string | string[] | Record<string, string>;
  options?: string[];
  pairs?: Array<{ left: string; right: string }>;
  explanation?: string;
}

export interface StudyStats {
  userId: string;
  revisionId: string;
  totalCards: number;
  cardsLearned: number;
  cardsReviewed: number;
  streak: number;
  lastStudyDate: Date | null;
  reviewsByDay: Record<string, number>;
  averageEase: number;
  retentionRate: number;
  createdAt: Date;
}

export interface ReviewHistory {
  id: string;
  userId: string;
  studyCardId: string;
  questionId: string;
  revisionId: string;
  reviewedAt: Date;
  responseTime: number;
  selectedOption: string;
  wasCorrect: boolean;
  wasOverdue: boolean;
  previousInterval: number;
  newInterval: number;
  previousEase: number;
  newEase: number;
}

// types/index.ts (optional but recommended)
export interface UserData {
  credits: number;
  createdAt: Date;
}

export interface Transaction {
  userId: string;
  amount: number;
  timestamp: Date;
  type: 'purchase' | 'deduction';
}