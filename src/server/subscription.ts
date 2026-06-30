"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { BRAND, SUBSCRIPTION, getPlan, type BillingPeriod } from "@/config/brand";

const DAY = 86_400_000;

export type CheckoutResult = { url: string } | { ok: true } | { error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Démarre l'abonnement à un plan + une période (mensuel/annuel) :
 * Checkout Stripe si configuré, sinon activation démo. Réinitialise le quota.
 */
export async function startCheckout(
  planId: string,
  period: BillingPeriod = "monthly",
): Promise<CheckoutResult> {
  const member = await requireMember();
  const plan = getPlan(planId);
  if (!plan) return { error: "Plan inconnu." };

  const stripe = getStripe();

  // --- Mode démo (sans clé Stripe) : on active directement. ---
  if (!stripe) {
    const periodDays = period === "annual" ? 365 : 30;
    await prisma.salon.update({
      where: { id: member.salonId },
      data: {
        subscriptionStatus: "active",
        plan: plan.id,
        billingPeriod: period,
        currentPeriodEnd: new Date(Date.now() + periodDays * DAY),
        // Quota neuf pour la nouvelle période.
        smsUsedThisPeriod: 0,
        quotaPeriodStart: new Date(),
      },
    });
    revalidatePath("/reglages/abonnement");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  // --- Stripe réel ---
  const priceId =
    process.env[
      period === "annual" ? plan.annualPriceEnvKey : plan.monthlyPriceEnvKey
    ];
  if (!priceId) return { error: "Prix Stripe non configuré." };

  let customerId = member.salon.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: member.email,
      name: member.salon.name,
      metadata: { salonId: member.salonId },
    });
    customerId = customer.id;
    await prisma.salon.update({
      where: { id: member.salonId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Coupon « prix fondateur » appliqué si configuré.
  const founderCoupon = process.env.STRIPE_FOUNDER_COUPON?.trim();

  // Forfait + (si configuré) prix « par segment » pour facturer le dépassement.
  const meterPriceId = process.env[plan.meterPriceEnvKey]?.trim();
  const lineItems: { price: string; quantity?: number }[] = [
    { price: priceId, quantity: 1 },
  ];
  if (meterPriceId) lineItems.push({ price: meterPriceId }); // metered : sans quantité

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems,
    success_url: `${appUrl()}/reglages/abonnement?success=1`,
    cancel_url: `${appUrl()}/reglages/abonnement?canceled=1`,
    metadata: { salonId: member.salonId, plan: plan.id, period },
    subscription_data: {
      metadata: { salonId: member.salonId, plan: plan.id, period },
    },
    ...(founderCoupon ? { discounts: [{ coupon: founderCoupon }] } : {}),
  });

  if (!session.url) return { error: "Impossible de démarrer le paiement." };
  return { url: session.url };
}

/**
 * Achat d'un pack de recharge SMS (segments prépayés, sans expiration).
 * Démo : on crédite directement. Réel : Checkout Stripe (paiement unique),
 * le webhook crédite à la confirmation.
 */
export async function buyRecharge(): Promise<CheckoutResult> {
  const member = await requireMember();
  const stripe = getStripe();
  const pack = SUBSCRIPTION.rechargePack;

  if (!stripe) {
    await prisma.salon.update({
      where: { id: member.salonId },
      data: { rechargeSegments: { increment: pack.segments } },
    });
    revalidatePath("/reglages/abonnement");
    return { ok: true };
  }

  let customerId = member.salon.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: member.email,
      name: member.salon.name,
      metadata: { salonId: member.salonId },
    });
    customerId = customer.id;
    await prisma.salon.update({
      where: { id: member.salonId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: pack.priceCents,
          product_data: { name: `Recharge ${pack.segments} SMS — ${BRAND.name}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl()}/reglages/abonnement?recharge=1`,
    cancel_url: `${appUrl()}/reglages/abonnement`,
    metadata: {
      salonId: member.salonId,
      kind: "recharge",
      segments: String(pack.segments),
    },
  });

  if (!session.url) return { error: "Impossible de démarrer le paiement." };
  return { url: session.url };
}

/** Ouvre le portail de gestion Stripe (résiliation, facture…). */
export async function openBillingPortal(): Promise<CheckoutResult> {
  const member = await requireMember();
  const stripe = getStripe();
  if (!stripe || !member.salon.stripeCustomerId) {
    return { error: "Gestion indisponible en mode démo." };
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: member.salon.stripeCustomerId,
    return_url: `${appUrl()}/reglages/abonnement`,
  });
  return { url: session.url };
}

/** Règle le plafond de dépassement mensuel (en euros). */
export async function setOverageCap(
  euros: number,
): Promise<{ error?: string } | { ok: true }> {
  const member = await requireMember();
  if (!Number.isFinite(euros) || euros < 0 || euros > 1000) {
    return { error: "Plafond invalide (0 à 1000 €)." };
  }
  await prisma.salon.update({
    where: { id: member.salonId },
    data: { overageCapCents: Math.round(euros * 100) },
  });
  revalidatePath("/reglages/abonnement");
  return { ok: true };
}

/** Résiliation simulée (mode démo uniquement). */
export async function cancelSubscriptionDev(): Promise<void> {
  const member = await requireMember();
  if (getStripe()) return; // en réel, ça passe par le portail Stripe
  await prisma.salon.update({
    where: { id: member.salonId },
    data: { subscriptionStatus: "canceled" },
  });
  revalidatePath("/reglages/abonnement");
  revalidatePath("/dashboard");
}
