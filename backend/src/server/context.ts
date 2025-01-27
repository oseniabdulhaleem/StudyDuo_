// src/server/context.ts
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { AuthRequest } from "../middleware/auth";

export function createContext({ req, res }: CreateExpressContextOptions) {
  const authReq = req as AuthRequest;
  return {
    req: authReq,
    res,
  };
}

export type Context = ReturnType<typeof createContext>;
