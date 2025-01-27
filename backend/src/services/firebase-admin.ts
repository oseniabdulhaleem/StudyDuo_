// src/services/firebase-admin.ts
import admin from "firebase-admin";



if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const auth = admin.auth();

export const db = admin.firestore();

// Helper functions for revision collection
// export const getRevisionById = async (revisionId: string) => {
//   const doc = await db.collection("revisions").doc(revisionId).get();
//   return doc.exists ? doc.data() : null;
// };

// export const getUserRevisions = async (userId: string) => {
//   const snapshot = await db
//     .collection("revisions")
//     .where("userId", "==", userId)
//     .orderBy("createdAt", "desc")
//     .get();

//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));
// };
