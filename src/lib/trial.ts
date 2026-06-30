import { SUBSCRIPTION } from "@/config/brand";

const DAY = 86_400_000;

export type TrialStatus = {
  isTrial: boolean;
  /** Jours restants avant la fin de l'essai (0 si dépassé). */
  daysLeft: number;
  recoveredCents: number;
  targetCents: number;
  freeSegments: number;
  expiredByTime: boolean;
  expiredByGoal: boolean;
  /** L'essai est terminé (par le temps OU par l'objectif de CA). */
  expired: boolean;
};

/**
 * État de l'essai gratuit : il prend fin au premier des deux seuils (durée et
 * objectif de CA récupéré, définis dans `SUBSCRIPTION.trial`), avec des
 * segments offerts. `recoveredCentsSinceStart` = CA récupéré depuis le début.
 */
export function getTrialStatus(
  salon: { subscriptionStatus: string; createdAt: Date },
  recoveredCentsSinceStart: number,
  now: Date = new Date(),
): TrialStatus {
  const isTrial = salon.subscriptionStatus === "trial";
  const targetCents = SUBSCRIPTION.trial.recoveredEurosTarget * 100;
  const end = new Date(salon.createdAt.getTime() + SUBSCRIPTION.trial.days * DAY);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY));

  const expiredByTime = isTrial && now >= end;
  const expiredByGoal = isTrial && recoveredCentsSinceStart >= targetCents;

  return {
    isTrial,
    daysLeft,
    recoveredCents: recoveredCentsSinceStart,
    targetCents,
    freeSegments: SUBSCRIPTION.trial.freeSegments,
    expiredByTime,
    expiredByGoal,
    expired: isTrial && (expiredByTime || expiredByGoal),
  };
}
