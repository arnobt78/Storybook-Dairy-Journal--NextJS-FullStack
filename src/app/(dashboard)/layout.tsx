import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardCommandProvider } from "@/components/layout/DashboardCommandProvider";
import { OAuthReturnSync } from "@/components/auth/OAuthReturnSync";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Session must be read on every request — no static cache of authenticated shell
export const dynamic = "force-dynamic";

/** Authenticated app shell — noindex to limit bot crawl on private journal UI */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * @file (dashboard)/layout.tsx
 * @route Route group `(dashboard)` — guards `/dashboard` and `/journal/*` behind auth.
 *
 * **SSR vs client:** Async Server Component. Calls `auth()` server-side; unauthenticated
 * users never reach child pages (redirect before render). Nav + OAuth cache sync are client islands.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // Gate: no session → send to login (runs on server, no flash of protected UI)
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="dashboard-scroll">
      {/* After Google OAuth return, invalidate journal queries so shelf is fresh */}
      <OAuthReturnSync />
      <DashboardNav user={session.user} />
      <DashboardCommandProvider>
        <main>{children}</main>
      </DashboardCommandProvider>
    </div>
  );
}
