import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { BookSpread } from "@/components/journal/BookSpread";
import { parseTags } from "@/lib/utils";
import type { JournalBook, JournalEntry } from "@/types";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

/**
 * @file (dashboard)/journal/[bookId]/page.tsx
 * @route `/journal/[bookId]` — immersive page-flip editor for one book.
 *
 * **SSR vs client:** Server loads book + entries (ownership check via userId);
 * `BookSpread` (client) receives `initialBook` to hydrate TanStack Query cache.
 */
export const dynamic = "force-dynamic";

export default async function JournalPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Next.js 15+: dynamic segment params are async
  const { bookId } = await params;

  // findFirst + userId — 404 if book missing or belongs to another user
  const book = await prisma.journalBook.findFirst({
    where: { id: bookId, userId: session.user.id },
    include: {
      entries: {
        where: { isArchived: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!book) notFound();

  /** Hydrates TanStack Query in `BookSpread` so invalidations refetch the same shape as GET /api/books/[id]. */
  const initialBook: JournalBook & { entries: JournalEntry[] } = {
    ...book,
    entries: book.entries.map((e) => ({
      ...e,
      tags: parseTags(e.tags),
    })),
  };

  return (
    // Fixed viewport — matches journal reading mode (no document scroll)
    <div
      className="book-viewport-80"
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 30%, #2e160a 0%, #1a0c05 55%, #0e0603 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <BookSpread initialBook={initialBook} />
    </div>
  );
}
