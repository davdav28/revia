"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION } from "@/config/brand";
import {
  startCheckout,
  openBillingPortal,
  cancelSubscriptionDev,
} from "@/server/subscription";

export function SubscribeButtons({
  currentPlan,
  isActive,
  stripeConfigured,
}: {
  currentPlan: string | null;
  isActive: boolean;
  stripeConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function subscribe(planId: string) {
    startTransition(async () => {
      const res = await startCheckout(planId);
      if ("url" in res) {
        window.location.href = res.url;
      } else if ("ok" in res) {
        toast.success("Abonnement activé (démo).");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function manage() {
    startTransition(async () => {
      const res = await openBillingPortal();
      if ("url" in res) window.location.href = res.url;
      else if ("error" in res) toast.error(res.error);
    });
  }

  function cancelDev() {
    if (!window.confirm("Résilier l'abonnement (démo) ?")) return;
    startTransition(async () => {
      await cancelSubscriptionDev();
      toast.success("Abonnement résilié (démo).");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {SUBSCRIPTION.plans.map((plan) => {
          const current = isActive && currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "bg-surface rounded-lg border p-5",
                plan.highlight ? "border-lacquer" : "border-line",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-ink font-semibold">
                  {plan.label}
                </span>
                {plan.highlight ? (
                  <span className="bg-lacquer rounded-full px-2 py-0.5 text-xs font-medium text-[var(--base)]">
                    {plan.note}
                  </span>
                ) : (
                  <span className="text-muted text-xs">{plan.note}</span>
                )}
              </div>
              <div className="mt-3">
                <span className="tabular text-ink text-3xl font-semibold">
                  {formatCents(plan.priceCents)}
                </span>
                <span className="text-muted text-sm"> / {plan.period}</span>
              </div>
              <Button
                className="mt-4 w-full"
                variant={plan.highlight ? "primary" : "secondary"}
                disabled={isPending || current}
                onClick={() => subscribe(plan.id)}
              >
                {current ? (
                  <>
                    <Check className="size-4" />
                    Plan actuel
                  </>
                ) : (
                  "S'abonner"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {isActive ? (
        <div className="flex flex-wrap gap-2">
          {stripeConfigured ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={manage}
              disabled={isPending}
            >
              Gérer mon abonnement
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelDev}
              disabled={isPending}
              className="text-status-dormant hover:bg-status-dormant/10"
            >
              Résilier (démo)
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
