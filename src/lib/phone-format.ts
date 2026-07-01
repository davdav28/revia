/**
 * Met un numéro au format attendu par les passerelles SMS (international sans
 * « + », ex. `33612345678`). Marché France par défaut : un numéro national
 * `0X XX XX XX XX` devient `33XXXXXXXXX`. Tolérant sur la saisie (espaces, +,
 * 00…). Renvoie les chiffres tels quels si le format n'est pas reconnu.
 */
export function toSmsRecipient(
  raw: string | null | undefined,
  defaultCountry = "33",
): string {
  if (!raw) return "";
  let d = String(raw).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  // National français : 0X XX XX XX XX (10 chiffres) → 33XXXXXXXXX.
  if (d.startsWith("0") && d.length === 10) d = defaultCountry + d.slice(1);
  return d;
}
