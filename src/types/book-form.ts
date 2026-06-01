/**
 * Shared journal book form shape — matches createBookSchema / updateBookSchema fields.
 */
export type BookFormValues = {
  title: string;
  description: string;
  coverColor: string;
  coverEmoji: string;
};

export const DEFAULT_BOOK_FORM: BookFormValues = {
  title: "",
  description: "",
  coverColor: "#8b4513",
  coverEmoji: "📖",
};

/** Map a JournalBook row into editor defaults for PATCH flows */
export function bookToFormValues(book: {
  title: string;
  description?: string | null;
  coverColor: string;
  coverEmoji: string;
}): BookFormValues {
  return {
    title: book.title,
    description: book.description ?? "",
    coverColor: book.coverColor,
    coverEmoji: book.coverEmoji,
  };
}
