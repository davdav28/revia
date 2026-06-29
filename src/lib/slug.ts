import { prisma } from "./prisma";

/** Transforme un nom en slug URL : « Salon Démo Revia » → « salon-demo-revia ». */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Slug unique pour un salon (ajoute -2, -3… en cas de collision). */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "salon";
  let candidate = base;
  let n = 1;
  // Quelques tentatives suffisent en pratique.
  while (await prisma.salon.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

/** URL publique de réservation d'un salon. */
export function bookingUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/r/${slug}`;
}
