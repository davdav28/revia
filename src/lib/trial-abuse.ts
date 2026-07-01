import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

/** Carte par défaut d'un abonnement (via l'abonnement ou le client). */
async function cardOf(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<Stripe.PaymentMethod.Card | null> {
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
  return pm.card ?? null;
}

/**
 * Anti-abus d'essai. Deux garde-fous, sans aucune friction pour un vrai client :
 *  1. Cartes prépayées / virtuelles (jetables) → pas d'essai gratuit.
 *  2. Une carte = un seul essai (empreinte stable, même entre comptes).
 * Si l'un se déclenche, l'essai est coupé immédiatement (trial_end:now → débit
 * direct). Best-effort : ne bloque jamais le flux. Renvoie true si coupé.
 */
export async function enforceTrialEligibility(
  stripe: Stripe,
  sub: Stripe.Subscription,
  salonId: string,
): Promise<boolean> {
  if (sub.status !== "trialing") return false;
  try {
    const card = await cardOf(stripe, sub);
    if (!card) return false;

    // 1) Carte prépayée / virtuelle → l'outil n°1 du multi-essai : pas de gratuité.
    if (card.funding === "prepaid") {
      await stripe.subscriptions
        .update(sub.id, { trial_end: "now" })
        .catch(() => {});
      return true;
    }

    // 2) Un essai gratuit par carte (empreinte).
    const fingerprint = card.fingerprint;
    if (!fingerprint) return false;

    const existing = await prisma.trialCard.findUnique({
      where: { fingerprint },
    });
    if (existing && existing.salonId !== salonId) {
      await stripe.subscriptions
        .update(sub.id, { trial_end: "now" })
        .catch(() => {});
      return true;
    }
    if (!existing) {
      await prisma.trialCard
        .create({ data: { fingerprint, salonId } })
        .catch(() => {});
    }
    return false;
  } catch {
    return false;
  }
}
