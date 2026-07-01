import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ApptImportWizard } from "./appt-import-wizard";

export const metadata: Metadata = { title: "Importer un historique de rendez-vous" };

export default async function ImportRdvPage() {
  await requireMember();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/clientes/import"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour à l'import
      </Link>
      <PageHeader
        title="Importer votre historique de rendez-vous"
        description="Depuis Planity, Treatwell, Fresha ou votre caisse. Une ligne par visite : Revia reconstitue l'historique de chaque client et repère aussitôt ceux à relancer."
      />
      <ApptImportWizard />
    </div>
  );
}
