// routes/credits.ts
import { Router, Response } from "express";
import { db } from "../services/firebase-admin";
import { authMiddleware as auth, AuthRequest } from "../middleware/auth";
import { FieldValue } from "firebase-admin/firestore";

const router = Router();

async function ensureUserDocument(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    // Create new user document with initial credits
    await userRef.set(
      {
        credits: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    ); // merge: true to avoid overwriting existing data
  }
  return userRef;
}

router.post(
  "/process",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log("in the process-buy");
      const { txHash } = req.body;
      const userId = req.user?.uid;
      console.log("txhash userid", txHash, userId)
      

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const userRef = await ensureUserDocument(userId);

      const txDoc = await db.collection("transactions").doc(txHash).get();
      if (txDoc.exists) {
        res.status(400).json({ error: "Transaction already processed" });
        return;
      }

      // Create transaction record and update credits atomically
      const batch = db.batch();

      batch.set(db.collection("transactions").doc(txHash), {
        userId,
        amount: 100,
        timestamp: new Date(),
        type: "purchase",
      });

      batch.update(userRef, {
        credits: FieldValue.increment(100),
        updatedAt: new Date(),
      });

      await batch.commit();

      res.json({ success: true });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process credits" });
      return;
    }
  }
);

export async function checkAndDeductCredits(
  userId: string,
  amount: number = 10
) {
  const userRef = await ensureUserDocument(userId);
  const userData = await userRef.get();
  const credits = userData.data()?.credits || 0;

  if (credits < amount) {
    throw new Error("Insufficient credits");
  }

  await userRef.update({
    credits: FieldValue.increment(-amount),
  });
}
// Add to routes/credits.ts
router.get("/balance", auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRef = await ensureUserDocument(userId);
    const userData = await userRef.get();
    const credits = userData.data()?.credits || 0;

    res.json({
      credits,
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch credit balance" });
  }
});

export default router;
