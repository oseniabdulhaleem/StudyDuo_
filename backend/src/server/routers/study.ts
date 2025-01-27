// src/server/routers/study.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../../services/firebase-admin";

export const studyRouter = router({
  initializeCards: publicProcedure
    .input(
      z.object({
        userId: z.string(), // Add userId to the input
        revisionId: z.string(),
        questions: z.array(
          z.object({
            id: z.string(),
            type: z.enum(["multiple-choice", "fill-in-blank", "matching"]),
            question: z.string(),
            answer: z.union([
              z.string(),
              z.array(z.string()),
              z.record(z.string(), z.string()),
            ]),
            options: z.array(z.string()).optional(),
            pairs: z
              .array(z.object({ left: z.string(), right: z.string() }))
              .optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, revisionId, questions } = input;
      const batch = db.batch();
      const now = new Date();

      // Initial scheduling intervals (in minutes)
      const initialIntervals = [1, 10, 1440]; // 1min, 10min, 1day

      // Create cards with staggered initial review times
      const cards = questions.map((q, index) => {
        // Distribute initial cards across the intervals
        const intervalIndex = index % initialIntervals.length;
        const initialInterval = initialIntervals[intervalIndex];

        return {
          userId,
          questionId: q.id,
          revisionId,
          nextReviewDate: new Date(now.getTime() + initialInterval * 60 * 1000),
          interval: initialInterval,
          ease: 2.5,
          repetitions: 0,
          status: "new",
          createdAt: now,
          lastReviewDate: null,
        };
      });

      // Batch create cards
      for (const card of cards) {
        const cardRef = db.collection("studyCards").doc();
        batch.set(cardRef, card);
      }

      // Initialize study stats
      const statsRef = db
        .collection("studyStats")
        .doc(`${userId}_${revisionId}`);
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
      return { success: true };
    }),

  getNextQuestions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        revisionId: z.string(),
        limit: z.number().default(2),
      })
    )
    .query(async ({ input }) => {
      const { revisionId, limit, userId } = input;
      const now = new Date();
      console.log("In the questions");
      // Get due and overdue cards
      const cards = await db
        .collection("studyCards")
        .where("userId", "==", userId)
        .where("revisionId", "==", revisionId)
        // .where("nextReviewDate", "<=", now)
        // .orderBy("nextReviewDate", "asc")
        // .limit(limit)
        .get();

      // const questions = await Promise.all(
      //   cards.docs.map(async (card) => {
      //     const cardData = card.data();
      //     const question = await db
      //       .collection("questions")
      //       .doc(cardData.questionId)
      //       .get();

      //     return {
      //       ...question.data(),
      //       studyCardId: card.id,
      //       nextReviewDate: cardData.nextReviewDate,
      //       interval: cardData.interval,
      //     };
      //   })
      // );
      //  console.log("Found questions:", questions.length);
      // return questions;

      // for the all questions
      const questions = await Promise.all(
        cards.docs.map(async (card) => {
          const cardData = card.data();

          // Get the question from the revisions collection
          const revisionDoc = await db
            .collection("revisions")
            .doc(revisionId)
            .get();

          const revisionData = revisionDoc.data();
          const question = revisionData?.questions.find(
            (q: any) => q.id === cardData.questionId
          );

          if (!question) {
            console.error(
              `Question not found for cardId: ${cardData.questionId}`
            );
            return null;
          }

          return {
            ...question, // This includes question, answer, type, etc.
            studyCardId: card.id,
            nextReviewDate: cardData.nextReviewDate,
            interval: cardData.interval,
          };
        })
      );

      // for session question only
      // const questions = await Promise.all(
      //   cards.docs.map(async (card) => {
      //     const cardData = card.data();

      //     // Get the question from the revisions collection
      //     const revisionDoc = await db
      //       .collection("revisions")
      //       .doc(revisionId)
      //       .get();

      //     const revisionData = revisionDoc.data();
      //     const question = revisionData?.questions.find(
      //       (q: any) => q.id === cardData.questionId
      //     );

      //     if (!question) {
      //       console.error(
      //         `Question not found for cardId: ${cardData.questionId}`
      //       );
      //       return null;
      //     }

      //     return {
      //       ...question,
      //       studyCardId: card.id,
      //       nextReviewDate: cardData.nextReviewDate,
      //       interval: cardData.interval,
      //     };
      //   })
      // );

      // Filter out any null values
      const validQuestions = questions.filter((q) => q !== null);
      console.log("Found questions:", validQuestions);
      return validQuestions;
    }),
  getRevisions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { userId } = input;
      console.log("UserId1", userId);
      const revisions = await db
        .collection("revisions")
        .where("userId", "==", userId)
        // .orderBy("createdAt")
        .get();

      return revisions.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),
  submitReview: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        answer: z.any(), // or be more specific based on your needs
        responseTime: z.number(),
        difficulty: z.enum(["again", "hard", "good", "easy"]),
      })
    )
    .mutation(async ({ input }) => {
      const { cardId, answer, responseTime, difficulty } = input;
      const now = new Date();

      try {
        // Get the card with timeout
        const cardRef = db.collection("studyCards").doc(cardId);
        const card = (await Promise.race([
          cardRef.get(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Card fetch timeout")), 10000)
          ),
        ])) as FirebaseFirestore.DocumentSnapshot;;

        if (!card.exists) {
          throw new Error("Card not found");
        }

        const cardData = card.data();
        const newInterval = calculateNewInterval(difficulty);

        // Update card with timeout
        await Promise.race([
          cardRef.update({
            lastReviewDate: now,
            nextReviewDate: new Date(now.getTime() + newInterval * 60 * 1000),
            interval: newInterval,
            repetitions: cardData.repetitions + 1,
            answer,
            responseTime,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Card update timeout")), 10000)
          ),
        ]);

        return { success: true, nextReview: now };
      } catch (error) {
        console.error("Review submission error:", error);
        throw error;
      }
    }),
    // In your backend router
submitBatchReviews: publicProcedure
  .input(
    z.object({
      reviews: z.array(
        z.object({
          cardId: z.string(),
          answer: z.any(),
          responseTime: z.number(),
          difficulty: z.enum(["again", "hard", "good", "easy"]),
          timestamp: z.union([z.string(), z.date()]) //z.date()
        })
      )
    })
  )
  .mutation(async ({ input }) => {
    const batch = db.batch();
    const now = new Date();

    input.reviews.forEach(({ cardId, answer, responseTime, difficulty, timestamp }) => {
      const cardRef = db.collection("studyCards").doc(cardId);
      const parsedTimestamp =
        typeof timestamp === "string" ? new Date(timestamp) : timestamp; // Parse string to Date if needed
      const newInterval = calculateNewInterval(difficulty);

      batch.update(cardRef, {
        lastReviewDate: timestamp,
        nextReviewDate: new Date(parsedTimestamp.getTime() + newInterval * 60 * 1000),
        interval: newInterval,
        answer,
        responseTime,
      });
    });

    await batch.commit();
    return { success: true };
  })
    
});

export const calculateNewInterval = (difficulty) => {
  switch (difficulty) {
    case "again":
      return 1; // 1 minute
    case "hard":
      return 6; // 6 minutes
    case "good":
      return 10; // 10 minutes
    case "easy":
      return 5760; // 4 days in minutes
  }
};
