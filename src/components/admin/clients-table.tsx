"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/subscription";

export type AdminSalonRow = {
  id: string;
  name: string;
  metier: string;
  email: string;
  status: string;
  plan: string | null;
  period: string | null;
  smsUsed: number;
  clients: number;
  recoveredCents: number;
  createdAt: string;
};

type Kpis = { total: number; active: number; trial: number; mrrCents: number };

const STATUS_TONE: Record<
  string,
  "neutral" | "nude" | "outline" | "lacquer"
> = {
  active: "lacquer",
  trial: "nude",
  incomplete: "outline",
  past_due: "outline",
  canceled: "neutral",
};

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "active", label: "Actifs" },
  { id: "trial", label: "En essai" },
  { id: "incomplete", label: "À finaliser" },
  { id: "past_due", label: "Impayés" },
  { id: "canceled", label: "Résiliés" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-surface rounded-lg border p-4">
      <div className="text-ink tabular text-2xl font-semibold">{value}</div>
      <div className="text-muted mt-0.5 text-sm">{label}</div>
    </div>
  );
}

export function AdminClientsTable({
  rows,
  kpis,
}: {
  rows: AdminSalonRow[];
  kpis: Kpis;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.metier.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Salons" value={String(kpis.total)} />
        <Kpi label="Actifs (payants)" value={String(kpis.active)} />
        <Kpi label="En essai" value={String(kpis.trial)} />
        <Kpi label="MRR estimé" value={formatCents(kpis.mrrCents)} />
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs">
          <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, email, métier…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === f.id
                  ? "border-ink bg-ink text-white"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="border-line overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface text-muted border-line border-b text-left text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Salon</th>
              <th className="px-4 py-3 font-medium">Métier</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 text-right font-medium">SMS</th>
              <th className="px-4 py-3 text-right font-medium">Clients</th>
              <th className="px-4 py-3 text-right font-medium">CA récupéré</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-line border-b last:border-0">
                <td className="text-ink px-4 py-3 font-medium">{r.name}</td>
                <td className="text-muted px-4 py-3">{r.metier}</td>
                <td className="text-muted px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[r.status] ?? "outline"}>
                    {SUBSCRIPTION_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </td>
                <td className="text-muted px-4 py-3">
                  {r.plan ?? "—"}
                  {r.plan && r.period ? (
                    <span className="text-muted/70">
                      {" "}
                      · {r.period === "annual" ? "annuel" : "mensuel"}
                    </span>
                  ) : null}
                </td>
                <td className="tabular text-ink px-4 py-3 text-right">
                  {r.smsUsed}
                </td>
                <td className="tabular text-ink px-4 py-3 text-right">
                  {r.clients}
                </td>
                <td className="tabular text-ink px-4 py-3 text-right">
                  {formatCents(r.recoveredCents)}
                </td>
                <td className="text-muted px-4 py-3">{fmtDate(r.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted px-4 py-10 text-center">
                  Aucun salon ne correspond.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-muted text-xs">
        {filtered.length} salon{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} · MRR estimé à partir des tarifs
        publics (hors offres sur-mesure).
      </p>
    </div>
  );
}
