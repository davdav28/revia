import { Check, Minus } from "lucide-react";
import { SUBSCRIPTION, type PlanId } from "@/config/brand";
import { formatCents, formatCentsPrecise } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Tableau comparatif des formules. Source unique de vérité : les lignes de
 * « volume » sont dérivées de `SUBSCRIPTION.plans` (config), les lignes de
 * fonctionnalités sont déclarées ici. Partagé entre la page publique /tarifs
 * et la page d'abonnement in-app.
 *
 * Une cellule vaut : `true` (✓), `false` (—), ou une chaîne (valeur affichée).
 */
type Cell = boolean | string;
type Row = { label: string; cells: [Cell, Cell, Cell]; note?: string };
type Group = { title: string; rows: Row[] };

const [essentiel, pro, multi] = SUBSCRIPTION.plans;

function salonsLabel(max: number | null): string {
  return max === null ? "3 et +" : String(max);
}
function usersLabel(max: number | null): string {
  return max === null ? "illimités" : String(max);
}

const GROUPS: Group[] = [
  {
    title: "Volume",
    rows: [
      {
        label: "SMS de relance inclus / mois",
        cells: [
          essentiel.smsQuota.toLocaleString("fr-FR"),
          pro.smsQuota.toLocaleString("fr-FR"),
          multi.smsQuota.toLocaleString("fr-FR"),
        ],
      },
      { label: "Emails", cells: ["illimités", "illimités", "illimités"] },
      {
        label: "Nombre de salons",
        cells: [
          salonsLabel(essentiel.maxSalons),
          salonsLabel(pro.maxSalons),
          salonsLabel(multi.maxSalons),
        ],
      },
      {
        label: "Comptes utilisateurs",
        cells: [
          usersLabel(essentiel.maxUsers),
          usersLabel(pro.maxUsers),
          usersLabel(multi.maxUsers),
        ],
      },
      {
        label: "SMS au-delà du quota",
        cells: [
          formatCentsPrecise(essentiel.overageCents),
          formatCentsPrecise(pro.overageCents),
          formatCentsPrecise(multi.overageCents),
        ],
      },
    ],
  },
  {
    title: "Accompagnement",
    rows: [
      {
        label: "Support",
        cells: [essentiel.support, pro.support, multi.support],
      },
      {
        label: "Onboarding dédié",
        cells: [
          essentiel.dedicatedOnboarding,
          pro.dedicatedOnboarding,
          multi.dedicatedOnboarding,
        ],
      },
    ],
  },
  {
    title: "Le cœur",
    rows: [
      { label: "Détection auto des dormantes", cells: [true, true, true] },
      { label: "Relance auto SMS + email", cells: [true, true, true] },
      { label: "Compteur de CA récupéré", cells: [true, true, true] },
      { label: "Modèles de messages éditables", cells: [true, true, true] },
      { label: "Import fichier clients (CSV)", cells: [true, true, true] },
      { label: "Agenda / saisie des visites", cells: [true, true, true] },
      { label: "Gestion opt-out / RGPD", cells: [true, true, true] },
    ],
  },
  {
    title: "Scénarios de relance",
    rows: [
      { label: "Rappel de cycle", cells: [true, true, true] },
      { label: "Dormante", cells: [true, true, true] },
      { label: "Anniversaire", cells: [true, true, true] },
      { label: "Remplissage de créneau creux", cells: [true, true, true] },
      { label: "Post-première-visite", cells: [true, true, true] },
      { label: "Saisonnier / événementiel", cells: [true, true, true] },
    ],
  },
  {
    title: "Profondeur",
    rows: [
      { label: "Segmentation avancée des clients", cells: [true, true, true] },
      { label: "A/B testing des messages", cells: [true, true, true] },
      { label: "Page de réservation en ligne", cells: [true, true, true] },
      {
        label: "Import agenda (Planity / Treatwell / Fresha)",
        cells: [true, true, true],
      },
      {
        label: "Dashboard avancé (rétention 90j, tendances)",
        cells: [true, true, true],
      },
      {
        label: "Dashboard consolidé multi-sites",
        cells: [
          essentiel.consolidatedMultiSite,
          pro.consolidatedMultiSite,
          multi.consolidatedMultiSite,
        ],
      },
    ],
  },
];

function CellContent({ value }: { value: Cell }) {
  if (value === true)
    return (
      <Check className="text-lacquer mx-auto size-4" aria-label="Inclus" />
    );
  if (value === false)
    return (
      <Minus className="text-line mx-auto size-4" aria-label="Non inclus" />
    );
  return <span className="tabular text-ink">{value}</span>;
}

const PLAN_IDS: PlanId[] = SUBSCRIPTION.plans.map((p) => p.id);

export function ComparisonMatrix() {
  return (
    <div className="border-line bg-surface overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr className="border-line border-b">
            <th className="text-muted px-4 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Fonctionnalité
            </th>
            {SUBSCRIPTION.plans.map((p) => (
              <th
                key={p.id}
                className={cn(
                  "px-3 py-4 text-center",
                  p.highlight && "bg-lacquer/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "font-display font-semibold",
                    p.highlight ? "text-lacquer-ink" : "text-ink",
                  )}
                >
                  {p.label}
                </span>
                <span className="text-muted block text-xs font-normal">
                  {formatCents(p.monthlyCents)}/mois
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((group) => (
            <GroupRows key={group.title} group={group} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({ group }: { group: Group }) {
  return (
    <>
      <tr>
        <td
          colSpan={1 + PLAN_IDS.length}
          className="bg-nude-soft text-muted px-4 py-2.5 text-xs font-semibold tracking-wider uppercase"
        >
          {group.title}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.label} className="border-line border-b last:border-0">
          <td className="text-ink px-4 py-3 text-sm">{row.label}</td>
          {row.cells.map((cell, i) => (
            <td
              key={i}
              className={cn(
                "px-3 py-3 text-center text-sm",
                SUBSCRIPTION.plans[i]?.highlight && "bg-lacquer/[0.04]",
              )}
            >
              <CellContent value={cell} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
