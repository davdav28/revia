import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import {
  isSubscriptionActive,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/subscription";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { SubscribeButtons } from "@/components/app/subscribe-buttons";
import { ComparisonMatrix } from "@/components/marketing/comparison-matrix";
import { QuotaMeter } from "@/components/app/quota-meter";
import { OverageCapForm } from "@/components/app/overage-cap-form";
import { formatDate } from "@/lib/dates";
import { formatCentsPrecise } from "@/lib/money";
import { getPlan } from "@/config/brand";
import { getQuotaStatus } from "@/lib/quota";

export const metadata: Metadata = { title: "Abonnement" };

export default async function AbonnementPage() {
  const member = await requireMember();
  const salon = member.salon;
  const active = isSubscriptionActive(salon.subscriptionStatus);
  const stripeOn = isStripeConfigured();
  const plan = getPlan(salon.plan);
  const quota = getQuotaStatus(salon);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/reglages"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux réglages
      </Link>

      <PageHeader
        title="Abonnement"
        description="Revia se rentabilise dès la première cliente récupérée."
      />

      {!stripeOn ? (
        <p className="border-status-at-risk/30 bg-status-at-risk/10 text-status-at-risk rounded-md border px-3 py-2 text-sm">
          Mode démonstration : le paiement est simulé (aucune carte requise).
          Ajoutez vos clés Stripe pour facturer pour de vrai.
        </p>
      ) : null}

      <div className="border-line bg-surface rounded-lg border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted text-sm">Statut</p>
            <p className="font-display text-ink mt-0.5 font-semibold">
              {SUBSCRIPTION_STATUS_LABEL[salon.subscriptionStatus] ??
                salon.subscriptionStatus}
              {plan ? ` · ${plan.label}` : ""}
            </p>
          </div>
          <Badge
            dotColor={active ? "var(--status-active)" : "var(--status-dormant)"}
          >
            {active ? "Relances actives" : "Relances en pause"}
          </Badge>
        </div>
        {plan ? (
          <div className="mt-4 space-y-4">
            <QuotaMeter status={quota} />
            <div className="border-line border-t pt-4">
              <OverageCapForm currentCents={salon.overageCapCents} />
              <p className="text-muted mt-2 text-xs">
                Au-delà de votre forfait, chaque SMS coûte{" "}
                {formatCentsPrecise(quota.overageCents)} ; une fois le
                plafond atteint, les envois se mettent en pause.
              </p>
            </div>
          </div>
        ) : null}
        {salon.currentPeriodEnd ? (
          <p className="text-muted mt-2 text-sm">
            {salon.subscriptionStatus === "canceled"
              ? "Accès jusqu'au "
              : "Prochaine échéance le "}
            {formatDate(salon.currentPeriodEnd)}.
          </p>
        ) : null}
        {!active ? (
          <p className="text-status-dormant mt-2 text-sm">
            Sans abonnement actif, les relances ne sont plus envoyées.
            Choisissez une formule pour les relancer.
          </p>
        ) : null}
      </div>

      <SubscribeButtons
        currentPlan={salon.plan}
        isActive={active}
        stripeConfigured={stripeOn}
      />

      <section className="space-y-3 pt-2">
        <h2 className="font-display text-ink text-lg font-semibold">
          Comparer les formules
        </h2>
        <ComparisonMatrix />
      </section>
    </div>
  );
}
