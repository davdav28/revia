/**
 * Parse une date saisie dans des formats français courants ou ISO :
 * « 12/03/2026 », « 12-03-2026 », « 12.03.2026 », « 2026-03-12 ».
 * Retourne null si non interprétable ou si la date est dans le futur lointain.
 */
export function parseFlexibleDate(
  input: string | null | undefined,
): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // ISO (YYYY-MM-DD éventuellement avec heure)
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
    return isValid(d) ? d : null;
  }

  // JJ/MM/AAAA et variantes (séparateurs / - .)
  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s);
  if (fr) {
    const day = Number(fr[1]);
    const month = Number(fr[2]);
    let year = Number(fr[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day, 12, 0, 0);
    // Vérifie que les composants n'ont pas débordé (ex. 32/13).
    if (
      isValid(d) &&
      d.getDate() === day &&
      d.getMonth() === month - 1 &&
      d.getFullYear() === year
    ) {
      return d;
    }
    return null;
  }

  const fallback = new Date(s);
  return isValid(fallback) ? fallback : null;
}

function isValid(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** Formate une date en français court : « 12 mars 2026 ». */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Ancienneté lisible : « il y a 3 sem. », « il y a 2 mois ». */
export function formatRelative(
  d: Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!d) return "Jamais venue";
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 14) return `il y a ${days} j`;
  if (days < 60) return `il y a ${Math.round(days / 7)} sem.`;
  if (days < 365) return `il y a ${Math.round(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${days >= 730 ? "s" : ""}`;
}
