// src/utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../types/router";
import { auth } from "@/firebase/firebaseConfig";

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // browser should use relative url
    return "";
  }
  // SSR should use vercel url
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // dev SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 5000}`;
};

export const trpc = createTRPCReact<AppRouter>();

export async function getFirebaseToken() {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting Firebase token:", error);
    return null;
  }
}

export const trpcClient = () => {
  return {
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        async headers() {
          const token = await getFirebaseToken();
          return {
            Authorization: token ? `Bearer ${token}` : "",
          };
        },
      }),
    ],
  };
};

// Export type helpers
export type { RouterInput, RouterOutput } from "../types/router";
