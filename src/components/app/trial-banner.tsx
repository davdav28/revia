import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { TrialStatus } from "@/lib/trial";

/**
 * Bandeau d'essai gratuit : progression vers les deux seuils (durée OU
 * objectif de CA récupéré) + segments offerts restants. Invite à choisir.
 * Affiché tant que le salon est en essai.
 */
export function TrialBanner({
  trial,
  segmentsLeft,
}: {
  trial: TrialStatus;
  segmentsLeft: number;
}) {
  if (!trial.isTrial) return null;

  if (trial.expired) {
    return (
      <div className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Votre essai gratuit est terminé</p>
          <p className="mt-0.5 opacity-90">
            {trial.expiredByGoal
              ? `Bravo — vous avez déjà récupéré ${formatCents(trial.recoveredCents)} ! `
              : ""}
            Choisissez une formule pour que Revia continue de relancer vos
            clients.{" "}
            <Link href="/reglages/abonnement" className="font-medium underline">
              Voir les formules
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-lacquer/25 bg-nude-soft/60 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
      <span className="bg-lacquer/10 text-lacquer-ink flex size-8 shrink-0 items-center justify-center rounded-md">
        <Gift className="size-4" />
      </span>
      <div className="flex-1">
        <p className="text-ink font-medium">
          Essai gratuit · {trial.daysLeft} jour{trial.daysLeft > 1 ? "s" : ""}{" "}
          restant{trial.daysLeft > 1 ? "s" : ""}
        </p>
        <p className="text-muted mt-0.5">
          Votre abonnement démarre automatiquement à la fin de l'essai —
          résiliable à tout moment. ·{" "}
          <span className="text-ink">{Math.max(0, segmentsLeft)}</span> segments
          SMS restants.{" "}
          <Link
            href="/reglages/abonnement"
            className="text-lacquer-ink font-medium hover:underline"
          >
            Gérer mon abonnement
          </Link>
        </p>
      </div>
    </div>
  );
}
