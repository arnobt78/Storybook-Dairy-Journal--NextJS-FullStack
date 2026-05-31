import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wordCount(text: string): number {
  const clean = text.replace(/<[^>]*>/g, "").trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

export function slugify(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return suffix ? `${base}-${suffix}` : base;
}

export function formatEntryDate(date: Date = new Date()): {
  entryDate: string;
  weekday: string;
} {
  return {
    entryDate: format(date, "MMMM d, yyyy"),
    weekday: format(date, "EEEE"),
  };
}

export function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function excerptFromContent(content: string, length = 200): string {
  const text = stripHtml(content);
  return text.length > length ? text.slice(0, length) + "…" : text;
}
