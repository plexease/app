import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Plexease — Complex integrations, with ease";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const jakartaFont = fetch(
    new URL("../public/fonts/PlusJakartaSans-ExtraBold.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const interFont = fetch(
    new URL("../public/fonts/Inter-Regular.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const [jakartaData, interData] = await Promise.all([jakartaFont, interFont]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a14",
          backgroundImage: "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }}
      >
        {/* Logo icon */}
        <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
          <line x1="12" y1="14" x2="30" y2="10" stroke="#2e2946" strokeWidth="2.5" />
          <line x1="30" y1="10" x2="38" y2="28" stroke="#2e2946" strokeWidth="2.5" />
          <line x1="38" y1="28" x2="18" y2="36" stroke="#2e2946" strokeWidth="2.5" />
          <line x1="18" y1="36" x2="12" y2="14" stroke="#2e2946" strokeWidth="2.5" />
          <circle cx="12" cy="14" r="5" fill="#8b5cf6" />
          <circle cx="30" cy="10" r="5" fill="#c4b5fd" />
          <circle cx="38" cy="28" r="5" fill="#a78bfa" />
          <circle cx="18" cy="36" r="5" fill="#7c3aed" />
        </svg>

        {/* Wordmark */}
        <div style={{ marginTop: 24, display: "flex", fontFamily: "Jakarta", fontSize: 48, fontWeight: 800 }}>
          <span style={{ color: "#ffffff" }}>Plex</span>
          <span style={{ color: "#a78bfa" }}>ease</span>
        </div>

        {/* Tagline */}
        <div style={{ marginTop: 16, fontFamily: "Inter", fontSize: 24, color: "#9490ad" }}>
          Complex integrations, with ease
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: jakartaData, style: "normal", weight: 800 },
        { name: "Inter", data: interData, style: "normal", weight: 400 },
      ],
    }
  );
}
