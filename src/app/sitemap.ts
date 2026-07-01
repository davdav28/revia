import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://reviagence.com";

/** Plan du site : pages publiques indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/tarifs", priority: 0.9, freq: "monthly" },
    { path: "/contact", priority: 0.6, freq: "yearly" },
    { path: "/signup", priority: 0.7, freq: "monthly" },
    { path: "/login", priority: 0.3, freq: "yearly" },
    { path: "/mentions-legales", priority: 0.2, freq: "yearly" },
    { path: "/cgu", priority: 0.2, freq: "yearly" },
    { path: "/confidentialite", priority: 0.2, freq: "yearly" },
    { path: "/sous-traitance", priority: 0.2, freq: "yearly" },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
