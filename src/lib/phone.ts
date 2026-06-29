/**
 * Normalise un numéro de téléphone français de façon légère : on retire
 * espaces, points et tirets, on garde chiffres et un éventuel « + ».
 * On ne réécrit pas le format (pas de +33 forcé) — ça viendra à l'envoi SMS.
 * Retourne null si vide.
 */
export function normalizePhone(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const cleaned = String(input)
    .replace(/[\s.\-()]/g, "")
    .trim();
  if (!cleaned) return null;
  return cleaned;
}
