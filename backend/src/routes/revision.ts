// // src/routes/revision.ts
// import { Router } from "express";
// import { bucket } from "../services/storage.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { db } from "../services/firebase-admin.js";
// import { config } from "../config/index.js";
// import { VertexAI } from "@google-cloud/vertexai";
// import { StudyService } from "../services/study-service.js";
// import { auth } from "../middleware/auth";

// const router = Router();

// const vertexAI = new VertexAI({
//   project: "stackup-gemini",
//   location: "us-central1",
// });

// interface MulterFile {
//   fieldname: string;
//   originalname: string;
//   encoding: string;
//   mimetype: string;
//   buffer: Buffer;
//   size: number;
// }

// router.post("/", async (req: any, res) => {
//   try {
//     const { title, notes, questionTypes } = req.body;
//     const files = req.files;
//     console.log("db", db);
//     console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
//     console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
//     console.log("Private Key exists:", !!process.env.FIREBASE_PRIVATE_KEY);

//     const userId = req.user.uid;

//     const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
//     const revisionId = `rev_${sanitizedTitle}_${Date.now()}`;
//     const basePath = `study_app/${userId}/${revisionId}`;

//     const uploadPromises = files.map(async (file: any) => {
//       const blob = bucket.file(`${basePath}/${file.originalname}`);

//       await blob.save(file.buffer, {
//         metadata: {
//           contentType: file.mimetype,
//         },
//       });

//       const [signedUrl] = await blob.getSignedUrl({
//         action: "read",
//         expires: Date.now() + 24 * 60 * 60 * 1000,
//       });

//       return {
//         path: blob.name,
//         name: file.originalname,
//         url: signedUrl,
//       };
//     });

//     const fileDetails = await Promise.all(uploadPromises);

//     const revisionRef = db.collection("revisions").doc(revisionId);
//     await revisionRef.set({
//       userId,
//       title,
//       notes,
//       questionTypes,
//       files: fileDetails,
//       status: "processing",
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     });

//     generateQuestions(revisionRef, notes, fileDetails, questionTypes).catch(
//       console.error
//     );

//     res.json({
//       success: true,
//       revisionId,
//       files: fileDetails,
//     });
//   } catch (error) {
//     console.error("Revision creation failed:", error);
//     res.status(500).json({ error: "Failed to create revision" });
//   }
// });

// async function generateQuestions(
//   revisionRef: FirebaseFirestore.DocumentReference,
//   notes: string,
//   files: any[],
//   questionTypes: string | string[]
// ) {
//   try {
//     const model = vertexAI.getGenerativeModel({
//       model: "gemini-1.5-pro",
//     });

//     const parts = [];

//     if (notes) {
//       parts.push({
//         text: `Study Notes: ${notes}\n`,
//       });
//     }

//     for (const file of files) {
//       const gcsUri = file.path.startsWith("gs://")
//         ? file.path
//         : `gs://${bucket.name}/${file.path}`;

//       parts.push({
//         fileData: {
//           fileUri: gcsUri,
//           mimeType: getMimeType(file.name),
//         },
//       });
//     }
//     console.log("questionTypes", questionTypes);

//     // Parse questionTypes if it's a string
//     const parsedQuestionTypes =
//       typeof questionTypes === "string"
//         ? JSON.parse(questionTypes)
//         : questionTypes;

//     const questionTypeInstructions = `Generate a JSON array of questions based on the provided content for the following question types: ${parsedQuestionTypes.join(
//       ", "
//     )}. 
    
//     Format the questions as follows:

//     For Multiple Choice:
//     {
//       "question": "...",
//       "options": ["option1", "option2", "option3", "option4"],
//       "answer": "correct_option",
//       "type": "multiple-choice"
//     }

//     For Fill in the Blank/Cloze:
//     {
//       "question": "Complete the following: _____ is ...",
//       "answer": "correct_word_or_phrase",
//       "type": "cloze"
//     }

//     For True/False:
//     {
//       "question": "Question/Statement.... ?",
//       "answer": true/false,
//       "type": "true-false"
//     }

//     For Matching:
//     {
//       "question": "Match the following items",
//       "pairs": [
//         {"left": "item1", "right": "matching1"},
//         {"left": "item2", "right": "matching2"},
//         {"left": "item3", "right": "matching3"}
//       ],
//       "type": "matching"
//     }

