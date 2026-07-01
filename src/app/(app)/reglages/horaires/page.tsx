import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { HoursForm } from "@/components/app/hours-form";

export const metadata: Metadata = { title: "Horaires d'ouverture" };

export default async function HorairesPage() {
  const member = await requireMember();
  const salon = member.salon;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/reglages"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux réglages
      </Link>

      <PageHeader
        title="Horaires d'ouverture"
        description="Définissez quand vos clients peuvent réserver en ligne."
      />

      <Card>
        <CardContent className="pt-6">
          <HoursForm
            openDays={salon.openDays}
            openFromHour={salon.openFromHour}
            openToHour={salon.openToHour}
          />
        </CardContent>
      </Card>
    </div>
  );
}
