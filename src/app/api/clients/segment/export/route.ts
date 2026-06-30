import { NextResponse, type NextRequest } from "next/server";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildClientWhere } from "@/lib/client-filters";
import { CLIENT_STATUS, type ClientStatus } from "@/lib/client-status";

export const dynamic = "force-dynamic";

/** Échappe une valeur pour CSV (séparateur « ; », guillemets doublés). */
function cell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dateFr(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("fr-FR").format(d);
}

/** Export CSV du segment de clientes filtré (mêmes critères que la liste). */
export async function GET(req: NextRequest) {
  const member = await requireMember();
  const sp = req.nextUrl.searchParams;

  const where = buildClientWhere(member.salonId, {
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    reachable: sp.get("reachable") ?? undefined,
    loyalty: sp.get("loyalty") ?? undefined,
    spend: sp.get("spend") ?? undefined,
  });

  const clients = await prisma.client.findMany({
    where,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 5000,
  });

  const headers = [
    "Prénom",
    "Nom",
    "Téléphone",
    "Email",
    "Statut",
    "Dernière visite",
    "Visites",
    "Panier moyen (€)",
    "Total dépensé (€)",
    "Consent. SMS",
    "Consent. email",
  ];

  const rows = clients.map((c) =>
    [
      c.firstName,
      c.lastName ?? "",
      c.phone ?? "",
      c.email ?? "",
      CLIENT_STATUS[c.status as ClientStatus]?.label ?? c.status,
      dateFr(c.lastVisitAt),
      c.visitCount,
      (c.averageSpendCents / 100).toFixed(2).replace(".", ","),
      (c.totalSpendCents / 100).toFixed(2).replace(".", ","),
      c.smsConsent ? "oui" : "non",
      c.emailConsent ? "oui" : "non",
    ]
      .map(cell)
      .join(";"),
  );

  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  const csv = "﻿" + [headers.map(cell).join(";"), ...rows].join("\r\n");
  const stamp = new Intl.DateTimeFormat("fr-CA").format(new Date()); // AAAA-MM-JJ

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="segment-clientes-${stamp}.csv"`,
    },
  });
}
