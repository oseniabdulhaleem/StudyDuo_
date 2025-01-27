// // src/components/providers/trpc-provider.tsx
// "use client";

// import { useState } from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { trpc, trpcClient } from "@/utils/trpc";

// export function TRPCProvider({ children }: { children: React.ReactNode }) {
//   const [queryClient] = useState(() => new QueryClient());
//   const [client] = useState(() => trpc.createClient(trpcClient()));

//   return (
//     <trpc.Provider client={client} queryClient={queryClient}>
//       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//     </trpc.Provider>
//   );
// }

// src/components/providers/trpc-provider.tsx
"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { httpBatchLink } from "@trpc/client";
import { auth } from "@/firebase/firebaseConfig";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`,
          async headers() {
            const token = auth.currentUser
              ? await auth.currentUser.getIdToken()
              : "";
            return {
              Authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
