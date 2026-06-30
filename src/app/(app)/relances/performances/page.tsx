import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trophy, FlaskConical } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getAbGroups } from "@/lib/reactivation/ab-stats";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Performance des messages" };

function pct(rate: number | null): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

export default async function PerformancesPage() {
  const member = await requireMember();
  const groups = await getAbGroups(member.salonId);
  const withData = groups.filter((g) => g.totalSent > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/relances"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux relances
      </Link>

      <PageHeader
        title="Performance des messages"
        description="Revia fait tourner les variantes d'un même scénario et mesure laquelle ramène le plus de clientes."
      />

      {withData.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Pas encore de données à comparer"
          description="Dès que vos relances partent, vous verrez ici, variante par variante, combien de clientes chaque message a fait revenir — et laquelle gagne."
        />
      ) : (
        <div className="space-y-5">
          {withData.map((g) => (
            <section
              key={g.key}
              className="border-line bg-surface overflow-hidden rounded-lg border"
            >
              <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-ink font-semibold">
                    {g.label}
                  </h2>
                  <span className="text-muted text-xs uppercase">
                    {g.channel}
                  </span>
                </div>
                {g.decided ? (
                  <span className="text-status-active inline-flex items-center gap-1 text-xs font-medium">
                    <Trophy className="size-3.5" />
                    Une variante se détache
                  </span>
                ) : (
                  <span className="text-muted text-xs">
                    Pas encore départagé
                  </span>
                )}
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-muted text-xs">
                    <th className="px-5 py-2 text-left font-medium">Variante</th>
                    <th className="px-3 py-2 text-right font-medium">Envoyés</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Réactivées
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Taux</th>
                    <th className="px-5 py-2 text-right font-medium">
                      CA récupéré
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.variants.map((v) => (
                    <tr
                      key={v.id}
                      className={cn(
                        "border-line border-t",
                        v.isLeader && "bg-status-active/[0.06]",
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-ink text-sm">{v.name}</span>
                          {v.isLeader ? (
                            <Badge tone="nude">
                              <Trophy className="mr-1 size-3" />
                              En tête
                            </Badge>
                          ) : null}
                          {!v.isActive ? (
                            <Badge tone="outline">Inactif</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="tabular text-ink px-3 py-3 text-right text-sm">
                        {v.sent}
                      </td>
                      <td className="tabular text-ink px-3 py-3 text-right text-sm">
                        {v.recovered}
                      </td>
                      <td
                        className={cn(
                          "tabular px-3 py-3 text-right text-sm font-semibold",
                          v.isLeader ? "text-status-active" : "text-ink",
                        )}
                      >
                        {pct(v.rate)}
                      </td>
                      <td className="tabular text-lacquer px-5 py-3 text-right text-sm font-semibold">
                        {formatCents(v.revenueCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          <p className="text-muted text-sm">
            Le « taux » = clientes revenues ÷ messages envoyés. Une variante est
            désignée « en tête » à partir de {5} envois, quand elle devance
            nettement les autres. Gardez la gagnante, réécrivez la perdante.
          </p>
        </div>
      )}
    </div>
  );
}
