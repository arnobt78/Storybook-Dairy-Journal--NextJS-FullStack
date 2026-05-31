/**
 * Global journal UI store (Zustand) — available for future features; the live
 * reader currently keeps state in `BookSpread` while TanStack Query owns server lists.
 */
import { create } from "zustand";
import type { JournalEntry, EntryDraft } from "@/types";

interface JournalState {
  entries: JournalEntry[];
  currentIdx: number;
  isWriting: boolean;
  draft: EntryDraft;
  isSaving: boolean;

  setEntries: (entries: JournalEntry[]) => void;
  setCurrentIdx: (idx: number) => void;
  setIsWriting: (v: boolean) => void;
  setDraft: (draft: Partial<EntryDraft>) => void;
  updateDraftField: <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) => void;
  setIsSaving: (v: boolean) => void;
  updateEntry: (id: string, data: Partial<JournalEntry>) => void;
  addEntry: (entry: JournalEntry) => void;
}

const DEFAULT_DRAFT: EntryDraft = {
  title: "",
  content: "",
  mood: "✨",
  weather: "☀️",
  tags: [],
  location: "",
};

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  currentIdx: 0,
  isWriting: false,
  draft: DEFAULT_DRAFT,
  isSaving: false,

  setEntries: (entries) =>
    set({ entries, currentIdx: Math.max(0, entries.length - 1) }),

  setCurrentIdx: (idx) => set({ currentIdx: idx }),

  setIsWriting: (v) => set({ isWriting: v }),

  setDraft: (draft) =>
    set((s) => ({ draft: { ...s.draft, ...draft } })),

  updateDraftField: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value } })),

  setIsSaving: (v) => set({ isSaving: v }),

  updateEntry: (id, data) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),

  addEntry: (entry) =>
    set((s) => ({
      entries: [...s.entries, entry],
      currentIdx: s.entries.length,
    })),
}));
