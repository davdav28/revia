import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://reviagence.com";

/**
 * Indexation : on ouvre les pages publiques (accueil, tarifs, contact, légal,
 * inscription) et on bloque l'espace connecté, l'API et les pages à jeton.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/clientes",
        "/agenda",
        "/relances",
        "/reglages",
        "/admin",
        "/api/",
        "/rejoindre/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
