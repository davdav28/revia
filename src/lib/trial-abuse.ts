import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/** Empreinte de la carte par défaut d'un abonnement (via l'abonnement ou le client). */
async function cardFingerprint(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<string | null> {
  let pmId: string | null =
    typeof sub.default_payment_method === "string"
      ? sub.default_payment_method
      : (sub.default_payment_method?.id ?? null);

  // Sinon, on prend le moyen de paiement par défaut du client.
  if (!pmId) {
    const cust = await stripe.customers.retrieve(String(sub.customer));
    if (!("deleted" in cust) || !cust.deleted) {
      const dpm = (cust as Stripe.Customer).invoice_settings
        ?.default_payment_method;
      pmId = typeof dpm === "string" ? dpm : (dpm?.id ?? null);
    }
  }
  if (!pmId) return null;

  const pm = await stripe.paymentMethods.retrieve(pmId);
  return pm.card?.fingerprint ?? null;
}

/**
 * Anti-abus d'essai : un seul essai gratuit par carte bancaire.
 * Si la carte de cet abonnement a déjà servi à un essai sur un AUTRE salon,
 * on met fin à l'essai immédiatement (débit direct — plus de gratuité).
 * Best-effort : ne bloque jamais le flux. Renvoie true si l'essai a été coupé.
 */
export async function enforceOneTrialPerCard(
  stripe: Stripe,
  sub: Stripe.Subscription,
  salonId: string,
): Promise<boolean> {
  if (sub.status !== "trialing") return false;
  try {
    const fingerprint = await cardFingerprint(stripe, sub);
    if (!fingerprint) return false;

    const existing = await prisma.trialCard.findUnique({
      where: { fingerprint },
    });

    if (existing && existing.salonId !== salonId) {
      // Carte déjà utilisée pour un essai ailleurs → on coupe l'essai.
      await stripe.subscriptions
        .update(sub.id, { trial_end: "now" })
        .catch(() => {});
      return true;
    }
    if (!existing) {
      // Première utilisation de cette carte → on l'enregistre.
      await prisma.trialCard
        .create({ data: { fingerprint, salonId } })
        .catch(() => {});
    }
    return false;
  } catch {
    return false;
  }
}
