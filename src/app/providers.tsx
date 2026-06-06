"use client";

/**
 * @file providers.tsx
 * @route N/A — mounted once from root `layout.tsx`, wraps every page.
 *
 * **SSR vs client:** This is the app's primary Client Component boundary. Server
 * Components (pages, layouts) render on the server; this file bundles everything
 * that needs browser APIs or React context: NextAuth session, TanStack Query cache,
 * offline sync, and global toasts.
 *
 * **Why `useState` for QueryClient:** Creates one stable client per mount so
 * query cache survives re-renders without resetting between navigations.
 */
/**
 * Client-side providers tree.
 * OfflineSyncProvider drains IndexedDB queue on `online` and exposes pendingCount globally.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useState } from "react";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";

export function Providers({ children }: { children: React.ReactNode }) {
  // Lazy-init QueryClient once per browser session (avoids sharing cache across SSR requests)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineSyncProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
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
        </OfflineSyncProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
