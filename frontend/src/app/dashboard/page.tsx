// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuestions } from "@/store/useQuestions";
import { useStore } from "@/store/useStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { trpc } from "@/utils/trpc";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // const setQuestions = useQuestions((state) => state.setQuestions);

  // // Fetch revisions for the current user
  // const query = trpc.study.getRevisions.useQuery(
  //   { userId: user?.uid || "" },
  //   {
  //     enabled: Boolean(user?.uid),
  //   } as any // temporary type assertion while debugging
  // );

  // const { data: revisions, isLoading: revisionsLoading } = query;

  // // Load questions for each revision
  // useEffect(() => {
  //   if (revisions) {
  //     revisions.forEach(async (revision) => {
  //       const result = trpc.study.getNextQuestions.useQuery({
  //         userId: user?.uid || "",
  //         revisionId: revision.id,
  //       });
  //       if (result.data) {
  //         setQuestions(revision.id, result.data);
  //       }
  //     });
  //   }
  // }, [revisions]);

  // Get revisions from store
  const { revisions, getQuestions, setQuestions, isLoading, setRevisions } =
    useStore();
  
    
  const utils = trpc.useUtils();

  // Fetch data if store is empty
  const { data: fetchedRevisions } = trpc.study.getRevisions.useQuery(
    { userId: user?.uid || "" },
    {
      enabled: Boolean(user?.uid) && revisions.length === 0,
    }
  );

  // Update store with fetched data
  useEffect(() => {
    if (fetchedRevisions && revisions.length === 0) {
      setRevisions(fetchedRevisions);

      // Fetch questions for each revision
      fetchedRevisions.forEach(async (revision) => {
        const questions = await utils.client.study.getNextQuestions.query({
          userId: user?.uid || "",
          revisionId: revision.id,
        });
        setQuestions(revision.id, questions);
      });
    }
  }, [fetchedRevisions]);

  // Show loading state
  // loading || revisionLoading
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Your Revisions</h2>
        <Button asChild>
          <Link href="/dashboard/new-revision">
            <Plus className="mr-2 h-4 w-4" /> Create New Revision
          </Link>
        </Button>
      </div>

      {!revisions || revisions.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No revisions yet</h3>
          <p className="text-gray-500 mt-2">
            Create your first revision to get started
          </p>
        </div>
      ) : (
        /* Grid of revision cards */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {revisions.map((revision) => (
            <Card key={revision.id}>
              <CardHeader>
                <CardTitle>{revision.title}</CardTitle>
                <CardDescription>
                  Created on {new Date(revision.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{revision.questions.length} Questions</p>
                {revision.status === "processing" ? (
                  <Button disabled variant="outline" className="w-full">
                    <div className="animate-pulse">Processing...</div>
                  </Button>
                ) : (
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/dashboard/study/${revision.id}`}>
                      Start Revision
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
