import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/app/client-form";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/server/clients";

export const metadata: Metadata = { title: "Ajouter un client" };

export default function NouvelleClientePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/clientes"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </Link>
      <PageHeader
        title="Ajouter un client"
        description="Renseignez ses informations. Vous pourrez les modifier plus tard."
      />
      <Card>
        <CardContent className="pt-6">
          <ClientForm
            action={createClient}
            showFirstVisit
            submitLabel="Ajouter le client"
          />
        </CardContent>
      </Card>
    </div>
  );
}
