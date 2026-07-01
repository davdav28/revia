import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/config/brand";
import { METIER_OPTIONS } from "@/lib/metiers";
import { PageHeader } from "@/components/app/page-header";
import { AdminClientsTable, type AdminSalonRow } from "@/components/admin/clients-table";

export const metadata: Metadata = { title: "Tous mes clients" };

const METIER_LABEL: Record<string, string> = Object.fromEntries(
  METIER_OPTIONS.map((m) => [m.id, m.label]),
);

/** Loyer mensuel estimé d'un salon actif (mensualisé), en centimes. */
function estimatedMrrCents(
  plan: string | null,
  period: string | null,
): number {
  const p = getPlan(plan);
  if (!p) return 0;
  return period === "annual"
    ? Math.round(p.annualCents / 12)
    : p.monthlyCents;
}

export default async function AdminClientsPage() {
  await requireAdmin();

  const [salons, recoveries] = await Promise.all([
    prisma.salon.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        metier: true,
        plan: true,
        billingPeriod: true,
        subscriptionStatus: true,
        smsUsedThisPeriod: true,
        createdAt: true,
        _count: { select: { clients: true } },
        memberships: {
          where: { role: "owner" },
          take: 1,
          select: { user: { select: { email: true } } },
        },
      },
    }),
    prisma.recovery.groupBy({
      by: ["salonId"],
      _sum: { recoveredAmountCents: true },
    }),
  ]);

  const recoveredBySalon = new Map(
    recoveries.map((r) => [r.salonId, r._sum.recoveredAmountCents ?? 0]),
  );

  const rows: AdminSalonRow[] = salons.map((s) => ({
    id: s.id,
    name: s.name,
    metier: METIER_LABEL[s.metier] ?? s.metier,
    email: s.memberships[0]?.user.email ?? "—",
    status: s.subscriptionStatus,
    plan: s.plan ? (getPlan(s.plan)?.label ?? s.plan) : null,
    period: s.billingPeriod,
    smsUsed: s.smsUsedThisPeriod,
    clients: s._count.clients,
    recoveredCents: recoveredBySalon.get(s.id) ?? 0,
    createdAt: s.createdAt.toISOString(),
  }));

  // KPIs
  const total = salons.length;
  const active = salons.filter((s) => s.subscriptionStatus === "active").length;
  const trial = salons.filter((s) => s.subscriptionStatus === "trial").length;
  const mrrCents = salons
    .filter((s) => s.subscriptionStatus === "active")
    .reduce((sum, s) => sum + estimatedMrrCents(s.plan, s.billingPeriod), 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Espace fondateur
      </Link>
      <PageHeader
        title="Tous mes clients"
        description="Tous les salons abonnés à Revia."
      />

      <AdminClientsTable
        rows={rows}
        kpis={{ total, active, trial, mrrCents }}
      />
    </div>
  );
}
