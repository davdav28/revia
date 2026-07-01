import { BRAND } from "@/config/brand";

/**
 * Transforme un nom de salon en identifiant d'expéditeur SMS valide.
 * Contraintes opérateurs : ≤ 11 caractères, lettres/chiffres uniquement
 * (pas d'accents, d'espaces ni de symboles). Repli sur le nom de la marque
 * si le résultat est trop court.
 *
 * `NFD` décompose les caractères accentués (« é » → « e » + accent) ; le
 * filtre alphanumérique retire ensuite l'accent, ne gardant que « e ».
 */
export function toSmsSender(name: string | null | undefined): string {
  const cleaned = (name ?? "")
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 11);
  // Un expéditeur alphanumérique doit faire au moins 3 caractères.
  return cleaned.length >= 3 ? cleaned : BRAND.smsSenderDefault;
}
