"use client";

import { useId, useState } from "react";
import { SUBSCRIPTION, HIGHLIGHTED_PLAN_ID, type PlanId } from "@/config/brand";
import { formatCents, formatCentsPrecise } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Simulateur de dépassement : le salon choisit une formule et fait glisser le
 * nombre de SMS supplémentaires pour voir, sans surprise, ce qu'il paierait.
 * Tout est dérivé de la config (prix, quota, tarif de dépassement par plan).
 */
const MAX_EXTRA = 600;
const STEP = 10;

export function OverageSimulator() {
  const [planId, setPlanId] = useState<PlanId>(HIGHLIGHTED_PLAN_ID);
  const [extra, setExtra] = useState(0);
  const rangeId = useId();

  const plan = SUBSCRIPTION.plans.find((p) => p.id === planId)!;
  const overCost = extra * plan.overageCents; // centimes
  const total = plan.monthlyCents + overCost;

  return (
    <div className="bg-ink rounded-xl p-7 text-[var(--nude-soft)] shadow-[0_24px_50px_-24px_rgba(43,31,46,0.5)] sm:p-9">
      <h2 className="font-display text-2xl font-semibold text-white">
        Et si je dépasse mon quota ?
      </h2>
      <p className="mt-1.5 text-sm text-[var(--nude)]">
        Aucune surprise. Voyez exactement ce que vous paieriez avec des SMS en
        plus — et ce que ça vous rapporte en face.
      </p>

      {/* Choix de la formule */}
      <div
        role="group"
        aria-label="Choisir une formule"
        className="mt-6 flex flex-wrap gap-2"
      >
        {SUBSCRIPTION.plans.map((p) => {
          const selected = p.id === planId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPlanId(p.id)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2.5 text-center text-sm font-semibold transition-colors",
                selected
                  ? "border-lacquer bg-lacquer/15 text-white"
                  : "border-white/15 text-[var(--nude-soft)] hover:border-white/30",
              )}
            >
              {p.label}
              <span className="mt-0.5 block text-xs font-normal text-[var(--nude)]">
                {formatCents(p.monthlyCents)} · {p.smsQuota} SMS
              </span>
            </button>
          );
        })}
      </div>

      {/* Curseur */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor={rangeId} className="text-sm text-[var(--nude)]">
            SMS supplémentaires ce mois
          </label>
          <span className="tabular font-display text-xl font-semibold text-white">
            {extra}
          </span>
        </div>
        <input
          id={rangeId}
          type="range"
          min={0}
          max={MAX_EXTRA}
          step={STEP}
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="accent-lacquer h-1.5 w-full cursor-pointer"
        />
      </div>

      {/* Détail */}
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-6">
        <div className="text-sm leading-loose text-[var(--nude)]">
          <div>
            Abonnement{" "}
            <span className="tabular text-white">
              {formatCents(plan.monthlyCents)}
            </span>
          </div>
          <div>
            SMS en plus{" "}
            <span className="tabular text-white">
              {extra} × {formatCentsPrecise(plan.overageCents)} ={" "}
              {formatCents(overCost)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs tracking-wider text-[var(--nude)] uppercase">
            Total ce mois
          </div>
          <div className="tabular font-display text-4xl font-semibold text-white">
            {formatCents(total)}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--nude)]">
        Vous fixez un <span className="text-white">plafond de dépassement</span>{" "}
        : au-delà, les envois se mettent en pause plutôt que de gonfler la
        facture.
      </p>
    </div>
  );
}
