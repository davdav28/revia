/**
 * Helpers d'agenda. Les fonctions de date utilisent l'heure locale : le rendu
 * et le placement des RDV se font côté client (navigateur en Europe/Paris pour
 * la gérante), évitant les décalages UTC du serveur. Le serveur ne s'en sert
 * que pour calculer une plage de requête, élargie d'un jour de chaque côté.
 */

export const GRID_START_HOUR = 8;
export const GRID_END_HOUR = 20;
export const HOUR_PX = 56;
export const SNAP_MIN = 15;

export type AgendaView = "week" | "day";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Date locale → "AAAA-MM-JJ". */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "AAAA-MM-JJ" → Date à minuit local (ou aujourd'hui si invalide). */
export function parseYmd(s?: string | null): Date {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Lundi de la semaine de `d`, à minuit local. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 0 = lundi
  return addDays(x, -dow);
}

/** Jours visibles : 1 (vue jour) ou 7 (vue semaine, du lundi). */
export function visibleDays(view: AgendaView, d: Date): Date[] {
  if (view === "day") {
    return [new Date(d.getFullYear(), d.getMonth(), d.getDate())];
  }
  const start = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Plage de requête (élargie) couvrant la vue, en instants Date. */
export function queryRange(view: AgendaView, d: Date): { gte: Date; lt: Date } {
  const days = visibleDays(view, d);
  return {
    gte: addDays(days[0], -1),
    lt: addDays(days[days.length - 1], 2),
  };
}

const DAY_NAMES = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

export function dayName(d: Date): string {
  return DAY_NAMES[(d.getDay() + 6) % 7];
}

/** Étiquette de la plage affichée, ex. « 23 – 29 juin 2026 » ou « lundi 23 juin ». */
export function rangeLabel(view: AgendaView, d: Date): string {
  if (view === "day") {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d);
  }
  const days = visibleDays("week", d);
  const a = days[0];
  const b = days[6];
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long" });
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${month.format(b)} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${month.format(a)} – ${b.getDate()} ${month.format(b)} ${b.getFullYear()}`;
}

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Minutes depuis le haut de la grille (GRID_START_HOUR). */
export function minutesFromGridStart(d: Date): number {
  return (d.getHours() - GRID_START_HOUR) * 60 + d.getMinutes();
}
