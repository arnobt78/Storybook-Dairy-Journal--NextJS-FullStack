/**
 * /api/entries/[entryId] — update or delete a single entry.
 *
 * HTTP: PATCH (partial update), DELETE (hard delete).
 * Auth: session required; 401 without session.user.id.
 * Validation: updateEntrySchema (Zod) on PATCH body.
 * Ownership: updateMany/deleteMany filter by userId; slug sync on title change.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveUniqueEntrySlug } from "@/lib/journal-slug";
import { updateEntrySchema } from "@/lib/validations";
import { wordCount, readingTime, stringifyTags, parseTags } from "@/lib/utils";
import { afterJournalMutation } from "@/lib/journal-mutation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  /* Session check */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;
  const body = await req.json();
  /* Zod validation — partial fields; content/tags trigger derived fields. */
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
  }

  const { content, tags, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };

  if (content !== undefined) {
    const wc = wordCount(content);
    updateData.content = content;
    updateData.excerpt = content.slice(0, 200);
    updateData.wordCount = wc;
    updateData.readingTime = readingTime(wc);
  }

  if (tags !== undefined) {
    updateData.tags = stringifyTags(tags);
  }

  if (parsed.data.title !== undefined) {
    /* Ownership + slug sync — regenerate entry slug when title changes. */
    const existing = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId: session.user.id },
      select: { title: true, bookId: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }
    if (existing.title !== parsed.data.title) {
      /* resolveUniqueEntrySlug — unique slug within parent book. */
      updateData.slug = await resolveUniqueEntrySlug({
        title: parsed.data.title,
        bookId: existing.bookId,
        entryId,
        prisma,
      });
    }
  }

  /* Prisma updateMany — userId in where blocks cross-user edits. */
  const result = await prisma.journalEntry.updateMany({
    where: { id: entryId, userId: session.user.id },
    data: updateData,
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
  }

  const updated = await prisma.journalEntry.findUnique({ where: { id: entryId } });
  if (updated) {
    await afterJournalMutation(session.user.id, "entry_updated", {
      bookId: updated.bookId,
      entryId: updated.id,
    });
  }
  return NextResponse.json({
    success: true,
    data: updated ? { ...updated, tags: parseTags(updated.tags) } : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  /* Session check */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  const existing = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: session.user.id },
    select: { bookId: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
  }

  /* Prisma deleteMany — ownership enforced via userId filter. */
  const result = await prisma.journalEntry.deleteMany({
    where: { id: entryId, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
  }

  await afterJournalMutation(session.user.id, "entry_deleted", {
    bookId: existing.bookId,
    entryId,
  });

  return NextResponse.json({ success: true, message: "Deleted" });
}
