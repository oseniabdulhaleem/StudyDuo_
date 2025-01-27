// src/services/scheduler.ts
import { StudyCard } from "../types";

export class StudyScheduler {
  private readonly params = {
    initialInterval: 1, // 1 minute
    intervalModifier: 1,
    easeModifier: 1,
    hardIntervalModifier: 0.8,
    maxInterval: 36500, // 100 years in days
    minEase: 1.3,
  };

  calculateNextReview(card: StudyCard, wasCorrect: boolean) {
    let { interval, ease } = card;
    const now = new Date();

    if (wasCorrect) {
      if (card.repetitions === 0) {
        interval = 10; // 10 minutes
      } else if (card.repetitions === 1) {
        interval = 1440; // 1 day
      } else {
        interval = Math.min(
          interval * ease * this.params.intervalModifier,
          this.params.maxInterval
        );
      }
      ease = Math.min(ease * 1.1, 2.5); // Cap ease at 2.5
    } else {
      interval = this.params.initialInterval;
      ease = Math.max(ease * 0.85, this.params.minEase);
    }

    return {
      interval: Math.round(interval),
      ease,
      nextReviewDate: new Date(now.getTime() + interval * 60 * 1000),
      repetitions: card.repetitions + 1,
    };
  }

  isOverdue(card: StudyCard): boolean {
    return card.nextReviewDate < new Date();
  }

  getOverduePenalty(card: StudyCard): number {
    if (!this.isOverdue(card)) return 1;

    const daysOverdue = Math.floor(
      (new Date().getTime() - card.nextReviewDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Penalty increases with days overdue, max 50% reduction
    return Math.max(0.5, 1 - daysOverdue * 0.1);
  }
}
