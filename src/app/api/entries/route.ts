import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEntrySchema } from "@/lib/validations";
import { slugify, wordCount, readingTime, formatEntryDate, stringifyTags } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
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
  const slug = slugify(title || "untitled", Date.now().toString(36));

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

  return NextResponse.json({
    success: true,
    data: { ...entry, tags },
  }, { status: 201 });
}
