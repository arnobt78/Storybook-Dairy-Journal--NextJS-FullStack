import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateEntrySchema } from "@/lib/validations";
import { wordCount, readingTime, stringifyTags, parseTags } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;
  const body = await req.json();
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

  const result = await prisma.journalEntry.updateMany({
    where: { id: entryId, userId: session.user.id },
    data: updateData,
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
  }

  const updated = await prisma.journalEntry.findUnique({ where: { id: entryId } });
  return NextResponse.json({
    success: true,
    data: updated ? { ...updated, tags: parseTags(updated.tags) } : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  const result = await prisma.journalEntry.deleteMany({
    where: { id: entryId, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Deleted" });
}
