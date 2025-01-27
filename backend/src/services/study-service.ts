// src/services/study-service.ts
import { db } from "./firebase-admin";
import { StudyCard, Question, StudyStats, ReviewHistory } from "../types";
import { StudyScheduler } from "./scheduler";

export class StudyService {
  private scheduler: StudyScheduler;

  constructor() {
    this.scheduler = new StudyScheduler();
  }

  async initializeCards(
    userId: string,
    revisionId: string,
    questions: Question[]
  ) {
    const batch = db.batch();
    const now = new Date();

    // Initial intervals in minutes (1min, 10min, 1day)
    const initialIntervals = [1, 10, 1440];

    const cards: Partial<StudyCard>[] = questions.map((q, index) => {
      const intervalIndex = index % initialIntervals.length;
      const initialInterval = initialIntervals[intervalIndex];

      return {
        userId,
        questionId: q.id,
        revisionId,
        nextReviewDate: new Date(now.getTime() + initialInterval * 60 * 1000),
        dueDate: new Date(now.getTime() + initialInterval * 60 * 1000),
        interval: initialInterval,
        ease: 2.5,
        repetitions: 0,
        status: "new",
        createdAt: now,
        lastReviewDate: null,
      };
    });

    // Create cards
    for (const card of cards) {
      const cardRef = db.collection("studyCards").doc();
      batch.set(cardRef, card);
    }

    // Initialize stats
    const statsRef = db.collection("studyStats").doc(`${userId}_${revisionId}`);
    batch.set(statsRef, {
      userId,
      revisionId,
      totalCards: questions.length,
      cardsLearned: 0,
      cardsReviewed: 0,
      streak: 0,
      lastStudyDate: null,
      reviewsByDay: {},
      averageEase: 2.5,
      retentionRate: 0,
      createdAt: now,
    });

    await batch.commit();
  }

  async checkAnswer(question: Question, userAnswer: any): Promise<boolean> {
    switch (question.type) {
      case "multiple-choice":
        return userAnswer === question.answer;

      case "fill-in-blank":
        const correctAnswer = question.answer as string;
        return (
          userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
        );

      case "matching":
        const correctPairs = question.pairs || [];
        return Object.entries(userAnswer).every(([left, right]) => {
          const correctPair = correctPairs.find((p) => p.left === left);
          return correctPair && correctPair.right === right;
        });

      default:
        return false;
    }
  }

  async submitReview(
    studyCardId: string,
    userId: string,
    answer: any,
    responseTime: number
  ) {
    return await db.runTransaction(async (transaction) => {
      const cardRef = db.collection("studyCards").doc(studyCardId);
      const card = await transaction.get(cardRef);

      if (!card.exists) {
        throw new Error("Card not found");
      }

      const cardData = card.data() as StudyCard;
      const questionRef = db.collection("questions").doc(cardData.questionId);
      const question = await transaction.get(questionRef);
      const questionData = question.data() as Question;

      const wasCorrect = await this.checkAnswer(questionData, answer);
      const now = new Date();

      // Calculate next review schedule
      const scheduleUpdate = this.scheduler.calculateNextReview(
        cardData,
        wasCorrect
      );

      // Update card
      transaction.update(cardRef, {
        ...scheduleUpdate,
        lastReviewDate: now,
        status: scheduleUpdate.interval >= 1440 ? "review" : "learning",
      });

      // Record review history
      const historyRef = db.collection("reviewHistory").doc();
      transaction.set(historyRef, {
        userId,
        studyCardId,
        questionId: cardData.questionId,
        revisionId: cardData.revisionId,
        reviewedAt: now,
        responseTime,
        selectedOption: answer,
        wasCorrect,
        wasOverdue: cardData.nextReviewDate < now,
        previousInterval: cardData.interval,
        newInterval: scheduleUpdate.interval,
        previousEase: cardData.ease,
        newEase: scheduleUpdate.ease,
      });

      return { wasCorrect, nextReview: scheduleUpdate.nextReviewDate };
    });
  }
}
