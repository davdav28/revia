import type { Metadata } from "next";
import Link from "next/link";
import { Users, Upload, Plus, Download } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { ClientsToolbar } from "@/components/app/clients-toolbar";
import { ClientStatusBadge } from "@/components/app/client-status-badge";
import { SendMessageDialog } from "@/components/reactivation/send-message-dialog";
import { Send } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelative } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import {
  buildClientWhere,
  hasActiveFilters,
  toFilterQuery,
  type ClientFilterParams,
} from "@/lib/client-filters";

export const metadata: Metadata = { title: "Clients" };

const ORDER_BY: Record<string, Prisma.ClientOrderByWithRelationInput[]> = {
  recent: [{ lastVisitAt: { sort: "desc", nulls: "last" } }],
  name: [{ firstName: "asc" }, { lastName: "asc" }],
  visits: [{ visitCount: "desc" }],
  spend: [{ averageSpendCents: "desc" }],
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<ClientFilterParams & { sort?: string }>;
}) {
  const member = await requireMember();
  const sp = await searchParams;
  const { sort } = sp;

  const where = buildClientWhere(member.salonId, sp);
  const filtered = hasActiveFilters(sp);

  const [clients, filteredCount, totalCount] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: ORDER_BY[sort ?? "recent"] ?? ORDER_BY.recent,
      take: 500,
    }),
    filtered
      ? prisma.client.count({ where })
      : prisma.client.count({ where: { salonId: member.salonId } }),
    prisma.client.count({ where: { salonId: member.salonId } }),
  ]);

  const exportQuery = toFilterQuery(sp);
  const segmentFilter: ClientFilterParams = {
    q: sp.q,
    status: sp.status,
    reachable: sp.reachable,
    loyalty: sp.loyalty,
    spend: sp.spend,
  };
  const templates =
    totalCount > 0
      ? await prisma.messageTemplate.findMany({
          where: { salonId: member.salonId, isActive: true },
          select: {
            id: true,
            name: true,
            channel: true,
            scenario: true,
            subject: true,
            body: true,
          },
          orderBy: { name: "asc" },
        })
      : [];

  const actions = (
    <>
      <Button variant="secondary" size="sm" asChild>
        <Link href="/clientes/nouvelle">
          <Plus className="size-4" />
          Ajouter
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/clientes/import">
          <Upload className="size-4" />
          Importer
        </Link>
      </Button>
    </>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Clients"
        description={
          totalCount > 0
            ? `${totalCount} client${totalCount > 1 ? "s" : ""} dans votre fichier.`
            : "Votre fichier clients, et leur statut dans la boucle."
        }
        actions={totalCount > 0 ? actions : undefined}
      />

      {totalCount === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client pour l'instant"
          description="Importez votre fichier clients ou ajoutez-les un à un. Revia pourra alors repérer ceux qui ne reviennent plus."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/clientes/import">
                  <Upload className="size-4" />
                  Importer mon fichier
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/clientes/nouvelle">
                  <Plus className="size-4" />
                  Ajouter un client
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <ClientsToolbar />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted text-sm">
              {filtered ? (
                <>
                  <span className="text-ink font-semibold">{filteredCount}</span>{" "}
                  client{filteredCount > 1 ? "s" : ""} dans ce segment{" "}
                  <span className="text-muted">
                    (sur {totalCount})
                  </span>
                </>
              ) : (
                <>
                  <span className="text-ink font-semibold">{totalCount}</span>{" "}
                  client{totalCount > 1 ? "s" : ""}
                </>
              )}
            </p>
            {filteredCount > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {templates.length > 0 ? (
                  <SendMessageDialog
                    mode="segment"
                    filter={segmentFilter}
                    count={filteredCount}
                    templates={templates}
                    trigger={
                      <Button size="sm">
                        <Send className="size-4" />
                        Envoyer à ce segment
                      </Button>
                    }
                  />
                ) : null}
                <Button variant="secondary" size="sm" asChild>
                  <a
                    href={`/api/clients/segment/export${exportQuery ? `?${exportQuery}` : ""}`}
                  >
                    <Download className="size-4" />
                    Exporter (CSV)
                  </a>
                </Button>
              </div>
            ) : null}
          </div>

          {clients.length === 0 ? (
            <div className="border-line bg-surface/60 text-muted rounded-lg border border-dashed px-6 py-12 text-center text-sm">
              Aucun client ne correspond à votre recherche.
            </div>
          ) : (
            <div className="border-line bg-surface overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière visite</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Visites
                    </TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Panier moyen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          href={`/clientes/${c.id}`}
                          className="text-ink hover:text-lacquer-ink font-medium"
                        >
                          {c.firstName} {c.lastName ?? ""}
                        </Link>
                        <div className="text-muted text-xs">
                          {c.phone || c.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ClientStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-muted">
                        {formatRelative(c.lastVisitAt)}
                      </TableCell>
                      <TableCell className="tabular hidden text-right sm:table-cell">
                        {c.visitCount}
                      </TableCell>
                      <TableCell className="tabular hidden text-right sm:table-cell">
                        {c.visitCount > 0
                          ? formatCents(c.averageSpendCents)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
