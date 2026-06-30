import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ChevronRight } from "lucide-react";
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

      <Link
        href="/clientes/import-rdv"
        className="border-line bg-surface hover:bg-nude-soft/40 flex items-center gap-4 rounded-lg border p-4 transition-colors"
      >
        <div className="bg-nude-soft text-lacquer-ink flex size-10 items-center justify-center rounded-md">
          <CalendarClock className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-ink text-sm font-medium">
            Vous avez plutôt un historique de rendez-vous ?
          </p>
          <p className="text-muted text-sm">
            Importez l'export Planity, Treatwell ou Fresha — Revia reconstitue
            les visites et repère les clientes à relancer.
          </p>
        </div>
        <ChevronRight className="text-muted size-5 shrink-0" />
      </Link>
    </div>
  );
}
