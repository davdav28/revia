import type { Prisma } from "@prisma/client";
import type { ClientStatus } from "@/lib/client-status";

/** Critères de segmentation des clientes (issus de l'URL). */
export type ClientFilterParams = {
  q?: string;
  status?: string;
  reachable?: string; // "sms" | "email"
  loyalty?: string; // "new" | "loyal"
  spend?: string; // panier moyen minimum, en euros ("30", "50")
};

const STATUSES = ["active", "at_risk", "dormant", "recovered", "lost"];

/**
 * Construit le filtre Prisma d'un segment. Partagé entre la liste clientes et
 * l'export CSV pour garantir que l'export = exactement ce qui est affiché.
 */
export function buildClientWhere(
  salonId: string,
  p: ClientFilterParams,
): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = { salonId };
  const and: Prisma.ClientWhereInput[] = [];

  if (p.status && STATUSES.includes(p.status)) {
    where.status = p.status as ClientStatus;
  }

  if (p.q && p.q.trim()) {
    const term = p.q.trim();
    where.OR = [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  if (p.reachable === "sms") {
    and.push({ smsConsent: true }, { phone: { not: null } }, { phone: { not: "" } });
  } else if (p.reachable === "email") {
    and.push({ emailConsent: true }, { email: { not: null } }, { email: { not: "" } });
  }

  if (p.loyalty === "new") and.push({ visitCount: { lte: 1 } });
  else if (p.loyalty === "loyal") and.push({ visitCount: { gte: 3 } });

  const minEuros = p.spend ? Number(p.spend) : 0;
  if (Number.isFinite(minEuros) && minEuros > 0) {
    and.push({ averageSpendCents: { gte: Math.round(minEuros * 100) } });
  }

  if (and.length) where.AND = and;
  return where;
}

/** Vrai si au moins un critère de segmentation est actif. */
export function hasActiveFilters(p: ClientFilterParams): boolean {
  return !!(
    p.status ||
    p.reachable ||
    p.loyalty ||
    p.spend ||
    (p.q && p.q.trim())
  );
}

/** Réduit des searchParams à nos seuls critères (pour bâtir un lien d'export). */
export function toFilterQuery(p: ClientFilterParams & { sort?: string }): string {
  const sp = new URLSearchParams();
  for (const k of ["q", "status", "reachable", "loyalty", "spend", "sort"] as const) {
    const v = p[k];
    if (v && String(v).trim()) sp.set(k, String(v));
  }
  return sp.toString();
}
