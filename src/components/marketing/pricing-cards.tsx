"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { SUBSCRIPTION, type BillingPeriod, type PlanId } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Argumentaire court par formule (copie marketing, pas de la config métier). */
const BULLETS: Record<PlanId, string[]> = {
  essentiel: [
    "Détection des clientes dormantes",
    "Tous les scénarios de relance",
    "Dashboard de CA récupéré",
    "1 salon · 1 utilisateur",
  ],
  pro: [
    "Tout l'Essentiel, en plus large",
    "Jusqu'à 2 salons · 5 utilisateurs",
    "Dashboard consolidé multi-sites",
    "Import Planity · Treatwell · Fresha",
    "Support prioritaire",
  ],
  multi: [
    "Tout le Pro, sans limite",
    "3 salons et + · utilisateurs illimités",
    "Onboarding dédié (on installe tout avec vous)",
  ],
};

const CTA: Record<PlanId, { label: string; href: string }> = {
  essentiel: { label: "Commencer l'essai", href: "/signup" },
  pro: { label: "Commencer l'essai", href: "/signup" },
  multi: { label: "Parler à l'équipe", href: "mailto:contact@revia.app" },
};

export function PricingCards() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div className="space-y-8">
      {/* Bascule mensuel / annuel */}
      <div className="flex items-center justify-center gap-3">
        <div className="border-line bg-surface inline-flex rounded-full border p-0.5">
          {(["monthly", "annual"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink",
              )}
            >
              {p === "monthly" ? "Mensuel" : "Annuel"}
            </button>
          ))}
        </div>
        <span className="bg-nude-soft text-lacquer-ink rounded-full px-2.5 py-1 text-xs font-semibold">
          2 mois offerts
        </span>
      </div>

      {/* Cartes */}
      <div className="mx-auto grid max-w-md gap-5 md:max-w-none md:grid-cols-3 md:items-start">
        {SUBSCRIPTION.plans.map((plan) => {
          const annual = period === "annual";
          // En annuel, on affiche l'équivalent mensuel (facturé à l'année),
          // arrondi à l'euro pour un montant net.
          const perMonthCents = annual
            ? Math.round(plan.annualCents / 1200) * 100
            : plan.monthlyCents;
          const cta = CTA[plan.id];
          const external = cta.href.startsWith("mailto:");
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border p-7",
                plan.highlight
                  ? "bg-ink border-ink text-[var(--nude-soft)] shadow-[0_24px_50px_-22px_rgba(43,31,46,0.55)] md:-translate-y-2"
                  : "border-line bg-surface",
              )}
            >
              {plan.highlight ? (
                <span className="bg-lacquer mb-3 self-start rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide text-white uppercase">
                  Le plus choisi
                </span>
              ) : null}
              <h3
                className={cn(
                  "font-display text-xl font-semibold",
                  plan.highlight ? "text-white" : "text-ink",
                )}
              >
                {plan.label}
              </h3>
              <p
                className={cn(
                  "mt-1 min-h-[2.5rem] text-sm",
                  plan.highlight ? "text-[var(--nude)]" : "text-muted",
                )}
              >
                {plan.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "tabular font-display text-4xl font-semibold",
                    plan.highlight ? "text-white" : "text-ink",
                  )}
                >
                  {formatCents(perMonthCents)}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    plan.highlight ? "text-[var(--nude)]" : "text-muted",
                  )}
                >
                  / mois
                </span>
              </div>
              <p
                className={cn(
                  "min-h-[1.25rem] text-xs",
                  plan.highlight ? "text-[var(--nude)]" : "text-muted",
                )}
              >
                {annual
                  ? `Soit ${formatCents(plan.annualCents)} / an`
                  : "Sans engagement"}
              </p>

              <div
                className={cn(
                  "mt-5 rounded-lg px-4 py-3 text-sm",
                  plan.highlight ? "bg-white/[0.07]" : "bg-nude-soft",
                )}
              >
                <span
                  className={cn(
                    "font-display text-lg font-semibold",
                    plan.highlight ? "text-white" : "text-ink",
                  )}
                >
                  {plan.smsQuota.toLocaleString("fr-FR")}
                </span>{" "}
                SMS de relance / mois
                <div
                  className={cn(
                    "text-xs",
                    plan.highlight ? "text-[var(--nude)]" : "text-muted",
                  )}
                >
                  Emails illimités
                </div>
              </div>

              <ul className="mt-5 mb-6 flex flex-col gap-2.5">
                {BULLETS[plan.id].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="text-lacquer mt-0.5 size-4 shrink-0" />
                    <span className={plan.highlight ? "text-white" : "text-ink"}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlight ? "primary" : "secondary"}
                className="mt-auto w-full"
              >
                {external ? (
                  <a href={cta.href}>{cta.label}</a>
                ) : (
                  <Link href={cta.href}>{cta.label}</Link>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-muted mx-auto max-w-xl text-center text-sm">
        <span className="text-ink font-semibold">
          Gratuit jusqu'à{" "}
          {formatCents(SUBSCRIPTION.trial.recoveredEurosTarget * 100)} de chiffre
          d'affaires récupéré
        </span>
        , ou {SUBSCRIPTION.trial.days} jours d'essai — le premier des deux. Vous
        ne payez Revia que quand il vous a déjà rapporté.
      </p>
    </div>
  );
}