//     Requirements:
//     1. Generate at least 3 questions for each selected question type
//     2. Ensure questions are directly related to the provided content
//     3. Vary the difficulty level of questions
//     4. For multiple choice questions, provide 4 plausible options
//     5. For matching questions, provide at least 3 pairs to match
//     6. Questions should test understanding, not just memorization
    
//     Provide ONLY the raw JSON array containing all questions, without any markdown formatting or code block markers.`;

//     parts.push({
//       text: questionTypeInstructions,
//     });

//     const request = {
//       contents: [
//         {
//           role: "user",
//           parts: parts,
//         },
//       ],
//     };

//     const result = await model.generateContent(request);
//     const response = result.response;

//     const responseText = response.candidates[0].content.parts[0].text;

//     const cleanedJson = responseText
//       .replace(/^```(json)?/m, "")
//       .replace(/```$/m, "")
//       .trim();

//     const questions = JSON.parse(cleanedJson);

//     await revisionRef.update({
//       questions,
//       status: "completed",
//       updatedAt: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Question generation failed:", error);
//     await revisionRef.update({
//       status: "failed",
//       error:
//         error instanceof Error ? error.message : "Failed to generate questions",
//       updatedAt: new Date().toISOString(),
//     });
//   }
// }

// function getMimeType(filename: string): string {
//   const extension = filename.split(".").pop()?.toLowerCase();
//   const mimeTypes: Record<string, string> = {
//     pdf: "application/pdf",
//     txt: "text/plain",
//     doc: "application/msword",
//     docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     jpg: "image/jpeg",
//     jpeg: "image/jpeg",
//     png: "image/png",
//   };
//   return mimeTypes[extension || ""] || "application/octet-stream";
// }

// const studyService = new StudyService();

// router.post("/initialize", auth, async (req, res) => {
//   try {
//     const { revisionId, questions } = req.body;
//     await studyService.initializeCards(req.user.uid, revisionId, questions);
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to initialize cards" });
//   }
// });

// router.post("/:cardId/review", auth, async (req, res) => {
//   try {
//     const { cardId } = req.params;
//     const { answer, responseTime } = req.body;

//     const result = await studyService.submitReview(
//       cardId,
//       req.user.uid,
//       answer,
//       responseTime
//     );

//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to submit review" });
//   }
// });

// export default router;



// src/routes/revision.ts
import { Router, Response } from "express";
import { bucket } from "../services/storage.js";
import { VertexAI } from "@google-cloud/vertexai";
import { db } from "../services/firebase-admin.js";
import { StudyService } from "../services/study-service.js";
import { authMiddleware as auth } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { checkAndDeductCredits } from "./credit";

const router = Router();
const studyService = new StudyService();

const vertexAI = new VertexAI({
  project: "stackup-gemini",
  location: "us-central1",
});

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

router.post("/", auth, async (req: any, res: Response) => {
  try {
    const { title, notes, questionTypes } = req.body;
    const files = req.files;

    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const revisionId = `rev_${sanitizedTitle}_${Date.now()}`;
    const basePath = `study_app/${userId}/${revisionId}`;

    const uploadPromises = files.map(async (file: any) => {
      const blob = bucket.file(`${basePath}/${file.originalname}`);

      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });

      return {
        path: blob.name,
        name: file.originalname,
        url: signedUrl,
      };
    });

    // Check credits before proceeding
    await checkAndDeductCredits(userId);

    const fileDetails = await Promise.all(uploadPromises);

    const revisionRef = db.collection("revisions").doc(revisionId);
    await revisionRef.set({
      userId,
      title,
      notes,
      questionTypes,
      files: fileDetails,
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    generateQuestions(revisionRef, notes, fileDetails, questionTypes).catch(
      console.error
    );

    res.json({
      success: true,
      revisionId,
      files: fileDetails,
    });
  } catch (error) {
    console.error("Revision creation failed:", error);
    res.status(500).json({ error: "Failed to create revision" });
  }
});

