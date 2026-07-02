import type { Metadata } from "next";
import Link from "next/link";
import { Users, CreditCard, Inbox, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, type BillingPeriod } from "@/config/brand";
import { METIER_OPTIONS } from "@/lib/metiers";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/subscription";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/app/page-header";
import { TrendChart } from "@/components/admin/trend-chart";

export const metadata: Metadata = { title: "Espace fondateur" };

const METIER_LABEL: Record<string, string> = Object.fromEntries(
  METIER_OPTIONS.map((m) => [m.id, m.label]),
);

function mrrCents(plan: string | null, period: string | null): number {
  const p = getPlan(plan);
  if (!p) return 0;
  return period === "annual" ? Math.round(p.annualCents / 12) : p.monthlyCents;
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="border-line bg-surface rounded-xl border p-5">
      <div className="text-muted text-sm">{label}</div>
      <div
        className={`tabular mt-1 text-3xl font-bold ${accent ? "text-lacquer-ink" : "text-ink"}`}
      >
        {value}
      </div>
      {sub ? <div className="text-muted/80 mt-0.5 text-xs">{sub}</div> : null}
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="border-line bg-surface rounded-xl border p-5">
      <h3 className="text-ink text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted text-sm">Aucune donnée.</p>
        ) : (
          rows.map((r) => {
            const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
            return (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink">{r.label}</span>
                  <span className="text-muted tabular">
                    {r.count} · {pct}%
                  </span>
                </div>
                <div className="bg-nude-soft h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-lacquer/70 h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ToolCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="border-line bg-surface hover:bg-nude-soft/40 flex items-center gap-4 rounded-xl border p-5 transition-colors">
        <div className="bg-nude-soft text-lacquer-ink flex size-10 items-center justify-center rounded-md">
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <div className="text-ink font-medium">{title}</div>
          <div className="text-muted text-sm">{desc}</div>
        </div>
        <ChevronRight className="text-muted size-5" />
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const [salons, recovAgg, smsAgg, clientCount, prospectCount, recent] =
    await Promise.all([
      prisma.salon.findMany({
        select: {
          subscriptionStatus: true,
          plan: true,
          billingPeriod: true,
          metier: true,
        },
      }),
      prisma.recovery.aggregate({ _sum: { recoveredAmountCents: true } }),
      prisma.message.aggregate({
        where: { channel: "sms", status: "sent" },
        _sum: { segments: true },
      }),
      prisma.client.count(),
      prisma.contactMessage.count(),
      prisma.salon.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          metier: true,
          subscriptionStatus: true,
          createdAt: true,
          memberships: {
            where: { role: "owner" },
            take: 1,
            select: { user: { select: { email: true } } },
          },
        },
      }),
    ]);

  const total = salons.length;
  const active = salons.filter((s) => s.subscriptionStatus === "active").length;
  const trial = salons.filter((s) => s.subscriptionStatus === "trial").length;
  const mrr = salons
    .filter((s) => s.subscriptionStatus === "active")
    .reduce((sum, s) => sum + mrrCents(s.plan, s.billingPeriod), 0);
  const recoveredTotal = recovAgg._sum.recoveredAmountCents ?? 0;
  const smsSent = smsAgg._sum.segments ?? 0;
  const activationRate = total > 0 ? Math.round((active / total) * 100) : 0;

  // Répartitions
  const statusCounts = new Map<string, number>();
  const metierCounts = new Map<string, number>();
  for (const s of salons) {
    statusCounts.set(
      s.subscriptionStatus,
      (statusCounts.get(s.subscriptionStatus) ?? 0) + 1,
    );
    metierCounts.set(s.metier, (metierCounts.get(s.metier) ?? 0) + 1);
  }
  const statusRows = [...statusCounts.entries()]
    .map(([k, count]) => ({
      label: SUBSCRIPTION_STATUS_LABEL[k] ?? k,
      count,
    }))
    .sort((a, b) => b.count - a.count);
  const metierRows = [...metierCounts.entries()]
    .map(([k, count]) => ({ label: METIER_LABEL[k] ?? k, count }))
    .sort((a, b) => b.count - a.count);

  // Tendances des 6 derniers mois (dérivées des dates existantes).
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, k) => {
    const i = 5 - k;
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    return {
      start,
      end,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(start),
    };
  });
  const trend = await Promise.all(
    months.map(async (m) => {
      const [signups, rec, sms] = await Promise.all([
        prisma.salon.count({
          where: { createdAt: { gte: m.start, lt: m.end } },
        }),
        prisma.recovery.aggregate({
          where: { recoveredAt: { gte: m.start, lt: m.end } },
          _sum: { recoveredAmountCents: true },
        }),
        prisma.message.aggregate({
          where: { channel: "sms", createdAt: { gte: m.start, lt: m.end } },
          _sum: { segments: true },
        }),
      ]);
      return {
        label: m.label,
        signups,
        recovered: rec._sum.recoveredAmountCents ?? 0,
        sms: sms._sum.segments ?? 0,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Espace fondateur"
        description="Vue d'ensemble de Revia — réservé à toi."
      />

      {/* KPIs business */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Salons" value={String(total)} sub="clients de Revia" />
        <Kpi
          label="Actifs (payants)"
          value={String(active)}
          sub={`${activationRate}% d'activation`}
          accent
        />
        <Kpi label="En essai" value={String(trial)} />
        <Kpi label="MRR estimé" value={formatCents(mrr)} sub="par mois" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="CA récupéré généré"
          value={formatCents(recoveredTotal)}
          sub="valeur délivrée aux salons"
          accent
        />
        <Kpi label="SMS envoyés" value={smsSent.toLocaleString("fr-FR")} />
        <Kpi
          label="Clients gérés"
          value={clientCount.toLocaleString("fr-FR")}
        />
        <Kpi label="Prospects" value={String(prospectCount)} sub="via /contact" />
      </div>

      {/* Répartitions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Répartition par statut d'abonnement"
          rows={statusRows}
          total={total}
        />
        <Breakdown title="Répartition par métier" rows={metierRows} total={total} />
      </div>

      {/* Tendances */}
      <div>
        <h2 className="text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
          Tendances · 6 derniers mois
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <TrendChart
            title="Inscriptions / mois"
            points={trend.map((t) => ({ label: t.label, value: t.signups }))}
            format={(n) => String(n)}
          />
          <TrendChart
            title="CA récupéré / mois"
            points={trend.map((t) => ({ label: t.label, value: t.recovered }))}
            format={formatCents}
          />
          <TrendChart
            title="SMS envoyés / mois"
            points={trend.map((t) => ({ label: t.label, value: t.sms }))}
            format={(n) => n.toLocaleString("fr-FR")}
          />
        </div>
      </div>

      {/* Derniers inscrits */}
      <div className="border-line bg-surface overflow-hidden rounded-xl border">
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-ink text-sm font-semibold">Derniers inscrits</h3>
          <Link
            href="/admin/clients"
            className="text-lacquer-ink text-xs font-medium hover:underline"
          >
            Voir tous les clients
          </Link>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-line border-b last:border-0">
                <td className="text-ink px-5 py-3 font-medium">{s.name}</td>
                <td className="text-muted px-5 py-3">
                  {METIER_LABEL[s.metier] ?? s.metier}
                </td>
                <td className="text-muted hidden px-5 py-3 sm:table-cell">
                  {s.memberships[0]?.user.email ?? "—"}
                </td>
                <td className="text-muted px-5 py-3">
                  {SUBSCRIPTION_STATUS_LABEL[s.subscriptionStatus] ??
                    s.subscriptionStatus}
                </td>
                <td className="text-muted px-5 py-3 text-right">
                  {formatDate(s.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Outils */}
      <div>
        <h2 className="text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
          Outils
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            href="/admin/clients"
            icon={Users}
            title="Tous mes clients"
            desc="Statut, plan, usage, CA récupéré"
          />
          <ToolCard
            href="/admin/contacts"
            icon={Inbox}
            title="Prospects & contacts"
            desc="Messages reçus via /contact"
          />
          <ToolCard
            href="/admin/pricing"
            icon={CreditCard}
            title="Abonnement Multi sur-mesure"
            desc="Générer un lien de paiement négocié"
          />
        </div>
      </div>
    </div>
  );
}
