"use client";

/**
 * DashboardNav — top bar for authenticated pages.
 *
 * Features:
 *  • Brand mark uses `public/dairy-1.svg` (vector, crisp at any DPR).
 *  • Profile uses a Radix-based shadcn dropdown (`modal={false}`) so the menu opens in
 *    a portal without scroll-lock or width reflow — avoids navbar “jump” / layout shift.
 *  • Profile menu rows pair Lucide glyphs (`Activity`, `FileText`, `LogOut`) with labels
 *    for quick visual scanning next to API shortcuts and sign-out.
 *  • Book-close animation overlay on sign-out: faux leather cover before redirect.
 *  • Sign-out calls `queryClient.clear()` so TanStack Query drops all cached server state
 *    immediately (no full reload). After mutations elsewhere, call
 *    `queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() })` so UI
 *    refetches without navigation — see `src/lib/query-keys.ts`.
 *
 * ── WALKTHROUGH ──
 *  OFFLINE — `{pendingCount} offline` badge from `OfflineSyncContext`; counts IndexedDB queue.
 *  SafeImage — avatar tries Google URL first; `fallbackSrc` Robohash on error (see safe-image.tsx).
 *  3D book — sign-out overlay plays faux leather cover slam before NextAuth redirect.
 */
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { Activity, FileText, LogOut } from "lucide-react";
import { RippleButton } from "@/components/ui/ripple-button";

import { AUTH_STATE_KEY, OAUTH_PENDING_KEY } from "@/constants/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SafeImage } from "@/components/ui/safe-image";
import { appToast } from "@/lib/app-toast";
import { useOfflineSync } from "@/context/OfflineSyncContext";

interface DashboardNavProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

/** Robohash generates a unique robot image from any string (email used here). */
function robohashUrl(seed: string) {
  return `https://robohash.org/${encodeURIComponent(seed)}?set=set1&size=80x80`;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const queryClient = useQueryClient();
  const { pendingCount } = useOfflineSync();
  const [signingOut, setSigningOut] = useState(false);
  const [closing, setClosing] = useState(false);
  const avatarSeed = user.email ?? user.name ?? "guest";
  const displayEmail = user.email ?? "—";
  const displayName = user.name ?? user.email ?? "Reader";

  /**
   * Sign-out flow:
   *  1. Show book-close overlay (leather cover slams shut, 750ms animation).
   *  2. Clear TanStack Query cache during the animation (`clear()` removes all queries at once).
   *  3. Call signOut — NextAuth clears cookies and redirects to `callbackUrl`.
   */
  const handleSignOut = async () => {
    if (signingOut) return;
    appToast.auth.goodbye(displayName);
    setSigningOut(true);
    setClosing(true);

    /* Clear cache while the animation plays */
    queryClient.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STATE_KEY);
      localStorage.removeItem(OAUTH_PENDING_KEY);
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 750));
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* ── Book-close logout overlay ── */}
      {signingOut && (
        <div
          className={`book-close-overlay${closing ? "" : ""}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "radial-gradient(ellipse at 50% 30%, #2e160a 0%, #1a0c05 55%, #0e0603 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Faux leather cover slamming shut */}
          <div
            className="book-close-cover"
            style={{
              width: "220px",
              height: "310px",
              background:
                "linear-gradient(155deg,#5d2e0c 0%,#8b4513 25%,#70380f 55%,#3d1a06 100%)",
              borderRadius: "3px 12px 12px 3px",
              boxShadow:
                "-8px 0 24px rgba(0,0,0,.55), 10px 12px 50px rgba(0,0,0,.75)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "22px",
                background:
                  "linear-gradient(90deg,#1e0c03 0%,#4a2008 40%,#6b3410 60%,#4a2008 100%)",
              }}
            />
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontStyle: "italic",
                fontSize: "22px",
                color: "rgba(255,205,130,.75)",
                paddingLeft: "18px",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              StoryBook
            </div>
          </div>
          <div
            style={{
              fontFamily: "'IM Fell English',serif",
              fontStyle: "italic",
              fontSize: "14px",
              color: "rgba(255,180,90,.45)",
            }}
          >
            Closing your journal…
          </div>
        </div>
      )}

      {/* ── Nav bar ── */}
      <nav
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "transparent",
          // borderBottom: "1px solid rgba(255,160,60,.07)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo: static SVG from /public for zero layout shift (fixed width/height). */}
        <Link
          href="/dashboard"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Image
            src="/dairy-1.svg"
            alt=""
            width={24}
            height={24}
            unoptimized
            className="shrink-0 object-contain"
            style={{ width: 24, height: 24, display: "block" }}
            priority
          />
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontStyle: "italic",
              fontSize: "18px",
              color: "rgba(255,205,130,.88)",
            }}
          >
            StoryBook
          </span>
        </Link>

        {/* Profile: dropdown trigger keeps fixed footprint; menu content is portaled. */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* ── OFFLINE: pending sync queue count from IndexedDB ── */}
          {pendingCount > 0 && (
            <span
              title={`${pendingCount} change${pendingCount === 1 ? "" : "s"} waiting to sync`}
              style={{
                fontFamily: "'IM Fell English',serif",
                fontSize: "10px",
                letterSpacing: "1px",
                color: "rgba(255,185,100,.65)",
                background: "rgba(160,85,30,.22)",
                border: "1px solid rgba(160,85,30,.28)",
                padding: "3px 9px",
                borderRadius: "12px",
              }}
            >
              {pendingCount} offline
            </span>
          )}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <RippleButton
                type="button"
                aria-label="Open account menu"
                disabled={signingOut}
                className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[rgb(137,68,19,.88)] bg-transparent p-0.5 outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[rgba(255,205,130,0.45)] disabled:cursor-default disabled:opacity-40"
                style={{ width: 40, height: 40 }}
              >
                {/* ── SafeImage fallback: Google avatar → Robohash on load error ── */}
                <SafeImage
                  key={user.image ?? avatarSeed}
                  src={user.image ?? robohashUrl(avatarSeed)}
                  fallbackSrc={user.image ? robohashUrl(avatarSeed) : undefined}
                  alt={user.name ?? "User avatar"}
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  className="rounded-full object-cover"
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </RippleButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-[15rem]"
            >
              {/* Read-only header: email first, then display name (separate line). */}
              <div className="px-3 pt-2 font-lora text-sm font-medium text-[rgba(255,205,130,0.88)]">
                {displayName}
              </div>
              <div className="px-3 pb-2  font-lora text-xs leading-snug text-paper-light/55">
                {displayEmail}
              </div>

              <DropdownMenuSeparator />

              {/* API links open in a new tab so the dashboard shell stays mounted. */}
              <DropdownMenuItem asChild>
                <Link
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="flex cursor-pointer items-center gap-2 font-lora"
                >
                  <Activity
                    className="size-4 shrink-0 text-[rgba(255,205,130,0.72)]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  API Status
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/api/books"
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="flex cursor-pointer items-center gap-2 font-lora"
                >
                  <FileText
                    className="size-4 shrink-0 text-[rgba(255,205,130,0.72)]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  API Document
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2 font-lora text-[rgba(255,200,140,0.92)] focus:bg-white/10"
                disabled={signingOut}
                onSelect={() => {
                  void handleSignOut();
                }}
              >
                <LogOut
                  className="size-4 shrink-0 text-[rgba(255,205,130,0.72)]"
                  strokeWidth={2}
                  aria-hidden
                />
                {signingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
