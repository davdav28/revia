import type { Metadata } from "next";
import Link from "next/link";
import { Upload, Users, TrendingUp } from "lucide-react";
import { BRAND, getPlan, HIGHLIGHTED_PLAN_ID } from "@/config/brand";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { RecoveredCounter } from "@/components/brand/recovered-counter";
import { RecoveryChart } from "@/components/app/recovery-chart";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Tableau de bord" };

const DAY = 86_400_000;

function Num({ value }: { value: string | number }) {
  return (
    <span className="tabular text-ink text-3xl font-semibold">{value}</span>
  );
}

export default async function DashboardPage() {
  const member = await requireMember();
  const salonId = member.salonId;
  const firstName = member.name?.split(" ")[0];

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyAgo = new Date(now.getTime() - 90 * DAY);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    total,
    dormant,
    atRisk,
    rec30,
    recMonth,
    messaged30,
    recosForChart,
    recentRecos,
    matureCount,
  ] = await Promise.all([
    prisma.client.count({ where: { salonId } }),
    prisma.client.count({ where: { salonId, status: "dormant" } }),
    prisma.client.count({ where: { salonId, status: "at_risk" } }),
    prisma.recovery.aggregate({
      where: { salonId, recoveredAt: { gte: last30 } },
      _sum: { recoveredAmountCents: true },
      _count: true,
    }),
    prisma.recovery.aggregate({
      where: { salonId, recoveredAt: { gte: monthStart } },
      _sum: { recoveredAmountCents: true },
    }),
    prisma.message.findMany({
      where: {
        salonId,
        status: { in: ["sent", "delivered"] },
        sentAt: { gte: last30 },
      },
      select: { clientId: true },
      distinct: ["clientId"],
    }),
    prisma.recovery.findMany({
      where: { salonId, recoveredAt: { gte: sixMonthsStart } },
      select: { recoveredAt: true, recoveredAmountCents: true },
    }),
    prisma.recovery.findMany({
      where: { salonId },
      orderBy: { recoveredAt: "desc" },
      take: 6,
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.recovery.count({
      where: { salonId, recoveredAt: { lte: ninetyAgo } },
    }),
  ]);

  if (total === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader
            title="Tableau de bord"
            description={`Voici l'activité de ${member.salon.name}.`}
          />
          {member.salons.length > 1 ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href="/dashboard/consolide">
                <TrendingUp className="size-4" />
                Tous mes salons
              </Link>
            </Button>
          ) : null}
        </div>
        <EmptyState
          icon={Users}
          title="Votre tableau de bord prend vie avec vos clientes"
          description={`Importez votre fichier clientes : ${BRAND.name} pourra repérer celles qui ne reviennent plus et calculer le chiffre d'affaires récupéré.`}
          action={
            <Button asChild>
              <Link href="/clientes/import">
                <Upload className="size-4" />
                Importer mes clientes
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  // KPIs dérivés
  const recovered30Cents = rec30._sum.recoveredAmountCents ?? 0;
  const recoveredMonthCents = recMonth._sum.recoveredAmountCents ?? 0;
  const reactivations30 = rec30._count;
  const messagedCount = messaged30.length;
  const reactivationRate =
    messagedCount > 0
      ? Math.round((reactivations30 / messagedCount) * 100)
      : null;
  // Référence de prix pour le ROI : le plan du salon, sinon le plan mis en avant.
  const refMonthlyCents =
    getPlan(member.salon.plan)?.monthlyCents ??
    getPlan(HIGHLIGHTED_PLAN_ID)!.monthlyCents;
  const roi = recoveredMonthCents / refMonthlyCents;

  // Rétention durable (réactivations matures de +90 j encore actives ensuite).
  // Batché : 2 requêtes au lieu de 1 + N.
  let retentionPct: number | null = null;
  if (matureCount > 0) {
    const matured = await prisma.recovery.findMany({
      where: { salonId, recoveredAt: { lte: ninetyAgo } },
      select: { clientId: true, recoveredAt: true },
    });
    const maturedAppts = await prisma.appointment.findMany({
      where: {
        salonId,
        status: "completed",
        clientId: { in: [...new Set(matured.map((m) => m.clientId))] },
      },
      select: { clientId: true, startAt: true },
    });
    const retained = matured.filter((m) => {
      const threshold = m.recoveredAt.getTime() + 30 * DAY;
      return maturedAppts.some(
        (a) => a.clientId === m.clientId && a.startAt.getTime() > threshold,
      );
    }).length;
    retentionPct = Math.round((retained / matureCount) * 100);
  }

  // Buckets mensuels pour le graphe (6 derniers mois)
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
      amountCents: 0,
    };
  });
  for (const r of recosForChart) {
    const b = buckets.find(
      (x) =>
        x.year === r.recoveredAt.getFullYear() &&
        x.month === r.recoveredAt.getMonth(),
    );
    if (b) b.amountCents += r.recoveredAmountCents;
  }

  // « après X semaines » : écart depuis la visite précédente.
  // Batché : 1 requête pour toutes les réactivations récentes au lieu de N.
  const recentApptsByClient = recentRecos.length
    ? await prisma.appointment.findMany({
        where: {
          salonId,
          status: "completed",
          clientId: { in: [...new Set(recentRecos.map((r) => r.clientId))] },
        },
        select: { clientId: true, startAt: true },
      })
    : [];
  const recentWithGap = recentRecos.map((r) => {
    const prev = recentApptsByClient.reduce<Date | null>((max, a) => {
      if (a.clientId !== r.clientId || a.startAt >= r.recoveredAt) return max;
      return !max || a.startAt > max ? a.startAt : max;
    }, null);
    const weeks = prev
      ? Math.max(
          1,
          Math.round((r.recoveredAt.getTime() - prev.getTime()) / (7 * DAY)),
        )
      : null;
    return { ...r, weeks };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Tableau de bord"
          description={
            firstName
              ? `Bonjour ${firstName}, voici ce que ${BRAND.name} vous rapporte.`
              : `Voici ce que ${BRAND.name} vous rapporte.`
          }
        />
        {member.salons.length > 1 ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href="/dashboard/consolide">
              <TrendingUp className="size-4" />
              Tous mes salons
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Hero — le compteur signature */}
      <div className="border-line bg-surface rounded-xl border p-8 shadow-[var(--shadow-card)]">
        <div className="text-muted flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="text-lacquer-ink size-4" />
          CA récupéré · 30 derniers jours
        </div>
        <div className="mt-3">
          <RecoveredCounter
            amount={Math.round(recovered30Cents / 100)}
            className="text-6xl sm:text-7xl"
          />
        </div>
        <p className="text-muted mt-4 max-w-2xl">
          {recoveredMonthCents > 0
            ? `Ce mois-ci, ${BRAND.name} vous a rapporté ${formatCents(recoveredMonthCents)} pour ${formatCents(refMonthlyCents)} d'abonnement — soit ${roi.toFixed(1)}× votre investissement.`
            : `Activez vos relances : dès qu'une cliente relancée revient, son chiffre d'affaires s'affiche ici.`}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clientes réactivées · 30 j"
          value={<Num value={reactivations30} />}
        />
        <StatCard
          label="Taux de réactivation"
          value={
            <Num
              value={reactivationRate != null ? `${reactivationRate}%` : "—"}
            />
          }
          hint={
            messagedCount > 0
              ? `${reactivations30}/${messagedCount} relancées revenues`
              : "Aucune relance sur 30 j"
          }
        />
        <StatCard
          label="Rétention à 90 j"
          value={
            <Num value={retentionPct != null ? `${retentionPct}%` : "—"} />
          }
          hint={
            matureCount > 0
              ? "Réactivées encore actives"
              : "Pas encore mesurable"
          }
        />
        <Link href="/clientes?status=dormant" className="block">
          <StatCard
            label="Encore à relancer"
            value={<Num value={dormant} />}
            hint={`+ ${atRisk} à surveiller`}
            className="hover:bg-nude-soft/40 transition-colors"
          />
        </Link>
      </div>

      {/* Graphe */}
      <div className="border-line bg-surface rounded-lg border p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-ink font-semibold">
          Évolution du CA récupéré
        </h2>
        <p className="text-muted mb-6 text-sm">Sur les 6 derniers mois.</p>
        <RecoveryChart
          data={buckets.map((b) => ({
            label: b.label,
            amountCents: b.amountCents,
          }))}
        />
      </div>

      {/* Dernières réactivations */}
      <div className="border-line bg-surface rounded-lg border p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-ink font-semibold">
          Dernières réactivations
        </h2>
        {recentWithGap.length === 0 ? (
          <p className="text-muted mt-2 text-sm">
            Aucune réactivation pour l'instant. Activez vos relances depuis
            l'onglet Relances.
          </p>
        ) : (
          <ul className="divide-line mt-4 divide-y">
            {recentWithGap.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="text-ink text-sm">
                  <span className="font-medium">
                    {r.client.firstName} {r.client.lastName?.[0] ?? ""}
                    {r.client.lastName ? "." : ""}
                  </span>{" "}
                  <span className="text-muted">
                    — revenue le {formatDate(r.recoveredAt)}
                    {r.weeks ? ` après ${r.weeks} semaines` : ""}
                  </span>
                </div>
                <span className="tabular text-lacquer font-semibold">
                  {formatCents(r.recoveredAmountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
