// // src/types/router.ts
// import { z } from "zod";
// import { initTRPC } from "@trpc/server";
// import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// // Initialize tRPC
// const t = initTRPC.create();

// // Define the schemas
// const questionSchema = z.object({
//   id: z.string(),
//   type: z.enum(["multiple-choice", "fill-in-blank", "matching"]),
//   question: z.string(),
//   answer: z.union([
//     z.string(),
//     z.array(z.string()),
//     z.record(z.string(), z.string()),
//   ]),
//   options: z.array(z.string()).optional(),
//   pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
// });

// // Create the router definition
// export const appRouter = t.router({
//   study: t.router({
//     initializeCards: t.procedure
//       .input(
//         z.object({
//           userId: z.string(),
//           revisionId: z.string(),
//           questions: z.array(questionSchema),
//         })
//       )
//       .mutation(() => {
//         return { success: true };
//       }),

//     getNextQuestions: t.procedure
//       .input(
//         z.object({
//           userId: z.string(),
//           revisionId: z.string(),
//           limit: z.number().optional(),
//         })
//       )
//       .query(() => {
//         return [];
//       }),
//   }),
// });

// // Export types
// export type AppRouter = typeof appRouter;
// export type RouterInput = inferRouterInputs<AppRouter>;
// export type RouterOutput = inferRouterOutputs<AppRouter>;


// src/types/router.ts
import { z } from "zod";
import { initTRPC } from "@trpc/server";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// Initialize tRPC
const t = initTRPC.create();

// Define schemas
const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "fill-in-blank", "matching"]),
  question: z.string(),
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]),
  options: z.array(z.string()).optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
});

const revisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
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
  userId: z.string(),
  status: z.string(),
  notes: z.string().optional(),
});

// add field to store number of questions instead of fetching all questions

// Define the study card type
export interface StudyCard {
  // id: string;
  // studyCardId: string;
  // nextReviewDate: string;
  // interval: number;
  // type: "multiple-choice" | "fill-in-blank" | "matching";
  // question: string;
  // answer: string | string[] | Record<string, string>;
  // options?: string[];
  // pairs?: Array<{ left: string; right: string }>;
  id: string;
  type: "multiple-choice" | "fill-in-blank" | "matching" | "true-false";
  question: string;
  answer: string | string[] | Record<string, string>;
  options?: string[];
  pairs?: Array<{ left: string; right: string }>;
  studyCardId: string;
  nextReviewDate: {
    seconds: number;
    nanoseconds: number;
  };
  interval: number;
}


// Create router definition
export const appRouter = t.router({
  study: t.router({
    // Existing procedures
    initializeCards: t.procedure
      .input(
        z.object({
          userId: z.string(),
          revisionId: z.string(),
          questions: z.array(questionSchema),
        })
      )
      .mutation(() => {
        return { success: true };
      }),

    getNextQuestions: t.procedure
      .input(
        z.object({
          userId: z.string(),
          revisionId: z.string(),
          limit: z.number().optional(),
        })
      )
      .query(() => {
        return [] as StudyCard[];
      }),

    // Add getRevisions procedure
    getRevisions: t.procedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .query(() => {
        return [] as Array<z.infer<typeof revisionSchema>>;
      }),

    submitReview: t.procedure
      .input(
        z.object({
          cardId: z.string(),
          answer: z.any(), // or be more specific based on your needs
          responseTime: z.number(),
          difficulty: z.enum(["again", "hard", "good", "easy"]),
        })
      )
      .mutation(() => {
        return { success: true };
      }),
    submitBatchReviews: t.procedure
      .input(
        z.object({
          reviews: z.array(
            z.object({
              cardId: z.string(),
              answer: z.union([z.string(), z.boolean(), z.null()]),//z.any(),
              responseTime: z.number(),
              difficulty: z.enum(["again", "hard", "good", "easy"]),
              timestamp: z.date(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),
});

// Export types
export type AppRouter = typeof appRouter;
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;