/**
 * L'argent est stocké en centimes (entiers) pour éviter les erreurs d'arrondi.
 * Ces helpers font la conversion aux frontières (formulaires, affichage).
 */

const eurosFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formate des centimes en euros : 3500 → « 35 € », 3550 → « 35,50 € ». */
export function formatCents(cents: number | null | undefined): string {
  return eurosFormatter.format((cents ?? 0) / 100);
}

/**
 * Convertit une saisie utilisateur en euros (« 35 », « 35,50 », « 35.5 »)
 * en centimes. Retourne null si vide/invalide.
 */
export function parseEurosToCents(
  input: string | null | undefined,
): number | null {
  if (input == null) return null;
  const cleaned = String(input).trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Centimes → nombre d'euros (pour pré-remplir un champ de formulaire). */
export function centsToEurosInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return String(cents / 100);
}
