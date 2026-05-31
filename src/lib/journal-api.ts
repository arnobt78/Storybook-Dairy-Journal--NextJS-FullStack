import type { JournalBook, JournalEntry } from "@/types";

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
