/**
 * /api/entries — create journal entry.
 *
 * HTTP: POST only (list lives under GET /api/books/[bookId]).
 * Auth: session required; 401 without session.user.id.
 * Validation: createEntrySchema (Zod) — bookId, title, content, mood, etc.
 * Ownership: verifies book belongs to session.user.id before insert.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEntrySchema } from "@/lib/validations";
import { slugify, wordCount, readingTime, formatEntryDate, stringifyTags } from "@/lib/utils";
import { afterJournalMutation } from "@/lib/journal-mutation";

export async function POST(req: NextRequest) {
  /* Session check */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  /* Zod validation — reject invalid entry payloads early. */
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
  }

  const { bookId, title, content, mood, weather, location, tags } = parsed.data;

  // Verify book ownership
  const book = await prisma.journalBook.findFirst({
    where: { id: bookId, userId: session.user.id },
  });
  if (!book) {
    return NextResponse.json({ success: false, message: "Book not found" }, { status: 404 });
  }

  const wc = wordCount(content);
  const rt = readingTime(wc);
  const { entryDate, weekday } = formatEntryDate();
  /* Slug — generated from title + timestamp for new entries. */
  const slug = slugify(title || "untitled", Date.now().toString(36));

  /* Prisma create — userId + bookId tie row to owner and parent book. */
  const entry = await prisma.journalEntry.create({
    data: {
      userId: session.user.id,
      bookId,
      title: title || "Untitled Entry",
      slug,
      content,
      excerpt: content.slice(0, 200),
      mood,
      weather,
      location,
      tags: stringifyTags(tags),
      wordCount: wc,
      readingTime: rt,
      entryDate,
      weekday,
    },
  });

  await afterJournalMutation(session.user.id, "entry_created", {
    bookId,
    entryId: entry.id,
  });

  return NextResponse.json({
    success: true,
    data: { ...entry, tags },
  }, { status: 201 });
}
