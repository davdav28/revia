import type { Metadata } from "next";
import { Send } from "lucide-react";
import type { CampaignTrigger, MessageStatus } from "@prisma/client";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setupReactivation } from "@/server/reactivation";
import { isRealMessagingConfigured } from "@/lib/messaging";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScanButton } from "@/components/reactivation/scan-button";
import { CampaignToggle } from "@/components/reactivation/campaign-toggle";
import { TemplateEditDialog } from "@/components/reactivation/template-edit-dialog";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Relances" };

const TRIGGER_LABEL: Record<CampaignTrigger, string> = {
  dormancy: "Cliente dormante",
  post_first_visit: "Après 1re visite",
  birthday: "Anniversaire",
  slow_slot: "Créneau creux",
};

const STATUS_LABEL: Record<MessageStatus, string> = {
  queued: "En file",
  sent: "Envoyé",
  delivered: "Délivré",
  failed: "Échec",
  opted_out: "Désabonnée",
};

export default async function RelancesPage() {
  const member = await requireMember();
  const salonId = member.salonId;

  const [campaigns, templates, messages, recoveryAgg] = await Promise.all([
    prisma.campaign.findMany({
      where: { salonId },
      include: { template: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.messageTemplate.findMany({
      where: { salonId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.message.findMany({
      where: { salonId },
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.recovery.aggregate({
      where: { salonId },
      _sum: { recoveredAmountCents: true },
      _count: true,
    }),
  ]);

  if (campaigns.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Relances" />
        <EmptyState
          icon={Send}
          title="Mettez en place vos relances"
          description="Revia va créer vos campagnes (dormantes, après 1re visite, anniversaire) avec des modèles de messages pré-écrits, que vous pourrez activer et personnaliser."
          action={
            <form action={setupReactivation}>
              <Button type="submit">Mettre en place les relances</Button>
            </form>
          }
        />
      </div>
    );
  }

  const sentCount = messages.filter(
    (m) => m.status === "sent" || m.status === "delivered",
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Relances"
        description="Vos campagnes de réactivation et leurs résultats."
        actions={<ScanButton />}
      />

      {!isRealMessagingConfigured() ? (
        <p className="border-status-at-risk/30 bg-status-at-risk/10 text-status-at-risk rounded-md border px-3 py-2 text-sm">
          Mode démonstration : les messages sont simulés (aucun envoi réel).
          Ajoutez une clé Brevo (<code>BREVO_API_KEY</code>) pour envoyer pour
          de vrai.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <div className="border-line bg-surface rounded-lg border p-4">
          <div className="text-muted text-xs">Réactivations</div>
          <div className="tabular text-ink mt-1 text-2xl font-semibold">
            {recoveryAgg._count}
          </div>
        </div>
        <div className="border-line bg-surface rounded-lg border p-4">
          <div className="text-muted text-xs">CA récupéré (total)</div>
          <div className="tabular text-lacquer mt-1 text-2xl font-semibold">
            {formatCents(recoveryAgg._sum.recoveredAmountCents ?? 0)}
          </div>
        </div>
        <div className="border-line bg-surface rounded-lg border p-4">
          <div className="text-muted text-xs">Envois récents</div>
          <div className="tabular text-ink mt-1 text-2xl font-semibold">
            {sentCount}
          </div>
        </div>
      </div>

      {/* Campagnes */}
      <section className="space-y-3">
        <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
          Campagnes
        </h2>
        <div className="divide-line border-line bg-surface divide-y overflow-hidden rounded-lg border">
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="text-ink font-medium">{c.name}</div>
                <div className="text-muted mt-0.5 flex items-center gap-2 text-xs">
                  <Badge tone="outline">{TRIGGER_LABEL[c.trigger]}</Badge>
                  <span className="uppercase">{c.channel}</span>
                  {c.trigger === "slow_slot" ? (
                    <span>· bientôt disponible</span>
                  ) : null}
                </div>
              </div>
              <CampaignToggle campaignId={c.id} active={c.isActive} />
            </div>
          ))}
        </div>
      </section>

      {/* Modèles */}
      <section className="space-y-3">
        <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
          Modèles de messages
        </h2>
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <CardDescription className="uppercase">
                    {t.channel}
                  </CardDescription>
                </div>
                <TemplateEditDialog
                  template={{
                    id: t.id,
                    name: t.name,
                    channel: t.channel,
                    subject: t.subject,
                    body: t.body,
                  }}
                />
              </CardHeader>
              <CardContent>
                {t.subject ? (
                  <p className="text-ink mb-1 text-sm font-medium">
                    {t.subject}
                  </p>
                ) : null}
                <p className="text-muted text-sm whitespace-pre-line">
                  {t.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Derniers envois */}
      <section className="space-y-3">
        <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
          Derniers envois
        </h2>
        {messages.length === 0 ? (
          <div className="border-line bg-surface/60 text-muted rounded-lg border border-dashed px-6 py-10 text-center text-sm">
            Aucun message envoyé pour l'instant. Activez une campagne et lancez
            le scan.
          </div>
        ) : (
          <div className="border-line bg-surface overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-ink font-medium">
                      {m.client.firstName} {m.client.lastName ?? ""}
                    </TableCell>
                    <TableCell className="text-muted uppercase">
                      {m.channel}
                    </TableCell>
                    <TableCell>
                      <Badge tone={m.status === "failed" ? "neutral" : "nude"}>
                        {STATUS_LABEL[m.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular text-muted text-right">
                      {m.costCents != null ? formatCents(m.costCents) : "—"}
                    </TableCell>
                    <TableCell className="text-muted text-right">
                      {formatDate(m.sentAt ?? m.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
