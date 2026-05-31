import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required").max(60),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(300).optional(),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#8b4513"),
  coverEmoji: z.string().default("📖"),
  visibility: z.enum(["private", "public"]).default("private"),
});

export const updateBookSchema = createBookSchema.partial();

export const createEntrySchema = z.object({
  bookId: z.string().cuid(),
  title: z.string().max(200).default("Untitled Entry"),
  content: z.string().default(""),
  mood: z.string().default("✨"),
  weather: z.string().default("☀️"),
  location: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).default([]),
});

export const updateEntrySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  mood: z.string().optional(),
  weather: z.string().optional(),
  location: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
