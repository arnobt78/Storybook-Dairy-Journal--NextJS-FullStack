/**
 * Book spread themes — maps JournalBook.theme to CSS custom properties.
 */
export type BookThemeId =
  | "warm-paper"
  | "dark-academia"
  | "midnight-journal"
  | "soft-minimal"
  | "vintage-diary";

export type BookThemeTokens = {
  id: BookThemeId;
  label: string;
  pageLeft: string;
  pageRight: string;
  ink: string;
  inkMuted: string;
  accent: string;
};

export const BOOK_THEMES: BookThemeTokens[] = [
  {
    id: "warm-paper",
    label: "Warm Paper",
    pageLeft: "linear-gradient(to right,#ede1cc 0%,#f4ecda 60%,#ede0c8 100%)",
    pageRight: "linear-gradient(to left,#e8dcc9 0%,#f4ecda 60%,#ede0c8 100%)",
    ink: "rgba(35,14,3,.82)",
    inkMuted: "rgba(100,55,20,.45)",
    accent: "rgba(170,95,35,.55)",
  },
  {
    id: "dark-academia",
    label: "Dark Academia",
    pageLeft: "linear-gradient(to right,#2a2418 0%,#3d3528 60%,#2e281c 100%)",
    pageRight: "linear-gradient(to left,#252018 0%,#353028 60%,#2a2418 100%)",
    ink: "rgba(230,210,170,.9)",
    inkMuted: "rgba(180,150,100,.5)",
    accent: "rgba(200,160,80,.6)",
  },
  {
    id: "midnight-journal",
    label: "Midnight Journal",
    pageLeft: "linear-gradient(to right,#1a1a2e 0%,#252540 60%,#1e1e32 100%)",
    pageRight: "linear-gradient(to left,#161628 0%,#222238 60%,#1a1a2e 100%)",
    ink: "rgba(220,220,240,.88)",
    inkMuted: "rgba(160,160,200,.45)",
    accent: "rgba(140,160,255,.55)",
  },
  {
    id: "soft-minimal",
    label: "Soft Minimal",
    pageLeft: "linear-gradient(to right,#f5f5f0 0%,#fafaf8 60%,#f0f0eb 100%)",
    pageRight: "linear-gradient(to left,#ecece8 0%,#f8f8f5 60%,#f0f0eb 100%)",
    ink: "rgba(40,40,45,.85)",
    inkMuted: "rgba(100,100,110,.4)",
    accent: "rgba(80,80,90,.35)",
  },
  {
    id: "vintage-diary",
    label: "Vintage Diary",
    pageLeft: "linear-gradient(to right,#e8d5b5 0%,#f0e4cc 60%,#e5d4b0 100%)",
    pageRight: "linear-gradient(to left,#e0cbb0 0%,#ede0c4 60%,#e5d4b0 100%)",
    ink: "rgba(55,30,10,.8)",
    inkMuted: "rgba(120,80,40,.42)",
    accent: "rgba(150,90,40,.5)",
  },
];

export function getBookTheme(id: string): BookThemeTokens {
  return BOOK_THEMES.find((t) => t.id === id) ?? BOOK_THEMES[0];
}
