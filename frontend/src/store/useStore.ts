// // src/store/useStore.ts
// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import type { StudyCard } from "@/types/router";
// import { trpc } from "@/utils/trpc";
// import { useEffect } from "react";

// interface Revision {
//   id: string;
//   title: string;
//   createdAt: string;
//   questions: any[];
//   userId: string;
//   status: string;
//   notes?: string;
// }

// interface Store {
//   // Questions state
//   questions: { [revisionId: string]: StudyCard[] };
//   setQuestions: (revisionId: string, questions: StudyCard[]) => void;
//   getQuestions: (revisionId: string) => StudyCard[];

//   // Revisions state
//   revisions: Revision[];
//   setRevisions: (revisions: Revision[]) => void;

//   // Loading states
//   isLoading: boolean;
//   setLoading: (loading: boolean) => void;
// }

// export const useStore = create<Store>()(
//   persist(
//     (set, get) => ({
//       // Questions
//       questions: {},
//       setQuestions: (revisionId, questions) =>
//         set((state) => ({
//           questions: { ...state.questions, [revisionId]: questions },
//         })),
//       getQuestions: (revisionId) => get().questions[revisionId] || [],

//       // Revisions
//       revisions: [],
//       setRevisions: (revisions) => set({ revisions }),

//       // Loading state
//       isLoading: false,
//       setLoading: (loading) => set({ isLoading: loading }),
//     }),
//     {
//       name: "study-store",
//       partialize: (state) => ({
//         revisions: state.revisions,
//         questions: state.questions,
//       }),
//     }
//   )
// );

// // Export a hook for using trpc queries with the store
// export function useStoreWithQueries(userId: string | undefined) {
//   const { data: revisions, isLoading: revisionsLoading } =
//     trpc.study.getRevisions.useQuery(
//       { userId: userId || "" },
//       { enabled: Boolean(userId) }
//     );

//   const setQuestions = useStore((state) => state.setQuestions);
//   const setRevisions = useStore((state) => state.setRevisions);

//   useEffect(() => {
//     if (revisions) {
//       setRevisions(revisions);

//       // Load questions for each revision
//       revisions.forEach(async (revision) => {
//         const result = trpc.study.getNextQuestions.useQuery({
//           userId: userId || "",
//           revisionId: revision.id,
//         });
//         if (result.data) {
//           setQuestions(revision.id, result.data);
//         }
//       });
//     }
//   }, [revisions, userId]);

//   return { revisions, isLoading: revisionsLoading };
// }

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudyCard } from "@/types/router";
import { trpc } from "@/utils/trpc";
import { useEffect } from "react";

interface Revision {
  id: string;
  title: string;
  createdAt: string;
  questions: any[];
  userId: string;
  status: string;
  notes?: string;
}

interface Store {
  questions: { [revisionId: string]: StudyCard[] };
  setQuestions: (revisionId: string, questions: StudyCard[]) => void;
  getQuestions: (revisionId: string) => StudyCard[];
  revisions: Revision[];
  setRevisions: (revisions: Revision[]) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      questions: {},
      setQuestions: (revisionId, questions) =>
        set((state) => ({
          ...state,
          questions: {
            ...state.questions,
            [revisionId]: questions.map((q) => ({
              ...q,
              nextReviewDate: q.nextReviewDate
                ? {
                    seconds:
                      new Date(q.nextReviewDate.seconds * 1000).getTime() /
                      1000,
                    nanoseconds: q.nextReviewDate.nanoseconds,
                  }
                : q.nextReviewDate,
            })),
          },
        })),
      getQuestions: (revisionId) => get().questions[revisionId] || [],
      revisions: [],
      setRevisions: (revisions) => set((state) => ({ ...state, revisions })),
      isLoading: false,
      setLoading: (loading) =>
        set((state) => ({ ...state, isLoading: loading })),
    }),
    {
      name: "study-store",
      partialize: (state) => ({
        revisions: state.revisions,
        questions: state.questions,
      }),
    }
  )
);

export function useStoreWithQueries(userId: string | undefined) {
  const utils = trpc.useUtils();
  const setQuestions = useStore((state) => state.setQuestions);
  const setRevisions = useStore((state) => state.setRevisions);

  const { data: revisions, isLoading: revisionsLoading } =
    trpc.study.getRevisions.useQuery(
      { userId: userId || "" },
      { enabled: Boolean(userId) }
    );

  useEffect(() => {
    if (revisions) {
      setRevisions(revisions);

      const fetchQuestions = async () => {
        const questionsPromises = revisions.map((revision) =>
          utils.client.study.getNextQuestions.query({
            userId: userId || "",
            revisionId: revision.id,
          })
        );

        try {
          const allQuestions = await Promise.all(questionsPromises);
          revisions.forEach((revision, index) => {
            setQuestions(revision.id, allQuestions[index]);
          });
        } catch (error) {
          console.error("Failed to fetch questions:", error);
        }
      };

      fetchQuestions();
    }
  }, [revisions, userId, utils.client.study.getNextQuestions]);

  return { revisions, isLoading: revisionsLoading };
}
