import type { Salon } from "@prisma/client";
import { getPlan, HIGHLIGHTED_PLAN_ID, SUBSCRIPTION, type Plan } from "@/config/brand";

/** Champs de `Salon` nécessaires au calcul du quota (sous-ensemble). */
export type QuotaSalon = Pick<
  Salon,
  | "plan"
  | "smsUsedThisPeriod"
  | "rechargeSegments"
  | "overageCapCents"
  | "quotaPeriodStart"
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
};

/** État du quota SMS d'un salon pour la période en cours. */
export function getQuotaStatus(salon: QuotaSalon): QuotaStatus {
  const plan = getPlan(salon.plan) ?? getPlan(HIGHLIGHTED_PLAN_ID)!;
  const included = plan.smsQuota + (salon.rechargeSegments ?? 0);
  const used = salon.smsUsedThisPeriod ?? 0;
  const overageCents = plan.overageCents;
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
