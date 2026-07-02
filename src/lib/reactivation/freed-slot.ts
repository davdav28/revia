import { prisma } from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/subscription";
import { deliverToClients } from "./deliver";
import { notifySalon } from "@/lib/notifications";

const MAX_SLOT_OFFERS = 4; // on ne propose pas UNE place à toute la base
const RECENT_CONTACT_DAYS = 7;
const DAY = 86_400_000;

/**
 * Un rendez-vous vient d'être annulé → on propose automatiquement le créneau
 * libéré à quelques clients dormants proches (garde-fous stricts pour éviter le
 * spam). Best-effort : n'interrompt jamais l'action d'annulation.
 */
export async function offerFreedSlot(
  salonId: string,
  slot: { startAt: Date; clientId: string },
): Promise<void> {
  const now = new Date();
  // On ne remplit qu'un créneau à venir.
  if (slot.startAt.getTime() <= now.getTime()) return;

  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { subscriptionStatus: true, timezone: true },
  });
  if (!salon || !isSubscriptionActive(salon.subscriptionStatus)) return;

  const template = await prisma.messageTemplate.findFirst({
    where: { salonId, isActive: true, scenario: "slot", channel: "sms" },
    orderBy: { name: "asc" },
  });
  if (!template) return;

  const recentThreshold = new Date(now.getTime() - RECENT_CONTACT_DAYS * DAY);
  const candidates = await prisma.client.findMany({
    where: {
      salonId,
      status: { in: ["at_risk", "dormant"] },
      optedOutAt: null,
      smsConsent: true,
      phone: { not: null },
      id: { not: slot.clientId },
      OR: [
        { lastContactedAt: null },
        { lastContactedAt: { lt: recentThreshold } },
      ],
    },
    orderBy: { lastVisitAt: "desc" }, // les dormants les plus « chauds » d'abord
    take: MAX_SLOT_OFFERS,
    select: { id: true },
  });
  if (candidates.length === 0) return;

  const jour = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: salon.timezone,
  }).format(slot.startAt);

  const res = await deliverToClients({
    salonId,
    templateId: template.id,
    clientIds: candidates.map((c) => c.id),
    extraVars: { jour },
  });

  if (res.sent > 0) {
    await notifySalon(salonId, {
      type: "booking",
      title: "Créneau libéré proposé",
      body: `Le créneau du ${jour} a été proposé à ${res.sent} client${res.sent > 1 ? "s" : ""}.`,
      url: "/agenda",
    }).catch(() => {});
  }
}
