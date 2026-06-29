import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateService } from "@/server/services";
import { PageHeader } from "@/components/app/page-header";
import { ServiceForm } from "@/components/app/service-form";
import { Card, CardContent } from "@/components/ui/card";
import { centsToEurosInput } from "@/lib/money";

export const metadata: Metadata = { title: "Modifier la prestation" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember();
  const service = await prisma.service.findFirst({
    where: { id, salonId: member.salonId },
  });
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/reglages/services"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux prestations
      </Link>
      <PageHeader title="Modifier la prestation" />
      <Card>
        <CardContent className="pt-6">
          <ServiceForm
            action={updateService.bind(null, service.id)}
            defaultValues={{
              name: service.name,
              price: centsToEurosInput(service.priceCents),
              intervalDays: service.defaultIntervalDays
                ? String(service.defaultIntervalDays)
                : "",
            }}
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
