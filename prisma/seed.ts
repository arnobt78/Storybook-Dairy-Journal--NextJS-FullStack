/**
 * prisma/seed.ts — creates the test@user.com demo account.
 *
 * Run via Prisma: `npx prisma db seed` (uses `tsx` from devDependencies + package.json#prisma.seed).
 * Manual: `npx tsx prisma/seed.ts`
 *
 * The account is also created automatically on first register if it doesn't
 * exist, but this seed ensures it's available from fresh DB migrations.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test@user.com";
  const password = "12345678";
  const displayName = "Test User";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✓ Test user already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
  });

  const book = await prisma.journalBook.create({
    data: {
      userId: user.id,
      title: "My Journal",
      slug: "my-journal",
      coverColor: "#8b4513",
      coverEmoji: "📖",
      description: "A place for my thoughts.",
    },
  });

  const now = new Date();
  const entryDate = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });

  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      bookId: book.id,
      title: "Welcome to StoryBook",
      slug: "welcome-to-storybook",
      content:
        "<p>Your journal begins here. Write what's on your mind, capture memories, and let your story unfold — one page at a time.</p>",
      mood: "✨",
      weather: "☀️",
      tags: JSON.stringify(["welcome", "beginning"]),
      wordCount: 24,
      readingTime: 1,
      entryDate,
      weekday,
    },
  });

  console.log("✓ Test user created:", email, "/ password:", password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
