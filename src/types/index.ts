export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  themePreference: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalBook {
  id: string;
  userId: string;
  title: string;
  slug: string;
  coverColor: string;
  coverEmoji: string;
  theme: string;
  description?: string | null;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { entries: number };
  entries?: JournalEntry[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  mood: string;
  weather: string;
  location?: string | null;
  tags: string[];
  wordCount: number;
  readingTime: number;
  isFavorite: boolean;
  isArchived: boolean;
  entryDate: string;
  weekday: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EntryDraft = Pick<
  JournalEntry,
  "title" | "content" | "mood" | "weather" | "tags" | "location"
>;

export type FlipDirection = "fwd" | "bwd";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}
