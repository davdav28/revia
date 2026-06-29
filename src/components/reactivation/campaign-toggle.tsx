"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleCampaign } from "@/server/reactivation";

export function CampaignToggle({
  campaignId,
  active,
}: {
  campaignId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Réponse instantanée : on affiche l'état cible pendant l'aller-retour serveur.
  const shown = isPending ? !active : active;

  function toggle() {
    startTransition(async () => {
      await toggleCampaign(campaignId, !active);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label={active ? "Désactiver la campagne" : "Activer la campagne"}
      disabled={isPending}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        shown ? "bg-lacquer" : "bg-line",
      )}
    >
      <span
        className={cn(
          "bg-surface inline-block size-5 rounded-full shadow transition-transform",
          shown ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
