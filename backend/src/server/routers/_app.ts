// src/server/routers/_app.ts
import { router } from "../trpc";
import { studyRouter } from "./study";

export const appRouter = router({
  study: studyRouter,
});

export type AppRouter = typeof appRouter;
