"use server";

import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Marque une notification du salon actif comme lue. */
export async function markNotificationRead(
  id: string,
): Promise<{ ok: true }> {
  const member = await requireMember();
  await prisma.notification.updateMany({
    where: { id, salonId: member.salonId, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

/** Marque toutes les notifications non lues du salon actif comme lues. */
export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  const member = await requireMember();
  await prisma.notification.updateMany({
    where: { salonId: member.salonId, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
