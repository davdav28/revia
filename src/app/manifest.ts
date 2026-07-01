import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

/**
 * Manifest PWA : donne à Revia une icône et un nom propres quand on l'ajoute à
 * l'écran d'accueil (Android/Chrome). iOS utilise `apple-icon.png` en plus.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#2B1F2E",
    theme_color: "#2B1F2E",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
