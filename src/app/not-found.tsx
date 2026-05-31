import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, #2e160a 0%, #1a0c05 55%, #0e0603 100%)",
    }}>
      <div style={{ fontSize: "48px", opacity: 0.4, marginBottom: "16px" }}>📖</div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "28px", color: "rgba(255,205,130,.7)", margin: "0 0 8px" }}>
        Page not found
      </h1>
      <p style={{ fontFamily: "'Lora',serif", fontSize: "13px", color: "rgba(255,170,70,.35)", margin: "0 0 28px" }}>
        This page seems to have been torn out.
      </p>
      <Link href="/dashboard" style={{
        fontFamily: "'Lora',serif", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
        background: "rgba(90,40,10,.82)", color: "rgba(255,215,150,.92)", textDecoration: "none",
        padding: "10px 22px", borderRadius: "3px",
      }}>
        Return to shelf
      </Link>
    </div>
  );
}
