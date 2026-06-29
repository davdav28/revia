/**
 * Plages d'envoi décentes. Règle dure : pas de message avant 9h ni après 20h
 * (heure du salon). Les meilleurs taux sont mardi-jeudi 9-11h / 17-19h, mais on
 * n'interdit pas les autres créneaux ouvrés.
 */
function hourInTz(now: Date, tz: string): { hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const wdMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };
  const weekday =
    wdMap[parts.find((p) => p.type === "weekday")?.value ?? ""] ?? 0;
  return { hour, weekday };
}

export function isWithinSendWindow(
  now: Date = new Date(),
  tz: string = "Europe/Paris",
): boolean {
  const { hour, weekday } = hourInTz(now, tz);
  if (weekday === 0) return false; // pas le dimanche
  return hour >= 9 && hour < 20;
}
