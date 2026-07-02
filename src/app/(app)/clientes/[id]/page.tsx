import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClient, deleteClient } from "@/server/clients";
import { ClientForm } from "@/components/app/client-form";
import { ClientStatusBadge } from "@/components/app/client-status-badge";
import { DeleteClientButton } from "@/components/app/delete-client-button";
import { OptOutToggle } from "@/components/app/opt-out-toggle";
import { SendMessageDialog } from "@/components/reactivation/send-message-dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelative, formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Fiche client" };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-surface rounded-lg border px-4 py-3">
      <div className="text-muted text-xs">{label}</div>
      <div className="tabular text-ink mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember();
  const client = await prisma.client.findFirst({
    where: { id, salonId: member.salonId },
  });
  if (!client) notFound();

  const fullName = `${client.firstName} ${client.lastName ?? ""}`.trim();

  // Seuls les modèles « manuels » (trigger nul) : les modèles automatiques
  // (rappel de cycle, dormante, anniversaire…) partent déjà via le scan.
  const templates = await prisma.messageTemplate.findMany({
    where: { salonId: member.salonId, isActive: true, trigger: null },
    select: {
      id: true,
      name: true,
      channel: true,
      scenario: true,
      subject: true,
      body: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/clientes"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
            {fullName}
          </h1>
          <div className="mt-2">
            <ClientStatusBadge status={client.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {templates.length > 0 ? (
            <SendMessageDialog
              mode="client"
              clientId={client.id}
              clientName={fullName}
              templates={templates}
              trigger={
                <Button variant="secondary" size="sm">
                  <Send className="size-4" />
                  Envoyer un message
                </Button>
              }
            />
          ) : null}
          <DeleteClientButton
            action={deleteClient.bind(null, client.id)}
            clientName={fullName}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Dernière visite"
          value={formatRelative(client.lastVisitAt)}
        />
        <Stat label="Visites" value={String(client.visitCount)} />
        <Stat
          label="Panier moyen"
          value={
            client.visitCount > 0 ? formatCents(client.averageSpendCents) : "—"
          }
        />
      </div>

      {client.lastVisitAt ? (
        <p className="text-muted text-sm">
          Dernière visite le {formatDate(client.lastVisitAt)}.
        </p>
      ) : null}

      <div className="border-line bg-surface rounded-lg border p-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-ink text-sm font-medium">Contact & relances</p>
            <p className="text-muted mt-0.5 text-sm">
              {client.optedOutAt
                ? `Désabonnée le ${formatDate(client.optedOutAt)} — ne sera plus contactée.`
                : "Peut recevoir des relances selon ses consentements."}
            </p>
          </div>
          <OptOutToggle clientId={client.id} optedOut={!!client.optedOutAt} />
        </div>

        {/* Registre des consentements (RGPD) */}
        <div className="border-line text-muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
          <span>
            SMS :{" "}
            {client.smsConsent
              ? `oui${client.smsConsentAt ? ` (${formatDate(client.smsConsentAt)})` : ""}`
              : "non"}
          </span>
          <span>
            Email :{" "}
            {client.emailConsent
              ? `oui${client.emailConsentAt ? ` (${formatDate(client.emailConsentAt)})` : ""}`
              : "non"}
          </span>
          <a
            href={`/api/clients/${client.id}/export`}
            className="text-lacquer-ink ml-auto font-medium hover:underline"
          >
            Exporter ses données (RGPD)
          </a>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ClientForm
            action={updateClient.bind(null, client.id)}
            defaultValues={{
              firstName: client.firstName,
              lastName: client.lastName ?? "",
              phone: client.phone ?? "",
              email: client.email ?? "",
              notes: client.notes ?? "",
              birthdate: client.birthdate
                ? client.birthdate.toISOString().slice(0, 10)
                : "",
              smsConsent: client.smsConsent,
              emailConsent: client.emailConsent,
            }}
            submitLabel="Enregistrer les modifications"
            cancelHref="/clientes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
