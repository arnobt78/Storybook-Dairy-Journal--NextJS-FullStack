/**
 * /api/books — journal shelf CRUD (list + create).
 *
 * HTTP: GET (list), POST (create book + starter entry).
 * Auth: session required via auth(); 401 if no session.user.id.
 * Validation: createBookSchema (Zod) on POST body.
 * Ownership: all queries scoped to session.user.id.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBookSchema } from "@/lib/validations";
import { formatEntryDate, readingTime, slugify, stringifyTags, wordCount } from "@/lib/utils";
import { afterJournalMutation } from "@/lib/journal-mutation";

export async function GET() {
  /* Session check — only authenticated users see their shelf. */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  /* Prisma — ownership filter: books belong to current user only. */
  const books = await prisma.journalBook.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: books });
}

export async function POST(req: NextRequest) {
  /* Session check — book create requires logged-in user. */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  /* Zod validation — title, coverColor, coverEmoji, description, etc. */
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
  }

  /* Slug — unique URL-safe id derived from title + timestamp suffix. */
  const slug = slugify(parsed.data.title, Date.now().toString(36));

  /**
   * Every shelf book opens in `BookSpread`, which expects at least one entry row.
   * Creating a starter page here avoids an empty `entries[]` client tree (`current` undefined).
   */
  /* Prisma transaction — book + starter entry atomically (no empty shelf). */
  const book = await prisma.$transaction(async (tx) => {
    const created = await tx.journalBook.create({
      data: {
        userId: session.user.id,
        slug,
        ...parsed.data,
      },
    });
    const title = "New Entry";
    const content = "";
    const wc = wordCount(content);
    const rt = readingTime(wc);
    const { entryDate, weekday } = formatEntryDate();
    const entrySlug = slugify(title, Date.now().toString(36));
    await tx.journalEntry.create({
      data: {
        userId: session.user.id,
        bookId: created.id,
        title,
        slug: entrySlug,
        content,
        excerpt: "",
        mood: "✨",
        weather: "☀️",
        location: null,
        tags: stringifyTags([]),
        wordCount: wc,
        readingTime: rt,
        entryDate,
        weekday,
      },
    });
    return created;
  });

  await afterJournalMutation(session.user.id, "book_created", { bookId: book.id });

  return NextResponse.json({ success: true, data: book }, { status: 201 });
}
