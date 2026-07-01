import type { Salon } from "@prisma/client";
import { getPlan, HIGHLIGHTED_PLAN_ID, SUBSCRIPTION, type Plan } from "@/config/brand";

/** Champs de `Salon` nécessaires au calcul du quota (sous-ensemble). */
export type QuotaSalon = Pick<
  Salon,
  | "plan"
  | "subscriptionStatus"
  | "smsUsedThisPeriod"
  | "rechargeSegments"
  | "overageCapCents"
  | "quotaPeriodStart"
  | "customSmsQuota"
  | "customOverageCents"
>;

export type QuotaStatus = {
  plan: Plan;
  /** Segments inclus = quota du plan + recharges prépayées. */
  included: number;
  used: number;
  /** Segments restants dans l'inclus (≥ 0). */
  remaining: number;
  /** % de l'inclus consommé (peut dépasser 100 en cas de dépassement). */
  pct: number;
  overageCents: number;
  overageCapCents: number;
  /** Segments de dépassement autorisés avant la pause (plafond ÷ prix). */
  overageCapSegments: number;
  /** Inclus + dépassement autorisé = total envoyable avant pause. */
  totalAllowed: number;
  /** Segments déjà facturés en dépassement. */
  overageUsed: number;
  overageCostCents: number;
  /** Segments encore envoyables avant le plafond. */
  sendable: number;
  isOver80: boolean;
  /** Plafond atteint → les envois SMS sont en pause. */
  isPaused: boolean;
  /** Vrai si le salon est en essai (segments offerts, pas de dépassement). */
  isTrial: boolean;
};

/** État du quota SMS d'un salon pour la période en cours. */
export function getQuotaStatus(salon: QuotaSalon): QuotaStatus {
  const plan = getPlan(salon.plan);

  // Pendant l'essai (ou sans plan) : 150 segments offerts, aucun dépassement.
  // Même si une formule est choisie (carte à l'inscription), l'essai reste
  // plafonné à 150 SMS ; au-delà, l'essai se termine et le plan prend le relais.
  const onTrial = !plan || salon.subscriptionStatus === "trial";
  if (onTrial) {
    const included =
      SUBSCRIPTION.trial.freeSegments + (salon.rechargeSegments ?? 0);
    const used = salon.smsUsedThisPeriod ?? 0;
    const pct = included > 0 ? Math.round((used / included) * 100) : 0;
    return {
      plan: plan ?? getPlan(HIGHLIGHTED_PLAN_ID)!,
      included,
      used,
      remaining: Math.max(0, included - used),
      pct,
      overageCents: 0,
      overageCapCents: 0,
      overageCapSegments: 0,
      totalAllowed: included,
      overageUsed: 0,
      overageCostCents: 0,
      sendable: Math.max(0, included - used),
      isOver80: included > 0 && pct >= SUBSCRIPTION.quotaAlertPct,
      isPaused: used >= included,
      isTrial: true,
    };
  }

  // Offre sur-mesure : les overrides du salon priment sur les valeurs du plan.
  const baseQuota = salon.customSmsQuota ?? plan.smsQuota;
  const included = baseQuota + (salon.rechargeSegments ?? 0);
  const used = salon.smsUsedThisPeriod ?? 0;
  const overageCents = salon.customOverageCents ?? plan.overageCents;
  const overageCapCents =
    salon.overageCapCents ?? SUBSCRIPTION.defaultOverageCapCents;
  const overageCapSegments =
    overageCents > 0 ? Math.floor(overageCapCents / overageCents) : 0;
  const totalAllowed = included + overageCapSegments;
  const remaining = Math.max(0, included - used);
  const pct = included > 0 ? Math.round((used / included) * 100) : 0;
  const overageUsed = Math.max(0, used - included);
  const overageCostCents = overageUsed * overageCents;

  return {
    plan,
    included,
    used,
    remaining,
    pct,
    overageCents,
    overageCapCents,
    overageCapSegments,
    totalAllowed,
    overageUsed,
    overageCostCents,
    sendable: Math.max(0, totalAllowed - used),
    isOver80: included > 0 && pct >= SUBSCRIPTION.quotaAlertPct,
    isPaused: used >= totalAllowed,
    isTrial: false,
  };
}

/** Date de réinitialisation du quota (un mois calendaire après le début). */
export function quotaResetDate(start: Date): Date {
  const d = new Date(start);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/** La période de quota est-elle écoulée (→ remise à zéro) ? */
export function isQuotaPeriodElapsed(
  salon: { quotaPeriodStart: Date | null },
  now: Date,
): boolean {
  if (!salon.quotaPeriodStart) return false;
  return now >= quotaResetDate(salon.quotaPeriodStart);
}
