import type { ClientStatus } from "@prisma/client";

const DAY = 86_400_000;

export type DormancyParams = {
  defaultCycleDays: number;
  graceDays: number;
  lostAfterDays: number;
};

export const DEFAULT_DORMANCY: DormancyParams = {
  defaultCycleDays: 28,
  graceDays: 7,
  lostAfterDays: 180,
};

/**
 * Statut d'une cliente selon l'écart à sa dernière visite et son cycle attendu.
 *   active   : dans le cycle (+ tolérance)
 *   at_risk  : cycle dépassé, jusqu'à ~2× le cycle
 *   dormant  : au-delà de 2× le cycle (c'est le moment de relancer)
 *   lost     : très long silence
 * Les statuts `recovered` sont posés par la détection de réactivation.
 */
export function statusFromLastVisit(
  lastVisitAt: Date | null,
  cycleDays: number,
  params: DormancyParams = DEFAULT_DORMANCY,
  now: Date = new Date(),
): ClientStatus {
  if (!lastVisitAt) return "active";
  const days = Math.floor((now.getTime() - lastVisitAt.getTime()) / DAY);
  if (days <= cycleDays + params.graceDays) return "active";
  if (days <= cycleDays * 2) return "at_risk";
  if (days <= params.lostAfterDays) return "dormant";
  return "lost";
}

/**
 * Cycle attendu d'une cliente : l'intervalle de sa prestation la plus récente
 * (qui en définit un), sinon le cycle par défaut du salon.
 */
export function clientCycleDays(
  appts: { startAt: Date; serviceInterval: number | null }[],
  fallback: number,
): number {
  const sorted = [...appts].sort(
    (a, b) => b.startAt.getTime() - a.startAt.getTime(),
  );
  for (const a of sorted) {
    if (a.serviceInterval && a.serviceInterval > 0) return a.serviceInterval;
  }
  return fallback;
}
