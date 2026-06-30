import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { QuotaStatus } from "@/lib/quota";

/** Jauge d'utilisation du quota SMS (inclus, dépassement, plafond). */
export function QuotaMeter({ status }: { status: QuotaStatus }) {
  const fill = Math.min(100, status.pct);
  const tone = status.isPaused
    ? "bg-status-dormant"
    : status.isOver80
      ? "bg-status-at-risk"
      : "bg-status-active";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink text-sm font-medium">SMS ce mois</span>
        <span className="tabular text-ink text-sm">
          {status.used} / {status.included} segments
        </span>
      </div>

      <div className="bg-nude-soft h-2.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${fill}%` }}
        />
      </div>

      <div className="text-muted flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          {status.isPaused
            ? "Plafond atteint — envois SMS en pause."
            : status.overageUsed > 0
              ? `${status.overageUsed} segment${status.overageUsed > 1 ? "s" : ""} en dépassement · ${formatCents(status.overageCostCents)}`
              : `${status.remaining} segment${status.remaining > 1 ? "s" : ""} restant${status.remaining > 1 ? "s" : ""} dans votre forfait`}
        </span>
        <span>
          Plafond de dépassement : {formatCents(status.overageCapCents)}
        </span>
      </div>
    </div>
  );
}
