/**
 * Disponibilités de réservation en ligne. Fonctions pures (utilisables côté
 * client comme serveur). Les horaires (jours + plage) sont propres à chaque
 * salon ; pas de 30 min ; horizon 14 jours. Un seul rendez-vous à la fois.
 */
export const SLOT_STEP_MIN = 30;
export const HORIZON_DAYS = 14;

const DAY = 86_400_000;

/** Horaires d'ouverture d'un salon. openDays : 0 = dimanche … 6 = samedi. */
export type OpeningHours = {
  openDays: number[];
  openFromHour: number;
  openToHour: number;
};

export const DEFAULT_HOURS: OpeningHours = {
  openDays: [1, 2, 3, 4, 5, 6],
  openFromHour: 9,
  openToHour: 19,
};

export type BusyInterval = { start: number; end: number }; // ms epoch

export type DaySlots = {
  /** Minuit local du jour (ms epoch). */
  dayMs: number;
  /** Créneaux disponibles « HH:mm ». */
  times: string[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function overlaps(start: number, end: number, busy: BusyInterval[]): boolean {
  return busy.some((b) => start < b.end && end > b.start);
}

/** Génère les jours et créneaux disponibles pour une durée de prestation. */
export function availableSlots(
  durationMin: number,
  busy: BusyInterval[],
  hours: OpeningHours,
  now: Date = new Date(),
): DaySlots[] {
  const out: DaySlots[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 0; d < HORIZON_DAYS; d++) {
    const day = new Date(today.getTime() + d * DAY);
    if (!hours.openDays.includes(day.getDay())) continue;

    const times: string[] = [];
    const lastStart = hours.openToHour * 60 - durationMin;
    for (let m = hours.openFromHour * 60; m <= lastStart; m += SLOT_STEP_MIN) {
      const slotStart = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        Math.floor(m / 60),
        m % 60,
      );
      const startMs = slotStart.getTime();
      const endMs = startMs + durationMin * 60_000;
      if (startMs <= now.getTime()) continue; // passé
      if (overlaps(startMs, endMs, busy)) continue;
      times.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
    if (times.length > 0) out.push({ dayMs: day.getTime(), times });
  }
  return out;
}

/** Heure + jour de la semaine d'un instant dans un fuseau donné (re-contrôle serveur). */
export function hourAndDayInTz(
  at: Date,
  tz: string,
): { hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    hour: parseInt(get("hour"), 10),
    minute: parseInt(get("minute"), 10),
    weekday: wd[get("weekday")] ?? 0,
  };
}

/** Re-contrôle serveur d'un créneau (fuseau + horaires du salon + chevauchement). */
export function isSlotBookable(
  startAt: Date,
  durationMin: number,
  busy: BusyInterval[],
  tz: string,
  hours: OpeningHours,
  now: Date = new Date(),
): boolean {
  if (startAt.getTime() <= now.getTime()) return false;
  if (startAt.getTime() > now.getTime() + (HORIZON_DAYS + 1) * DAY)
    return false;
  const { hour, minute, weekday } = hourAndDayInTz(startAt, tz);
  if (!hours.openDays.includes(weekday)) return false;
  const startMin = hour * 60 + minute;
  if (startMin < hours.openFromHour * 60) return false;
  if (startMin + durationMin > hours.openToHour * 60) return false;
  const endMs = startAt.getTime() + durationMin * 60_000;
  return !overlaps(startAt.getTime(), endMs, busy);
}
