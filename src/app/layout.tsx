import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "StoryBook Journal",
  description: "A premium immersive journaling experience — write your story, one page at a time.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "StoryBook Journal",
    description: "A premium immersive journaling experience.",
    type: "website",
  },
};

/**
 * Root layout — injects global CSS (fonts, tokens, animations) and wraps all
 * routes in <Providers> (SessionProvider + QueryClientProvider + Sonner Toaster).
 *
 * `suppressHydrationWarning` on <html> and <body> silences mismatches when browser
 * extensions inject attributes before hydration (e.g. Grammarly, `cz-shortcut-listen`).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
