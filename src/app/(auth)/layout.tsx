import { AuthBookShell } from "@/components/auth/AuthBookShell";

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
