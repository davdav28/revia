import type {
  Campaign,
  Client,
  MessageChannel,
  MessageTemplate,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recomputeManyClientStats } from "@/lib/client-stats";
import { getMessagingProvider, type MessagingProvider } from "@/lib/messaging";
import { renderTemplate, scenarioFor } from "@/lib/templates";
import { isWithinSendWindow } from "./send-window";
import { optOutUrl } from "@/lib/opt-out";
import { bookingUrl } from "@/lib/slug";
import { isSubscriptionActive } from "@/lib/subscription";
import { countSegments } from "@/lib/sms-segments";
import { getQuotaStatus, isQuotaPeriodElapsed } from "@/lib/quota";
import { reportOverageSegments } from "@/lib/billing-usage";
import { SUBSCRIPTION, withStopNotice } from "@/config/brand";

const DAY = 86_400_000;
const MAX_PER_CAMPAIGN = 200;
const MAX_ATTEMPTS = 3; // mise en sommeil après 3 relances sans retour

export type ScanSummary = {
  salonId: string;
  statusesUpdated: number;
  recoveriesCreated: number;
  recoveredAmountCents: number;
  messagesSent: number;
  messagesFailed: number;
  smsSegmentsUsed: number;
  quotaPaused: boolean;
  skipped: {
    optedOut: number;
    noConsent: number;
    cooldown: number;
    exhausted: number;
    noTemplate: number;
    quotaCap: number;
  };
  sendWindowOpen: boolean;
  subscriptionActive: boolean;
};

/** Construit le segment d'une campagne selon son déclencheur. */
async function recipientsFor(
  campaign: Campaign,
  salonId: string,
  now: Date,
): Promise<Client[]> {
  if (campaign.trigger === "dormancy") {
    // « À surveiller » (rappel de cycle) + dormantes (relance).
    return prisma.client.findMany({
      where: {
        salonId,
        status: { in: ["at_risk", "dormant"] },
        optedOutAt: null,
      },
      take: MAX_PER_CAMPAIGN,
    });
  }
  if (campaign.trigger === "post_first_visit") {
    const from = new Date(now.getTime() - 21 * DAY);
    const to = new Date(now.getTime() - 14 * DAY);
    return prisma.client.findMany({
      where: {
        salonId,
        optedOutAt: null,
        visitCount: 1,
        lastVisitAt: { gte: from, lte: to },
      },
      take: MAX_PER_CAMPAIGN,
    });
  }
  if (campaign.trigger === "birthday") {
    const all = await prisma.client.findMany({
      where: { salonId, optedOutAt: null, birthdate: { not: null } },
      take: 1000,
    });
    return all.filter(
      (c) =>
        c.birthdate &&
        c.birthdate.getUTCMonth() === now.getUTCMonth() &&
        c.birthdate.getUTCDate() === now.getUTCDate(),
    );
  }
  // slow_slot : envoi manuel (créneau libéré), non traité par le scan.
  return [];
}

function hasConsentAndContact(c: Client, channel: MessageChannel): boolean {
  if (channel === "sms") return c.smsConsent && !!c.phone;
  return c.emailConsent && !!c.email;
}

