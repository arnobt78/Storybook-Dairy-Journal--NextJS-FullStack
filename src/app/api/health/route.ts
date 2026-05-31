import { NextResponse } from "next/server";

/**
 * Lightweight JSON health probe for the profile menu “API Status” link.
 * Safe to call unauthenticated; returns 200 when the App Router responds.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "storybook-journal",
    timestamp: new Date().toISOString(),
  });
}
