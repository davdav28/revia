"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { SUBSCRIPTION } from "@/config/brand";

const DAY = 86_400_000;

export type CheckoutResult = { url: string } | { ok: true } | { error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Démarre l'abonnement : Checkout Stripe si configuré, sinon activation démo. */
export async function startCheckout(planId: string): Promise<CheckoutResult> {
  const member = await requireMember();
  const plan = SUBSCRIPTION.plans.find((p) => p.id === planId);
  if (!plan) return { error: "Plan inconnu." };

  const stripe = getStripe();

  // --- Mode démo (sans clé Stripe) : on active directement. ---
  if (!stripe) {
    const periodDays = plan.id === "annual" ? 365 : 30;
    await prisma.salon.update({
      where: { id: member.salonId },
      data: {
        subscriptionStatus: "active",
        plan: plan.id,
        currentPeriodEnd: new Date(Date.now() + periodDays * DAY),
      },
    });
    revalidatePath("/reglages/abonnement");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  // --- Stripe réel ---
  const priceId = process.env[plan.priceEnvKey];
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/reglages/abonnement?success=1`,
    cancel_url: `${appUrl()}/reglages/abonnement?canceled=1`,
    metadata: { salonId: member.salonId, plan: plan.id },
    subscription_data: { metadata: { salonId: member.salonId } },
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
