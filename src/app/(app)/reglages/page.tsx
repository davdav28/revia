import type { Metadata } from "next";
import Link from "next/link";
import { Sparkle, ChevronRight, CreditCard, Download } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingLinkCard } from "@/components/app/booking-link-card";
import { DeleteAccountButton } from "@/components/app/delete-account-button";
import { bookingUrl } from "@/lib/slug";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/subscription";

export const metadata: Metadata = { title: "Réglages" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-line flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <span className="text-muted text-sm">{label}</span>
      <span className="text-ink text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function ReglagesPage() {
  const member = await requireMember();
  const servicesCount = await prisma.service.count({
    where: { salonId: member.salonId },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Réglages"
        description="Les informations de votre salon et de votre compte."
      />

      <Link href="/reglages/services" className="block">
        <Card className="hover:bg-nude-soft/40 transition-colors">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="bg-nude-soft text-lacquer-ink flex size-10 items-center justify-center rounded-md">
              <Sparkle className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Prestations</CardTitle>
              <CardDescription>
                {servicesCount} prestation{servicesCount > 1 ? "s" : ""} · prix
                et cycles de retour
              </CardDescription>
            </div>
            <ChevronRight className="text-muted size-5" />
          </CardContent>
        </Card>
      </Link>

      <Link href="/reglages/abonnement" className="block">
        <Card className="hover:bg-nude-soft/40 transition-colors">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="bg-nude-soft text-lacquer-ink flex size-10 items-center justify-center rounded-md">
              <CreditCard className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Abonnement</CardTitle>
              <CardDescription>
                {SUBSCRIPTION_STATUS_LABEL[member.salon.subscriptionStatus] ??
                  member.salon.subscriptionStatus}{" "}
                · formules et facturation
              </CardDescription>
            </div>
            <ChevronRight className="text-muted size-5" />
          </CardContent>
        </Card>
      </Link>

      {member.salon.slug ? (
        <Card>
          <CardContent className="pt-6">
            <BookingLinkCard
              url={bookingUrl(member.salon.slug)}
              enabled={member.salon.bookingEnabled}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Salon</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Row label="Nom du salon" value={member.salon.name} />
          <Row label="Nom expéditeur SMS" value={member.salon.senderName} />
          <Row label="Fuseau horaire" value={member.salon.timezone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Votre compte</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Row label="Nom" value={member.name || "—"} />
          <Row label="Email" value={member.email} />
          <Row
            label="Rôle"
            value={
              <Badge tone="nude">
                {member.role === "owner" ? "Propriétaire" : "Équipe"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données & confidentialité (RGPD)</CardTitle>
          <CardDescription>
            Exportez vos données ou supprimez votre compte à tout moment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/api/account/export"
            className="text-lacquer-ink inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <Download className="size-4" />
            Exporter toutes mes données (JSON)
          </a>
          <DeleteAccountButton />
        </CardContent>
      </Card>

      <p className="text-muted text-center text-xs">
        <Link href="/confidentialite" className="hover:text-ink">
          Politique de confidentialité
        </Link>{" "}
        ·{" "}
        <Link href="/cgu" className="hover:text-ink">
          Conditions d'utilisation
        </Link>
      </p>
    </div>
  );
}
