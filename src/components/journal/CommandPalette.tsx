"use client";

/**
 * ⌘K command palette — search entries, navigate journals, quick actions.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { queryKeys } from "@/lib/query-keys";
import type { SearchHit } from "@/lib/search";
import type { JournalBook } from "@/types";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data: books = [] } = useQuery<JournalBook[]>({
    queryKey: queryKeys.booksList(),
    queryFn: async () => {
      const res = await fetch("/api/books");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: open,
  });

  const { data: searchHits = [] } = useQuery<SearchHit[]>({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=12`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: open && query.trim().length >= 2,
  });

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      setQuery("");
      fn();
    },
    [onOpenChange],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-[rgba(120,70,20,.2)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search entries, open a journal…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {searchHits.length > 0 && (
              <CommandGroup heading="Search">
                {searchHits.map((hit) => (
                  <CommandItem
                    key={hit.id}
                    value={`${hit.title} ${hit.bookTitle}`}
                    onSelect={() =>
                      run(() => router.push(`/journal/${hit.bookId}`))
                    }
                  >
                    <span>{hit.mood}</span>
                    <span className="truncate">
                      {hit.title} — {hit.bookTitle}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Journals">
              {books.map((book) => (
                <CommandItem
                  key={book.id}
                  value={book.title}
                  onSelect={() => run(() => router.push(`/journal/${book.id}`))}
                >
                  <span>{book.coverEmoji}</span>
                  <span>{book.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
                Open shelf
              </CommandItem>
              <CommandItem onSelect={() => run(() => signOut({ callbackUrl: "/" }))}>
                Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}

/** Global ⌘K / Ctrl+K listener */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
