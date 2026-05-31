import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBookSchema } from "@/lib/validations";
import { formatEntryDate, readingTime, slugify, stringifyTags, wordCount } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const books = await prisma.journalBook.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: books });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
  }

  const slug = slugify(parsed.data.title, Date.now().toString(36));

  /**
   * Every shelf book opens in `BookSpread`, which expects at least one entry row.
   * Creating a starter page here avoids an empty `entries[]` client tree (`current` undefined).
   */
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

  return NextResponse.json({ success: true, data: book }, { status: 201 });
}
