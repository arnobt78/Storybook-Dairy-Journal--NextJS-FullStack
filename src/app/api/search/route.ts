/**
 * GET /api/search — scoped entry search (title/content contains).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTags, excerptFromContent } from "@/lib/utils";
import { searchQuerySchema, type SearchHit } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = searchQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
  }

  const { q, bookId, mood, limit } = parsed.data;

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
      ...(bookId ? { bookId } : {}),
      ...(mood ? { mood } : {}),
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { book: { select: { title: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const hits: SearchHit[] = entries.map((e) => ({
    id: e.id,
    bookId: e.bookId,
    bookTitle: e.book.title,
    title: e.title,
    excerpt: e.excerpt ?? excerptFromContent(e.content, 120),
    mood: e.mood,
    entryDate: e.entryDate,
  }));

  return NextResponse.json({ success: true, data: hits });
}
