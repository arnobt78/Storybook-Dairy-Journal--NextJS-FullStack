import type { JournalBook, JournalEntry } from "@/types";
import type { BookFormValues } from "@/types/book-form";

type BooksApi = { success: boolean; data?: (JournalBook & { _count?: { entries: number } })[]; message?: string };
type BookApi = { success: boolean; data?: JournalBook & { entries: JournalEntry[] }; message?: string };

/**
 * Fetches the signed-in user's journals from the Route Handler.
 * Used as the queryFn for the shelf list; throws so React Query marks errors.
 */
export async function fetchJournalBooks(): Promise<(JournalBook & { _count?: { entries: number } })[]> {
  const res = await fetch("/api/books");
  const json = (await res.json()) as BooksApi;
  if (!json.success || !json.data) {
    throw new Error(json.message ?? "Failed to load journals");
  }
  return json.data;
}

/**
 * Fetches one book and its entries for the reader view (same shape as GET handler).
 */
export async function fetchJournalBook(bookId: string): Promise<JournalBook & { entries: JournalEntry[] }> {
  const res = await fetch(`/api/books/${bookId}`);
  const json = (await res.json()) as BookApi;
  if (!json.success || !json.data) {
    throw new Error(json.message ?? "Failed to load book");
  }
  return json.data as JournalBook & { entries: JournalEntry[] };
}

type MutationApi = { success: boolean; message?: string };

/** POST /api/books — caller invalidates journalSubtree */
export async function createJournalBook(data: BookFormValues): Promise<void> {
  const res = await fetch("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as MutationApi;
  if (!json.success) {
    throw new Error(json.message ?? "Failed to create journal");
  }
}

/** PATCH /api/books/[bookId] — caller invalidates journalSubtree */
export async function updateJournalBook(
  bookId: string,
  data: Partial<BookFormValues>,
): Promise<void> {
  const res = await fetch(`/api/books/${bookId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as MutationApi;
  if (!json.success) {
    throw new Error(json.message ?? "Failed to update journal");
  }
}

/** DELETE /api/entries/[entryId] — cascades via Prisma; caller invalidates journalSubtree */
export async function deleteJournalEntry(entryId: string): Promise<void> {
  const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
  const json = (await res.json()) as MutationApi;
  if (!json.success) {
    throw new Error(json.message ?? "Failed to delete entry");
  }
}

/** DELETE /api/books/[bookId] — removes book + entries; caller invalidates journalSubtree */
export async function deleteJournalBook(bookId: string): Promise<void> {
  const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
  const json = (await res.json()) as MutationApi;
  if (!json.success) {
    throw new Error(json.message ?? "Failed to delete journal");
  }
}
