"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useStore } from "@/store/useStore";
import { trpc } from "@/utils/trpc";
import { useToast } from "@/components/ui/toast";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(
    "Checking for user..."
  );
  const router = useRouter();
  const { toast } = useToast();

  const { setQuestions, setRevisions } = useStore();
  const utils = trpc.useUtils();

  const loadingMessages = [
    "Checking for user...",
    "Signing in...",
    "Checking for questions...",
    "Processing...",
    "Done!",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      let messageIndex = 0;
      interval = setInterval(() => {
        if (messageIndex < loadingMessages.length) {
          setLoadingMessage(loadingMessages[messageIndex]);
          messageIndex++;
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user ID available");

      toast({
        title: "Success",
        description: "Login successful",
      });

      const fetchDataInBackground = async () => {
        try {
          await utils.study.getRevisions.invalidate();
          const revisions = await utils.client.study.getRevisions.query({
            userId,
          });
          setRevisions(revisions);

          await Promise.all(
            revisions.map(async (revision) => {
              const questions = await utils.client.study.getNextQuestions.query(
                {
                  userId,
                  revisionId: revision.id,
                }
              );
              setQuestions(revision.id, questions);
            })
          );

          setLoadingMessage("Done!");

          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } catch (error) {
          console.error("Background data fetch failed:", error);
          toast({
            title: "Warning",
            description: "Some data is still loading...",
          });
        }
      };

      fetchDataInBackground();
    } catch (err: any) {
      setError(err.message);
      setLoadingMessage("");
      toast({
        title: "Error",
        description: err.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Login
        </h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="mt-2 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-2 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Loading message displayed above the button when loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-2 text-blue-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm font-medium animate-pulse">
                {loadingMessage}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-500">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-blue-500 hover:underline">
              Sign up
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;