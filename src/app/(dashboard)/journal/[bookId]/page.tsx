import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { BookSpread } from "@/components/journal/BookSpread";
import { parseTags } from "@/lib/utils";
import type { JournalBook, JournalEntry } from "@/types";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function JournalPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { bookId } = await params;

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
    <div
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
