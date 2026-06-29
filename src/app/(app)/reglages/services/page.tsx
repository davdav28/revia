import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus, Sparkle } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDefaultServices, deleteService } from "@/server/services";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DeleteServiceButton } from "@/components/app/delete-service-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Prestations" };

export default async function ServicesPage() {
  const member = await requireMember();
  const services = await prisma.service.findMany({
    where: { salonId: member.salonId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/reglages"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux réglages
      </Link>

      <PageHeader
        title="Prestations"
        description="Vos soins, leur prix et leur cycle de retour. Le cycle sert à repérer les clientes en retard."
        actions={
          services.length > 0 ? (
            <Button size="sm" asChild>
              <Link href="/reglages/services/nouveau">
                <Plus className="size-4" />
                Ajouter
              </Link>
            </Button>
          ) : undefined
        }
      />

      {services.length === 0 ? (
        <EmptyState
          icon={Sparkle}
          title="Aucune prestation pour l'instant"
          description="Démarrez avec les prestations onglerie types (pose gel, semi-permanent, remplissage, nail art, dépose), puis ajustez prix et cycles."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <form action={seedDefaultServices}>
                <Button type="submit">Ajouter les prestations types</Button>
              </form>
              <Button variant="secondary" asChild>
                <Link href="/reglages/services/nouveau">
                  Créer une prestation
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="border-line bg-surface overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestation</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Cycle</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/reglages/services/${s.id}`}
                      className="text-ink hover:text-lacquer-ink font-medium"
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatCents(s.priceCents)}
                  </TableCell>
                  <TableCell className="tabular text-muted text-right">
                    {s.defaultIntervalDays ? `${s.defaultIntervalDays} j` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reglages/services/${s.id}`}>
                          Modifier
                        </Link>
                      </Button>
                      <DeleteServiceButton
                        action={deleteService.bind(null, s.id)}
                        name={s.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
