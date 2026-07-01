"use server";

import type Stripe from "stripe";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { BRAND, getPlan, type BillingPeriod } from "@/config/brand";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export type CustomCheckoutResult =
  | { url: string; salonName: string }
  | { error: string };

/**
 * Génère un lien de paiement Stripe pour un abonnement Multi à un tarif
 * sur-mesure (prix ad-hoc), rattaché au salon du client via l'email de son
 * compte. Le webhook reconnaît le plan grâce aux métadonnées `plan: multi`.
 * Réservé au fondateur.
 */
export async function createCustomMultiCheckout(input: {
  email: string;
  amountEuros: number;
  period: BillingPeriod;
}): Promise<CustomCheckoutResult> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  const period: BillingPeriod = input.period === "annual" ? "annual" : "monthly";
  const amount = Number(input.amountEuros);
  if (!email) return { error: "Email du client requis." };
  if (!Number.isFinite(amount) || amount < 1 || amount > 10_000) {
    return { error: "Montant invalide (1 à 10 000 €)." };
  }

  const stripe = getStripe();
  if (!stripe) return { error: "Stripe non configuré (mode démo)." };

  // Retrouver le salon du client via l'email de son compte.
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { memberships: { include: { salon: true } } },
  });
  if (!user || user.memberships.length === 0) {
    return {
      error:
        "Aucun compte trouvé pour cet email. Demande au client de créer son compte d'abord.",
    };
  }
  // On privilégie un salon dont il est propriétaire, sinon le premier.
  const membership =
    user.memberships.find((m) => m.role === "owner") ?? user.memberships[0];
  const salon = membership.salon;

  const multi = getPlan("multi");
  if (!multi) return { error: "Plan Multi introuvable." };

  // Client Stripe (réutilise celui du salon si déjà créé).
  let customerId = salon.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: salon.name,
      metadata: { salonId: salon.id },
    });
    customerId = customer.id;
    await prisma.salon.update({
      where: { id: salon.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Prix ad-hoc (sur-mesure) : pas besoin de créer un objet Price au préalable.
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "eur",
        unit_amount: Math.round(amount * 100),
        recurring: { interval: period === "annual" ? "year" : "month" },
        product_data: {
          name: `${BRAND.name} Multi — offre sur-mesure`,
        },
      },
      quantity: 1,
    },
  ];
  // Facturation du dépassement (metered) si le prix est configuré.
  const meterPriceId = process.env[multi.meterPriceEnvKey]?.trim();
  if (meterPriceId) lineItems.push({ price: meterPriceId });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems,
    success_url: `${appUrl()}/reglages/abonnement?success=1`,
    cancel_url: `${appUrl()}/reglages/abonnement?canceled=1`,
    metadata: { salonId: salon.id, plan: "multi", period },
    subscription_data: {
      metadata: { salonId: salon.id, plan: "multi", period },
    },
  });

  if (!session.url) return { error: "Impossible de générer le lien." };
  return { url: session.url, salonName: salon.name };
}
