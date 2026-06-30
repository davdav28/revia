"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION, type BillingPeriod } from "@/config/brand";
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
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  function subscribe(planId: string) {
    startTransition(async () => {
      const res = await startCheckout(planId, period);
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
    <div className="space-y-5">
      {/* Bascule mensuel / annuel */}
      <div className="flex justify-center">
        <div className="border-line bg-surface inline-flex rounded-md border p-0.5">
          {(["monthly", "annual"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded px-4 py-1.5 text-sm font-medium transition-colors",
                period === p ? "bg-nude-soft text-ink" : "text-muted",
              )}
            >
              {p === "monthly" ? "Mensuel" : "Annuel"}
              {p === "annual" ? (
                <span className="text-lacquer-ink ml-1.5 text-xs">
                  2 mois offerts
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SUBSCRIPTION.plans.map((plan) => {
          const current = isActive && currentPlan === plan.id;
          const cents =
            period === "annual" ? plan.annualCents : plan.monthlyCents;
          return (
            <div
              key={plan.id}
              className={cn(
                "bg-surface flex flex-col rounded-lg border p-5",
                plan.highlight
                  ? "border-lacquer ring-lacquer/30 ring-1"
                  : "border-line",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-ink font-semibold">
                  {plan.label}
                </span>
                {plan.highlight ? (
                  <span className="bg-lacquer rounded-full px-2 py-0.5 text-xs font-medium text-[var(--base)]">
                    Recommandé
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <span className="tabular text-ink text-3xl font-semibold">
                  {formatCents(cents)}
                </span>
                <span className="text-muted text-sm">
                  {" "}
                  / {period === "annual" ? "an" : "mois"}
                </span>
              </div>
              <p className="text-muted mt-2 text-sm">
                <span className="tabular text-ink font-medium">
                  {plan.smsQuota}
                </span>{" "}
                SMS inclus / mois
              </p>
              <p className="text-muted text-xs">Emails illimités</p>
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
                  "Choisir"
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
