"use client";

/**
 * Client-side providers tree.
 * Kept in its own file so the root layout (Server Component) stays clean.
 *
 * QueryClient configuration:
 *   staleTime 60s — prevents waterfalls of refetches on tab focus during
 *   normal journaling sessions (entries rarely change externally).
 *   retry 1 — one retry on network blips; don't hammer a cold DB.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "rgba(35,14,3,.96)",
              border: "1px solid rgba(255,160,60,.15)",
              color: "rgba(255,200,140,.9)",
              fontFamily: "'Lora', serif",
              fontSize: "13px",
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
