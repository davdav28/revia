import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = { title: "Importer des clientes" };

export default async function ImportPage() {
  await requireMember();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/clientes"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux clientes
      </Link>
      <PageHeader
        title="Importer votre fichier clientes"
        description="Un fichier CSV avec une ligne d'en-têtes. Vous associerez ensuite vos colonnes et vérifierez l'aperçu avant l'import."
      />
      <ImportWizard />
    </div>
  );
}
