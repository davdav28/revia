"use server";

import { prisma } from "@/lib/prisma";
import { verifyOptOutToken } from "@/lib/opt-out";

/**
 * Désabonnement public : aucune authentification, mais le jeton est signé
 * (HMAC) donc seul un lien légitime fonctionne. Coupe tout contact futur.
 */
export async function confirmOptOut(token: string): Promise<{ ok: boolean }> {
  const clientId = verifyOptOutToken(token);
  if (!clientId) return { ok: false };
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { optedOutAt: new Date(), smsConsent: false, emailConsent: false },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
