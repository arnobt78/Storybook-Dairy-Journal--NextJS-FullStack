import { AuthBookShell } from "@/components/auth/AuthBookShell";

/**
 * @file (auth)/layout.tsx
 * @route Route group `(auth)` — shared shell for `/login` and `/register` (URLs omit the group name).
 *
 * **SSR vs client:** Server Component layout. Wraps children in `AuthBookShell` (client)
 * which owns the 3-D book spread and page-flip between auth routes.
 *
 * **Layout constraint:** `position: fixed; overflow: hidden` prevents a scroll container
 * from breaking pointer hit-testing on 3-D transformed pages (see CLAUDE.md).
 */
/**
 * Auth layout — fixed full-viewport shell with the book **centered** in the viewport
 * (same balanced framing as before). `overflow: hidden` keeps 3-D hit-testing predictable.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="auth-book-viewport book-viewport-80"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 30%, #2e160a 0%, #1a0c05 55%, #0e0603 100%)",
        overflow: "hidden",
      }}
    >
      <AuthBookShell>{children}</AuthBookShell>
    </div>
  );
}
