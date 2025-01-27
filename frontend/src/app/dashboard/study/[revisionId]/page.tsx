// src/app/dashboard/study/[revisionId]/page.tsx
"use client";

import { use, useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { MultipleChoiceQuestion } from "@/components/questions/MultipleChoiceQuestion";
import { FillInBlankQuestion } from "@/components/questions/FillInBlankQuestion";
import { TrueFalseQuestion } from "@/components/questions/TrueFalseQuestion";
import { MatchingQuestion } from "@/components/questions/MatchingQuestion";
import type { StudyCard } from "@/types/router";
import { useQuestions } from "@/store/useQuestions";
import { Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";

interface ReviewAnswer {
  cardId: string;
  answer: any;
  responseTime: number;
  difficulty: "again" | "hard" | "good" | "easy";
  timestamp: string; // Store as ISO string in state
}

export default function StudyPage({
  params,
}: {
  params: Promise<{ revisionId: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [showAnswer, setShowAnswer] = useState(false);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string | boolean | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const startTime = useRef(Date.now());
  const { getQuestions, revisions, isLoading } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store review answers locally
  const [pendingReviews, setPendingReviews] = useState<ReviewAnswer[]>([]);

  // const { questions, isLoading } = useQuestions((state) => ({
  //   questions: state.getQuestions(resolvedParams.revisionId),
  //   isLoading: state.isLoading,
  // }));

  // Get questions for this revision
  const questions = getQuestions(resolvedParams.revisionId);
  const revision = revisions.find((r) => r.id === resolvedParams.revisionId);

  const submitReview = trpc.study.submitReview.useMutation({
    onSuccess: () => {
      if (questions && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowAnswer(false);
        setUserAnswer(null);
        startTime.current = Date.now();
        toast({
          title: "Review submitted",
          description: "Moving to next question",
        });
      } else {
        toast({
          title: "Study session complete!",
          description: "No more cards to review",
        });
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Error submitting review",
        description: error.message,
      });
    },
  });

  const submitBatchReviews = trpc.study.submitBatchReviews.useMutation({
    onMutate: (variables) => {
      // Log what we're sending to help debug
      console.log("Submitting reviews:", variables);
    },
    onSuccess: () => {
      toast({
        title: "Reviews submitted",
        description: "Your progress has been saved",
      });
    },
    onError: (error: any) => {
      console.error("Review submission error:", error);
      toast({
        title: "Error saving reviews",
        description: error.message,
      });
    },
  });

  const currentQuestion = questions?.[currentQuestionIndex];

  const handleAnswer = (answer: string | boolean) => {
    setUserAnswer(answer);
    setShowAnswer(true);
    setResponseTime(Date.now() - startTime.current);
  };

  const handleReviewSubmit = async (
    difficulty: "again" | "hard" | "good" | "easy"
  ) => {
    if (!currentQuestion?.studyCardId) return;

    setIsSubmitting(true);

    try {
      const newReview: ReviewAnswer = {
        cardId: currentQuestion.studyCardId,
        answer: userAnswer,
        responseTime,
        difficulty,
        timestamp: new Date().toISOString(),
      };

      const updatedReviews = [...pendingReviews, newReview];

      // Check if we have a full batch (5 reviews)
      if (updatedReviews.length >= 5) {
        const reviewsForSubmission = updatedReviews.map((review) => ({
          ...review,
          timestamp: new Date(review.timestamp),
        }));

        await submitBatchReviews.mutateAsync({
          reviews: reviewsForSubmission,
        });

        setPendingReviews([]); // Clear after successful submission

        toast({
          title: "Reviews Submitted",
          description: "Batch of reviews saved successfully",
        });
      } else {
        setPendingReviews(updatedReviews);
      }

      // Check if this is the last question
      if (currentQuestionIndex === questions.length - 1) {
        // If there are any remaining reviews, submit them
        if (updatedReviews.length > 0 && updatedReviews.length < 5) {
          const remainingReviews = updatedReviews.map((review) => ({
            ...review,
            timestamp: new Date(review.timestamp),
          }));

          await submitBatchReviews.mutateAsync({
            reviews: remainingReviews,
          });
        }

        toast({
          title: "Session Complete",
          description: "All reviews submitted successfully",
        });
        router.push("/dashboard");
      } else {
        // Move to next question
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowAnswer(false);
        setUserAnswer(null);
        startTime.current = Date.now();
      }
    } catch (error) {
      console.error("Failed to submit reviews:", error);
      toast({
        title: "Error",
        description: "Failed to save review",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (pendingReviews.length > 0) {
      try {
        // Convert ISO strings to Date objects before submitting
        const reviewsForSubmission = pendingReviews.map((review) => ({
          ...review,
          timestamp: new Date(review.timestamp),
        }));

        await submitBatchReviews.mutateAsync({
          reviews: reviewsForSubmission,
        });
      } catch (error) {
        console.error("Failed to end session:", error);
        toast({
          title: "Error",
          description: "Failed to save reviews",
        });
        return;
      }
    }
    router.push("/dashboard");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  // No questions available
  if (!questions?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-xl font-semibold">No cards to review!</h2>
        <p className="text-muted-foreground">
          Check back later for more reviews.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Study Session</CardTitle>
          <CardDescription>
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderQuestion(
            currentQuestion,
            handleAnswer,
            showAnswer,
            userAnswer
          )}

          {!showAnswer && currentQuestion.type !== "fill-in-blank" && (
            <Button
              className="w-full"
              onClick={() => setShowAnswer(true)}
              disabled={submitReview.isPending}
            >
              Show Answer
            </Button>
          )}

          {showAnswer && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-5">
                {[
                  {
                    label: "Again",
                    time: "1m",
                    type: "again",
                    class: "bg-red-50 hover:bg-red-100",
                  },
                  {
                    label: "Hard",
                    time: "6m",
                    type: "hard",
                    class: "bg-orange-50 hover:bg-orange-100",
                  },
                  {
                    label: "Good",
                    time: "10m",
                    type: "good",
                    class: "bg-green-50 hover:bg-green-100",
                  },
                  {
                    label: "Easy",
                    time: "4d",
                    type: "easy",
                    class: "bg-blue-50 hover:bg-blue-100",
                  },
                ].map((option) => (
                  <Button
                    key={option.type}
                    variant="outline"
                    className={`flex flex-col items-center ${option.class} py-6`}
                    onClick={() => handleReviewSubmit(option.type as any)}
                    // disabled={submitReview.isPending}
                    disabled={isSubmitting || submitBatchReviews.isPending}
                  >
                    {option.label}
                    <span className="text-xs">{option.time}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-500">
            <span>
              Questions remaining: {questions.length - currentQuestionIndex - 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndSession}
              // disabled={submitBatchReviews.isPending}
              disabled={isSubmitting || submitBatchReviews.isPending}
            >
              {submitBatchReviews.isPending ? "Saving..." : "End Session"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to render questions
function renderQuestion(
  question: StudyCard,
  onAnswer: (answer: string | boolean) => void,
  showAnswer: boolean,
  userAnswer: string | boolean | null
) {
  switch (question.type) {
    case "multiple-choice":
      return (
        <MultipleChoiceQuestion
          question={question.question}
          options={question.options || []}
          onAnswer={onAnswer}
          showAnswer={showAnswer}
          userAnswer={userAnswer as string}
          correctAnswer={question.answer as string}
        />
      );

    case "fill-in-blank":
      return (
        <FillInBlankQuestion
          question={question.question}
          onAnswer={onAnswer}
          showAnswer={showAnswer}
          userAnswer={userAnswer as string}
          correctAnswer={question.answer as string}
        />
      );

    case "true-false":
      return (
        <TrueFalseQuestion
          question={question.question}
          onAnswer={onAnswer}
          showAnswer={showAnswer}
          userAnswer={userAnswer as boolean}
          correctAnswer={question.answer as unknown as boolean}
        />
      );

    case "matching":
      return (
        <MatchingQuestion
          question={question.question}
          pairs={question.pairs || []}
          onAnswer={onAnswer}
          showAnswer={showAnswer}
          userAnswer={userAnswer}
          correctAnswer={question.answer}
        />
      );

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-medium">{question.question}</p>
        </div>
      );
  }
}
