// middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../services/firebase-admin.js";

export interface AuthRequest extends Request {
  user?: { uid: string; email?: string };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
