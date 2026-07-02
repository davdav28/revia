import { prisma } from "@/lib/prisma";
import { getMessagingProvider } from "@/lib/messaging";
import { renderTemplate } from "@/lib/templates";
import { withStopNotice, SUBSCRIPTION } from "@/config/brand";
import { countSegments } from "@/lib/sms-segments";
import { getQuotaStatus } from "@/lib/quota";
import { reportOverageSegments, endTrialNow } from "@/lib/billing-usage";
import { optOutUrl } from "@/lib/opt-out";
import { bookingUrl } from "@/lib/slug";

const DAY = 86_400_000;

export type DeliverResult = {
  sent: number;
  failed: number;
  skipped: { optedOut: number; noConsent: number; quotaCap: number };
};

const EMPTY: DeliverResult = {
  sent: 0,
  failed: 0,
  skipped: { optedOut: 0, noConsent: 0, quotaCap: 0 },
};

/**
 * Envoie un modèle à une liste de clients (envoi manuel ou automatisation
 * « créneau libéré »). Respecte : opt-out, consentement, quota + plafond de
 * dépassement, mention STOP, décompte metered, fin d'essai à 150 SMS.
 * Met à jour le quota du salon et `lastContactedAt` des clients contactés.
 */
export async function deliverToClients(params: {
  salonId: string;
  templateId: string;
  clientIds: string[];
  extraVars?: { jour?: string; offre?: string };
}): Promise<DeliverResult> {
  if (params.clientIds.length === 0) return EMPTY;

  const salon = await prisma.salon.findUnique({
    where: { id: params.salonId },
  });
  if (!salon) return EMPTY;

  const template = await prisma.messageTemplate.findFirst({
    where: { id: params.templateId, salonId: params.salonId },
  });
  if (!template) return EMPTY;

  const clients = await prisma.client.findMany({
    where: { id: { in: params.clientIds }, salonId: params.salonId },
  });

  const channel = template.channel;
  const quota = getQuotaStatus(salon);
  let quotaUsed = quota.used;
  const quotaTotal = quota.totalAllowed;
  const now = new Date();
  const provider = getMessagingProvider();
  const lien =
    salon.bookingEnabled && salon.slug ? bookingUrl(salon.slug) : "";

  const result: DeliverResult = {
    sent: 0,
    failed: 0,
    skipped: { optedOut: 0, noConsent: 0, quotaCap: 0 },
  };
  const contactedIds: string[] = [];

  const needsPresta =
    template.body.includes("derniere_presta") ||
    (template.subject?.includes("derniere_presta") ?? false);

  for (const client of clients) {
    if (client.optedOutAt) {
      result.skipped.optedOut++;
      continue;
    }
    const reachable =
      channel === "sms"
        ? client.smsConsent && !!client.phone
        : client.emailConsent && !!client.email;
    if (!reachable) {
      result.skipped.noConsent++;
      continue;
    }

    let dernierePresta = "";
    if (needsPresta) {
      const last = await prisma.appointment.findFirst({
        where: {
          salonId: params.salonId,
          clientId: client.id,
          status: "completed",
          serviceId: { not: null },
        },
        orderBy: { startAt: "desc" },
        include: { service: { select: { name: true } } },
      });
      dernierePresta = last?.service?.name ?? "";
    }

    const weeks = client.lastVisitAt
      ? Math.floor((now.getTime() - client.lastVisitAt.getTime()) / (7 * DAY))
      : "";
    const vars = {
      prenom: client.firstName,
      salon: salon.name,
      semaines: weeks,
      derniere_presta: dernierePresta,
      lien,
      offre: params.extraVars?.offre ?? "",
      jour: params.extraVars?.jour ?? "",
    };
    const rendered = renderTemplate(template.body, vars);
    const body = channel === "sms" ? withStopNotice(rendered) : rendered;
    const subject = template.subject
      ? renderTemplate(template.subject, vars)
      : null;

    const segments = channel === "sms" ? countSegments(body) : 1;
    if (channel === "sms" && quotaUsed + segments > quotaTotal) {
      result.skipped.quotaCap++;
      continue;
    }

    let sendRes;
    let to: string;
    if (channel === "sms") {
      to = client.phone!;
      sendRes = await provider.sendSms({ to, sender: salon.senderName, body });
    } else {
      to = client.email!;
      const html = `<div>${body.replace(/\n/g, "<br>")}</div><p style="margin-top:24px;font-size:12px;color:#6b5d67"><a href="${optOutUrl(
        client.id,
      )}">Se désabonner</a></p>`;
      sendRes = await provider.sendEmail({
        to,
        subject: subject ?? salon.name,
        html,
        senderEmail: process.env.BREVO_EMAIL_SENDER ?? "contact@reviagence.com",
        senderName: salon.senderName,
      });
    }

    await prisma.message.create({
      data: {
        salonId: params.salonId,
        clientId: client.id,
        templateId: template.id,
        channel,
        segments,
        to,
        subject,
        body,
        status: sendRes.ok ? "sent" : "failed",
        costCents: sendRes.ok ? (sendRes.costCents ?? null) : null,
        providerId: sendRes.ok ? (sendRes.providerId ?? null) : null,
        error: sendRes.ok ? null : sendRes.error,
        sentAt: sendRes.ok ? now : null,
      },
    });

    if (sendRes.ok) {
      result.sent++;
      contactedIds.push(client.id);
      if (channel === "sms") {
        const usedBefore = quotaUsed;
        quotaUsed += segments;
        const trialCap = SUBSCRIPTION.trial.freeSegments;
        if (
          salon.subscriptionStatus === "trial" &&
          usedBefore < trialCap &&
          quotaUsed >= trialCap
        ) {
          await endTrialNow(salon.stripeSubscriptionId).catch(() => {});
        }
        const overageDelta =
          Math.max(0, quotaUsed - quota.included) -
          Math.max(0, usedBefore - quota.included);
        if (overageDelta > 0) {
          await reportOverageSegments(
            salon.stripeCustomerId,
            overageDelta,
          ).catch(() => {});
        }
      }
    } else {
      result.failed++;
    }
  }

  if (channel === "sms" && quotaUsed !== quota.used) {
    await prisma.salon.update({
      where: { id: params.salonId },
      data: { smsUsedThisPeriod: quotaUsed },
    });
  }
  if (contactedIds.length) {
    await prisma.client.updateMany({
      where: { id: { in: contactedIds } },
      data: { lastContactedAt: now },
    });
  }

  return result;
}
