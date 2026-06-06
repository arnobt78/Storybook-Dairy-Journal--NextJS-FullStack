"use client";

/** Dashboard shell — command palette + realtime SSE bridge. */
import { CommandPalette, useCommandPalette } from "@/components/journal/CommandPalette";
import { JournalRealtimeBridge } from "@/components/layout/JournalRealtimeBridge";

export function DashboardCommandProvider({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      {children}
      <JournalRealtimeBridge />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
