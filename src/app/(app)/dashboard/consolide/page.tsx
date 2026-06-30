import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { BRAND } from "@/config/brand";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { RecoveredCounter } from "@/components/brand/recovered-counter";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Tous mes salons" };

const DAY = 86_400_000;

export default async function ConsolidatedDashboardPage() {
  const member = await requireMember();
  // Le consolidé n'a de sens qu'avec plusieurs salons.
  if (member.salons.length <= 1) redirect("/dashboard");

  const ids = member.salons.map((s) => s.id);
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [rec30, recMonth, clientsByStatus] = await Promise.all([
    prisma.recovery.groupBy({
      by: ["salonId"],
      where: { salonId: { in: ids }, recoveredAt: { gte: last30 } },
      _sum: { recoveredAmountCents: true },
      _count: true,
    }),
    prisma.recovery.groupBy({
      by: ["salonId"],
      where: { salonId: { in: ids }, recoveredAt: { gte: monthStart } },
      _sum: { recoveredAmountCents: true },
    }),
    prisma.client.groupBy({
      by: ["salonId", "status"],
      where: { salonId: { in: ids } },
      _count: true,
    }),
  ]);

  const rows = member.salons.map((salon) => {
    const r30 = rec30.find((r) => r.salonId === salon.id);
    const rM = recMonth.find((r) => r.salonId === salon.id);
    const statuses = clientsByStatus.filter((c) => c.salonId === salon.id);
    const clients = statuses.reduce((n, c) => n + c._count, 0);
    const dormant =
      statuses.find((c) => c.status === "dormant")?._count ?? 0;
    return {
      id: salon.id,
      name: salon.name,
      isActive: salon.id === member.salonId,
      recovered30Cents: r30?._sum.recoveredAmountCents ?? 0,
      reactivations30: r30?._count ?? 0,
      recoveredMonthCents: rM?._sum.recoveredAmountCents ?? 0,
      clients,
      dormant,
    };
  });

  const totalRecovered30 = rows.reduce((n, r) => n + r.recovered30Cents, 0);
  const totalReactivations30 = rows.reduce((n, r) => n + r.reactivations30, 0);
  const totalDormant = rows.reduce((n, r) => n + r.dormant, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href="/dashboard"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Tableau de bord du salon
      </Link>

      <PageHeader
        title="Tous mes salons"
        description={`Vue d'ensemble de vos ${rows.length} salons.`}
      />

      {/* Hero consolidé */}
      <div className="border-line bg-surface rounded-xl border p-8 shadow-[var(--shadow-card)]">
        <div className="text-muted flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="text-lacquer-ink size-4" />
          CA récupéré · tous salons · 30 derniers jours
        </div>
        <div className="mt-3">
          <RecoveredCounter
            amount={Math.round(totalRecovered30 / 100)}
            className="text-6xl sm:text-7xl"
          />
        </div>
        <p className="text-muted mt-4 max-w-2xl">
          {totalReactivations30} cliente{totalReactivations30 > 1 ? "s" : ""}{" "}
          réactivée{totalReactivations30 > 1 ? "s" : ""} sur 30 jours, tous
          salons confondus · {totalDormant} encore à relancer.
        </p>
      </div>

      {/* Détail par salon */}
      <div className="border-line bg-surface overflow-x-auto rounded-lg border shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-line border-b">
              <th className="text-muted px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                Salon
              </th>
              <th className="text-muted px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                CA récupéré · 30 j
              </th>
              <th className="text-muted px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                Réactivées · 30 j
              </th>
              <th className="text-muted px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                À relancer
              </th>
              <th className="text-muted px-5 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                Clientes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-line border-b last:border-0">
                <td className="px-5 py-3">
                  <span className="text-ink text-sm font-medium">
                    {r.name}
                  </span>
                  {r.isActive ? (
                    <span className="text-lacquer-ink ml-2 text-xs">
                      · salon actif
                    </span>
                  ) : null}
                </td>
                <td className="tabular text-lacquer px-4 py-3 text-right text-sm font-semibold">
                  {formatCents(r.recovered30Cents)}
                </td>
                <td className="tabular text-ink px-4 py-3 text-right text-sm">
                  {r.reactivations30}
                </td>
                <td className="tabular text-ink px-4 py-3 text-right text-sm">
                  {r.dormant}
                </td>
                <td className="tabular text-ink px-5 py-3 text-right text-sm">
                  {r.clients}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-nude-soft/50">
              <td className="text-ink px-5 py-3 text-sm font-semibold">
                Total
              </td>
              <td className="tabular text-lacquer px-4 py-3 text-right text-sm font-semibold">
                {formatCents(totalRecovered30)}
              </td>
              <td className="tabular text-ink px-4 py-3 text-right text-sm font-semibold">
                {totalReactivations30}
              </td>
              <td className="tabular text-ink px-4 py-3 text-right text-sm font-semibold">
                {totalDormant}
              </td>
              <td className="tabular text-ink px-5 py-3 text-right text-sm font-semibold">
                {rows.reduce((n, r) => n + r.clients, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-muted text-sm">
        Astuce : utilisez le sélecteur de salon en haut pour basculer et gérer
        chaque salon en détail. {BRAND.name} garde vos données séparées par
        salon.
      </p>
    </div>
  );
}
