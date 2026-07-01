import webpush from "web-push";

let configured = false;

/** Configure web-push avec les clés VAPID. Renvoie false si non configuré. */
function ensureConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@reviagence.com";
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
}

export function isPushConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY
  );
}

export type PushPayload = { title: string; body: string; url?: string };
export type PushSub = { endpoint: string; p256dh: string; auth: string };

/**
 * Envoie une notification push à une liste d'abonnements. Best-effort :
 * renvoie le nombre d'envois réussis et les endpoints périmés (à supprimer).
 */
export async function sendPushTo(
  subs: PushSub[],
  payload: PushPayload,
): Promise<{ sent: number; stale: string[] }> {
  if (!ensureConfigured() || subs.length === 0) return { sent: 0, stale: [] };
  const stale: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) stale.push(s.endpoint);
      }
    }),
  );
  return { sent, stale };
}