/** Lance le moteur de réactivation pour un salon. */
export async function runScanForSalon(
  salonId: string,
  opts: { force?: boolean; now?: Date } = {},
): Promise<ScanSummary> {
  const now = opts.now ?? new Date();
  let salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) throw new Error("Salon introuvable.");

  // Nouvelle période de quota écoulée → remise à zéro (compteur + alerte).
  if (isQuotaPeriodElapsed(salon, now)) {
    salon = await prisma.salon.update({
      where: { id: salonId },
      data: {
        smsUsedThisPeriod: 0,
        quotaPeriodStart: now,
        quotaAlertSent: false,
      },
    });
  }

  const summary: ScanSummary = {
    salonId,
    statusesUpdated: 0,
    recoveriesCreated: 0,
    recoveredAmountCents: 0,
    messagesSent: 0,
    messagesFailed: 0,
    smsSegmentsUsed: 0,
    quotaPaused: false,
    skipped: {
      optedOut: 0,
      noConsent: 0,
      cooldown: 0,
      exhausted: 0,
      noTemplate: 0,
      quotaCap: 0,
    },
    sendWindowOpen: opts.force ? true : isWithinSendWindow(now, salon.timezone),
    subscriptionActive: isSubscriptionActive(salon.subscriptionStatus),
  };

  // A. Recalcule les statuts de toutes les clientes.
  const allClients = await prisma.client.findMany({
    where: { salonId },
    select: { id: true },
  });
  await recomputeManyClientStats(
    salonId,
    allClients.map((c) => c.id),
  );
  summary.statusesUpdated = allClients.length;

  // B. Détecte les réactivations (cliente relancée qui reprend RDV).
  const pending = await prisma.message.findMany({
    where: {
      salonId,
      status: { in: ["sent", "delivered"] },
      recovery: { is: null },
    },
    include: { campaign: { select: { recoveryWindowDays: true } } },
  });
  for (const msg of pending) {
    if (!msg.sentAt) continue;
    const windowDays = msg.campaign?.recoveryWindowDays ?? 30;
    const until = new Date(msg.sentAt.getTime() + windowDays * DAY);
    const appt = await prisma.appointment.findFirst({
      where: {
        clientId: msg.clientId,
        salonId,
        status: { in: ["scheduled", "completed"] },
        createdAt: { gte: msg.sentAt, lte: until },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!appt) continue;

    const client = await prisma.client.findUnique({
      where: { id: msg.clientId },
      select: { averageSpendCents: true },
    });
    const amount = appt.amountCents ?? client?.averageSpendCents ?? 0;
    await prisma.recovery.create({
      data: {
        salonId,
        clientId: msg.clientId,
        messageId: msg.id,
        appointmentId: appt.id,
        recoveredAmountCents: amount,
        recoveredAt: appt.createdAt,
      },
    });
    await prisma.client.update({
      where: { id: msg.clientId },
      data: { status: "recovered" },
    });
    summary.recoveriesCreated++;
    summary.recoveredAmountCents += amount;
  }

  // Note : l'essai (30 j) est géré par Stripe. À la fin, Stripe débite et le
  // statut passe à « active » (envois maintenus) ou « past_due » (bloqués via
  // le webhook). Le gating ci-dessous suffit donc.

  // C. Envoie les relances (abonnement actif requis + plage horaire).
  if (!summary.subscriptionActive) return summary;
  if (!summary.sendWindowOpen) return summary;

  const provider = getMessagingProvider();
  // Lien de réservation en ligne (vide si désactivé) → variable {{lien}}.
  const lien = salon.bookingEnabled && salon.slug ? bookingUrl(salon.slug) : "";

  // État du quota SMS pour la période. On décompte en segments et on met les
  // envois SMS en pause si le plafond de dépassement est atteint.
  const quota = getQuotaStatus(salon);
  let quotaUsed = quota.used;
  let alertSent = salon.quotaAlertSent;
  const quotaTotal = quota.totalAllowed;
  const alertThreshold = Math.ceil(
    (quota.included * SUBSCRIPTION.quotaAlertPct) / 100,
  );

  // Modèles actifs du salon, indexés par scénario|canal (pour la rotation).
  const activeTemplates = await prisma.messageTemplate.findMany({
    where: { salonId, isActive: true },
  });
  const tplMap = new Map<string, MessageTemplate[]>();
  for (const t of activeTemplates) {
    if (!t.scenario) continue;
    const key = `${t.scenario}|${t.channel}`;
    const arr = tplMap.get(key) ?? [];
    arr.push(t);
    tplMap.set(key, arr);
  }

  const campaigns = await prisma.campaign.findMany({
    where: { salonId, isActive: true },
  });

  for (const campaign of campaigns) {
    if (campaign.trigger === "slow_slot") continue;
    const recipients = await recipientsFor(campaign, salonId, now);
    if (recipients.length === 0) continue;
    const cooldownMs = campaign.cooldownDays * DAY;

    // Nombre de relances déjà envoyées par cette campagne (rotation + sommeil).
    const priorCounts = await prisma.message.groupBy({
      by: ["clientId"],
      where: {
        campaignId: campaign.id,
        clientId: { in: recipients.map((r) => r.id) },
      },
      _count: true,
    });
    const attempts = new Map(priorCounts.map((p) => [p.clientId, p._count]));

    for (const client of recipients) {
      if (client.optedOutAt) {
        summary.skipped.optedOut++;
        continue;
      }
      if (!hasConsentAndContact(client, campaign.channel)) {
        summary.skipped.noConsent++;
        continue;
      }
      if (
        client.lastContactedAt &&
        now.getTime() - client.lastContactedAt.getTime() < cooldownMs
      ) {
        summary.skipped.cooldown++;
        continue;
      }

      const attempt = attempts.get(client.id) ?? 0;
      if (attempt >= MAX_ATTEMPTS) {
        summary.skipped.exhausted++;
        continue;
      }

      const weeks = client.lastVisitAt
        ? Math.floor((now.getTime() - client.lastVisitAt.getTime()) / (7 * DAY))
        : null;
      const scenario = scenarioFor(campaign.trigger, {
        status: client.status,
        weeksSinceVisit: weeks,
      });
      if (!scenario) continue;

      const candidates = tplMap.get(`${scenario}|${campaign.channel}`) ?? [];
      if (candidates.length === 0) {
        summary.skipped.noTemplate++;
        continue;
      }
      // Rotation d'angle : une variante différente à chaque tentative.
      const template = candidates[attempt % candidates.length];

      let dernierePresta = "";
      if (template.body.includes("derniere_presta")) {
        const last = await prisma.appointment.findFirst({
          where: {
            salonId,
            clientId: client.id,
            status: "completed",
            serviceId: { not: null },
          },
          orderBy: { startAt: "desc" },
          include: { service: { select: { name: true } } },
        });
        dernierePresta = last?.service?.name ?? "";
      }

      const vars = {
        prenom: client.firstName,
        salon: salon.name,
        semaines: weeks ?? "",
        derniere_presta: dernierePresta,
        lien,
        offre: "",
        jour: "",
      };
      // Pour les SMS : on ajoute la mention de désabonnement (STOP), exigée
      // pour la prospection en France. Les emails ont déjà un lien Se désabonner.
      const body =
        campaign.channel === "sms"
          ? withStopNotice(renderTemplate(template.body, vars))
          : renderTemplate(template.body, vars);
      const subject = template.subject
        ? renderTemplate(template.subject, vars)
        : null;

      // Décompte en segments (les emails ne consomment pas le quota SMS).
      const segments = campaign.channel === "sms" ? countSegments(body) : 1;
      // Plafond de dépassement atteint → les SMS passent en pause.
      if (campaign.channel === "sms" && quotaUsed + segments > quotaTotal) {
        summary.skipped.quotaCap++;
        summary.quotaPaused = true;
        continue;
      }

      let result;
      let to: string;
      if (campaign.channel === "sms") {
        to = client.phone!;
        // Pas de « STOP » dans le corps : le désabonnement est géré par l'opérateur.
        result = await provider.sendSms({
          to,
          sender: salon.senderName,
          body,
        });
      } else {
        to = client.email!;
        const html = `<div>${body.replace(/\n/g, "<br>")}</div><p style="margin-top:24px;font-size:12px;color:#6b5d67"><a href="${optOutUrl(
          client.id,
        )}">Se désabonner</a></p>`;
        result = await provider.sendEmail({
          to,
          subject: subject ?? salon.name,
          html,
          senderEmail: process.env.BREVO_EMAIL_SENDER ?? "contact@reviagence.com",
          senderName: salon.senderName,
        });
      }

      await prisma.message.create({
        data: {
          salonId,
          clientId: client.id,
          campaignId: campaign.id,
          templateId: template.id,
          channel: campaign.channel,
          segments,
          to,
          subject,
          body,
          status: result.ok ? "sent" : "failed",
          costCents: result.ok ? (result.costCents ?? null) : null,
          providerId: result.ok ? (result.providerId ?? null) : null,
          error: result.ok ? null : result.error,
          sentAt: result.ok ? now : null,
        },
      });

      if (result.ok) {
        if (campaign.channel === "sms") {
          const usedBefore = quotaUsed;
          quotaUsed += segments;
          summary.smsSegmentsUsed += segments;
          // Segments tombant en dépassement → reportés à Stripe (metered).
          const overageDelta =
            Math.max(0, quotaUsed - quota.included) -
            Math.max(0, usedBefore - quota.included);
          if (overageDelta > 0) {
            await reportOverageSegments(
              salon.stripeCustomerId,
              overageDelta,
            ).catch(() => {});
          }
          // Alerte 80 % (une seule fois par période), au propriétaire.
          if (!alertSent && quotaUsed >= alertThreshold && quota.included > 0) {
            alertSent = true;
            await sendQuotaAlert(
              salonId,
              salon.name,
              quotaUsed,
              quota.included,
              provider,
            ).catch(() => {});
          }
        }
        await prisma.client.update({
          where: { id: client.id },
          data: { lastContactedAt: now },
        });
        summary.messagesSent++;
      } else {
        summary.messagesFailed++;
      }
    }
  }

  // Persiste le compteur de quota + l'état de l'alerte de la période.
  if (quotaUsed !== quota.used || alertSent !== salon.quotaAlertSent) {
    await prisma.salon.update({
      where: { id: salonId },
      data: { smsUsedThisPeriod: quotaUsed, quotaAlertSent: alertSent },
    });
  }

  return summary;
}

/** Envoie l'alerte « 80 % du quota SMS atteint » au propriétaire (best-effort). */
async function sendQuotaAlert(
  salonId: string,
  salonName: string,
  used: number,
  included: number,
  provider: MessagingProvider,
): Promise<void> {
  const owner = await prisma.membership.findFirst({
    where: { salonId, role: "owner" },
    include: { user: { select: { email: true } } },
  });
  const to = owner?.user.email;
  if (!to) return;
  const pct = included > 0 ? Math.round((used / included) * 100) : 0;
  await provider.sendEmail({
    to,
    subject: `${salonName} : ${pct}% de votre quota SMS utilisé`,
    html: `<div><p>Bonjour,</p><p>Vous avez utilisé <strong>${used} / ${included}</strong> segments SMS sur votre forfait ce mois-ci (${pct}%).</p><p>Au-delà de l'inclus, chaque SMS est facturé selon votre formule, dans la limite du plafond que vous avez fixé — ensuite les envois se mettent en pause. Pensez à recharger ou ajuster votre plafond si besoin.</p><p>— Revia</p></div>`,
    senderEmail: process.env.BREVO_EMAIL_SENDER ?? "contact@reviagence.com",
    senderName: salonName,
  });
}

/** Lance le scan pour tous les salons (cron quotidien). */
export async function runScanAllSalons(
  opts: { force?: boolean } = {},
): Promise<ScanSummary[]> {
  const salons = await prisma.salon.findMany({ select: { id: true } });
  const results: ScanSummary[] = [];
  for (const s of salons) {
    results.push(await runScanForSalon(s.id, opts));
  }
  return results;
}
