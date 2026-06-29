import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ServiceForm } from "@/components/app/service-form";
import { Card, CardContent } from "@/components/ui/card";
import { createService } from "@/server/services";

export const metadata: Metadata = { title: "Nouvelle prestation" };

export default function NouvelleServicePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/reglages/services"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux prestations
      </Link>
      <PageHeader title="Nouvelle prestation" />
      <Card>
        <CardContent className="pt-6">
          <ServiceForm
            action={createService}
            submitLabel="Créer la prestation"
          />
        </CardContent>
      </Card>
    </div>
  );
}
