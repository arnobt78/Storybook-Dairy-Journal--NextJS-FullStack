/**
 * /api/books/[bookId] — single book read, update, delete.
 *
 * HTTP: GET (book + entries), PATCH (metadata), DELETE (cascade via Prisma).
 * Auth: session required; 401 without session.user.id.
 * Validation: updateBookSchema (Zod) on PATCH body.
 * Ownership: every Prisma where includes userId = session.user.id.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveUniqueBookSlug } from "@/lib/journal-slug";
import { updateBookSchema } from "@/lib/validations";
import { parseTags } from "@/lib/utils";
import { afterJournalMutation } from "@/lib/journal-mutation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  /* Session check — gate all book operations. */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;

  /* Prisma + ownership — findFirst ties bookId to current user. */
  const book = await prisma.journalBook.findFirst({
    where: { id: bookId, userId: session.user.id },
    include: {
      entries: {
        where: { isArchived: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  // Parse tags for each entry
  const bookWithParsedTags = {
    ...book,
    entries: book.entries.map((e) => ({
      ...e,
      tags: parseTags(e.tags),
    })),
  };

  return NextResponse.json({ success: true, data: bookWithParsedTags });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  /* Session check */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const body = await req.json();
  /* Zod validation — partial book fields allowed on PATCH. */
  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
  }

  const updateData: Prisma.JournalBookUpdateInput = { ...parsed.data };

  if (parsed.data.title !== undefined) {
    /* Ownership + slug sync — regenerate slug when title changes. */
    const existing = await prisma.journalBook.findFirst({
      where: { id: bookId, userId: session.user.id },
      select: { title: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    if (existing.title !== parsed.data.title) {
      /* resolveUniqueBookSlug — collision-safe slug per user. */
      updateData.slug = await resolveUniqueBookSlug({
        title: parsed.data.title,
        userId: session.user.id,
        bookId,
        prisma,
      });
    }
  }

  /* Prisma updateMany — userId in where prevents cross-user writes. */
  const book = await prisma.journalBook.updateMany({
    where: { id: bookId, userId: session.user.id },
    data: updateData,
  });

  if (book.count === 0) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  await afterJournalMutation(session.user.id, "book_updated", { bookId });

  return NextResponse.json({ success: true, message: "Updated" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  /* Session check */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;

  /* Prisma deleteMany — ownership enforced via userId filter. */
  const result = await prisma.journalBook.deleteMany({
    where: { id: bookId, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  await afterJournalMutation(session.user.id, "book_deleted", { bookId });

  return NextResponse.json({ success: true, message: "Deleted" });
}
