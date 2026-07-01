import { prisma } from "@/lib/prisma";
import { sendPushTo } from "@/lib/push";

export type NotificationType = "booking" | "recovery" | "quota" | "billing";

export type NotifyInput = {
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
};

/**
 * Notifie un salon : crée la notification in-app ET envoie un push Web à tous
 * les appareils des membres du salon. Best-effort — n'interrompt jamais
 * l'action appelante (à appeler avec `.catch(() => {})`).
 */
export async function notifySalon(
  salonId: string,
  n: NotifyInput,
): Promise<void> {
  // 1) Notification in-app (source de vérité, toujours créée).
  await prisma.notification.create({
    data: {
      salonId,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url ?? null,
    },
  });

  // 2) Push Web aux appareils des membres (best-effort).
  try {
    const members = await prisma.membership.findMany({
      where: { salonId },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);
    if (userIds.length === 0) return;

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
      select: { endpoint: true, p256dh: true, auth: true },
    });
    if (subs.length === 0) return;

    const { stale } = await sendPushTo(subs, {
      title: n.title,
      body: n.body,
      url: n.url,
    });
    if (stale.length) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: stale } },
      });
    }
  } catch {
    // Le push est un bonus : l'in-app est déjà enregistré.
  }
}
