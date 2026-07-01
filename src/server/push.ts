"use server";

import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Enregistre (ou met à jour) l'abonnement push de l'appareil courant. */
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<{ ok: true } | { error: string }> {
  const member = await requireMember();
  if (!sub.endpoint || !sub.p256dh || !sub.auth) {
    return { error: "Abonnement invalide." };
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: sub.userAgent ?? null,
      userId: member.id,
    },
    update: {
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: sub.userAgent ?? null,
      userId: member.id,
    },
  });
  return { ok: true };
}

/** Désinscrit l'appareil courant du push. */
export async function removePushSubscription(
  endpoint: string,
): Promise<{ ok: true }> {
  await requireMember();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
  return { ok: true };
}