async function generateQuestions(
  revisionRef: FirebaseFirestore.DocumentReference,
  notes: string,
  files: any[],
  questionTypes: string | string[]
) {
  try {
    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    const parts = [];

    if (notes) {
      parts.push({
        text: `Study Notes: ${notes}\n`,
      });
    }

    for (const file of files) {
      const gcsUri = file.path.startsWith("gs://")
        ? file.path
        : `gs://${bucket.name}/${file.path}`;

      parts.push({
        fileData: {
          fileUri: gcsUri,
          mimeType: getMimeType(file.name),
        },
      });
    }

    const parsedQuestionTypes = typeof questionTypes === "string" 
      ? JSON.parse(questionTypes) 
      : questionTypes;

    const questionTypeInstructions = `Generate a JSON array of questions based on the provided content for the following question types: ${parsedQuestionTypes.join(", ")}. 
    
    Format the questions as follows:

    For Multiple Choice:
    {
      "question": "...",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct_option",
      "type": "multiple-choice"
    }

    For Fill in the Blank/Cloze:
    {
      "question": "Complete the following: _____ is ...",
      "answer": "correct_word_or_phrase",
      "type": "cloze"
    }

    For True/False:
    {
      "question": "Question/Statement.... ?",
      "answer": true/false,
      "type": "true-false"
    }

    For Matching:
    {
      "question": "Match the following items",
      "pairs": [
        {"left": "item1", "right": "matching1"},
        {"left": "item2", "right": "matching2"},
        {"left": "item3", "right": "matching3"}
      ],
      "type": "matching"
    }

    Requirements:
    1. Generate at least 3 questions for each selected question type
    2. Ensure questions are directly related to the provided content
    3. Vary the difficulty level of questions
    4. For multiple choice questions, provide 4 plausible options
    5. For matching questions, provide at least 3 pairs to match
    6. Questions should test understanding, not just memorization
    
    Provide ONLY the raw JSON array containing all questions, without any markdown formatting or code block markers.`;

    parts.push({
      text: questionTypeInstructions,
    });

    const request = {
      contents: [{ role: "user", parts: parts }],
    };

    const result = await model.generateContent(request);
    const responseText = result.response.candidates[0].content.parts[0].text;
    const cleanedJson = responseText.replace(/^```(json)?/m, "").replace(/```$/m, "").trim();
    const questions = JSON.parse(cleanedJson);

    const questionsWithIds = questions.map((q: any, index: number) => ({
      ...q,
      id: `q_${revisionRef.id}_${index + 1}`,
    }));

    await revisionRef.update({
      questions: questionsWithIds,
      status: "completed",
      updatedAt: new Date().toISOString(),
    });

    const revisionDoc = await revisionRef.get();
    const userId = revisionDoc.data()?.userId;
    if (userId) {
      await studyService.initializeCards(userId, revisionRef.id, questionsWithIds);
    }

  } catch (error) {
    console.error("Question generation failed:", error);
    await revisionRef.update({
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to generate questions",
      updatedAt: new Date().toISOString(),
    });
  }
}

function getMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return mimeTypes[extension || ""] || "application/octet-stream";
}

router.get("/:revisionId/cards", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { revisionId } = req.params;
    const { limit = "2" } = req.query;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const revisionDoc = await db.collection("revisions").doc(revisionId).get();
    if (!revisionDoc.exists || revisionDoc.data()?.userId !== userId) {
      res.status(404).json({ error: "Revision not found" });
      return;
    }

    const now = new Date();
    
    const cardsSnapshot = await db.collection("studyCards")
      .where("userId", "==", userId)
      .where("revisionId", "==", revisionId)
      .where("nextReviewDate", "<=", now)
      .orderBy("nextReviewDate", "asc")
      .limit(parseInt(limit as string))
      .get();

    const cards = await Promise.all(
      cardsSnapshot.docs.map(async (doc) => {
        const cardData = doc.data();
        const question = revisionDoc.data()?.questions.find(
          (q: any) => q.id === cardData.questionId
        );

        return {
          ...question,
          studyCardId: doc.id,
          nextReviewDate: cardData.nextReviewDate,
          interval: cardData.interval,
        };
      })
    );

    res.json({
      cards,
      hasMore: !cardsSnapshot.empty,
      totalCards: revisionDoc.data()?.questions?.length || 0,
    });

  } catch (error) {
    console.error("Failed to fetch cards:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

router.post("/:cardId/review", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { cardId } = req.params;
    const { answer, responseTime } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await studyService.submitReview(cardId, userId, answer, responseTime);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;