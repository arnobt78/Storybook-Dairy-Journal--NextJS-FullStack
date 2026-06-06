/**
 * Journal book form types — UI ↔ API walkthrough
 * ------------------------------------------------
 * BookFormValues mirrors createBookSchema / updateBookSchema in validations.ts.
 * Keeping one shared type avoids drift between BookEditorModal, BookShelf create
 * flow, and PATCH handlers.
 *
 * DEFAULT_BOOK_FORM — empty-slate for "New book" modal (leather brown + 📖).
 * bookToFormValues() — maps a JournalBook row into form defaults when editing;
 *   null description becomes "" so controlled inputs never receive undefined.
 */
export type BookFormValues = {
  title: string;
  description: string;
  coverColor: string;
  coverEmoji: string;
  theme: string;
};

export const DEFAULT_BOOK_FORM: BookFormValues = {
  title: "",
  description: "",
  coverColor: "#8b4513",
  coverEmoji: "📖",
  theme: "warm-paper",
};

/** Map a JournalBook row into editor defaults for PATCH flows */
export function bookToFormValues(book: {
  title: string;
  description?: string | null;
  coverColor: string;
  coverEmoji: string;
  theme?: string;
}): BookFormValues {
  return {
    title: book.title,
    description: book.description ?? "",
    coverColor: book.coverColor,
    coverEmoji: book.coverEmoji,
    theme: book.theme ?? "warm-paper",
  };
}
