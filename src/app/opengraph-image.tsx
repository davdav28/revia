import { ImageResponse } from "next/og";
import { BRAND } from "@/config/brand";

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Aperçu de partage (réseaux sociaux, SMS, messageries) — 1200×630. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2B1F2E",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <svg width="76" height="76" viewBox="0 0 26 26" fill="none">
            <path
              d="M5 13c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2.8-2.3 5-5 5-2.2 0-4-1.8-4-4 0-1.7 1.3-3 3-3"
              stroke="#CE3A57"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#F7F2F0" }}>
            {BRAND.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              color: "#F7F2F0",
              lineHeight: 1.05,
              maxWidth: "940px",
            }}
          >
            {BRAND.tagline}
          </div>
          <div style={{ fontSize: 34, color: "#D9C9CE", maxWidth: "860px" }}>
            Réactivation client pour les salons de beauté & de bien-être.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#B9A6AC" }}>
          {BRAND.audiences.slice(0, 6).join("   ·   ")}
        </div>
      </div>
    ),
    { ...size },
  );
}
