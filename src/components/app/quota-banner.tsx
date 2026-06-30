import Link from "next/link";
import { AlertTriangle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuotaStatus } from "@/lib/quota";

/**
 * Bannière d'alerte quota, affichée sur le dashboard et les relances quand le
 * salon approche (80 %) ou atteint son plafond. Rien sinon.
 */
export function QuotaBanner({ status }: { status: QuotaStatus }) {
  if (!status.isOver80 && !status.isPaused) return null;

  const paused = status.isPaused;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        paused
          ? "border-status-dormant/30 bg-status-dormant/10 text-status-dormant"
          : "border-status-at-risk/30 bg-status-at-risk/10 text-status-at-risk",
      )}
    >
      {paused ? (
        <PauseCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="flex-1">
        <p className="font-medium">
          {paused
            ? "Vos envois SMS sont en pause"
            : `Vous avez utilisé ${status.pct}% de votre quota SMS`}
        </p>
        <p className="mt-0.5 opacity-90">
          {paused
            ? `Plafond de dépassement atteint (${status.used} / ${status.totalAllowed} segments). Rechargez ou augmentez votre plafond pour reprendre les relances.`
            : `${status.used} / ${status.included} segments. Au-delà, les SMS sont facturés jusqu'à votre plafond, puis mis en pause.`}{" "}
          <Link href="/reglages/abonnement" className="font-medium underline">
            Gérer mon quota
          </Link>
        </p>
      </div>
    </div>
  );
}
