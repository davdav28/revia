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
  | {
      url: string;
      salonName: string;
      includedSms: number;
      overageCents: number;
    }
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
  /** SMS inclus / mois. Vide → quota standard du plan Multi. */
  includedSms?: number | null;
  /** Prix du surplus, en centimes/SMS. Vide → prix standard du plan Multi. */
  overageCents?: number | null;
}): Promise<CustomCheckoutResult> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  const period: BillingPeriod = input.period === "annual" ? "annual" : "monthly";
  const amount = Number(input.amountEuros);
  if (!email) return { error: "Email du client requis." };
  if (!Number.isFinite(amount) || amount < 1 || amount > 10_000) {
    return { error: "Montant invalide (1 à 10 000 €)." };
  }

  // Overrides sur-mesure (facultatifs) : SMS inclus + prix du surplus.
  const hasIncluded =
    input.includedSms !== null &&
    input.includedSms !== undefined &&
    `${input.includedSms}` !== "";
  const includedSms = hasIncluded ? Number(input.includedSms) : null;
  if (includedSms !== null && (!Number.isInteger(includedSms) || includedSms < 0 || includedSms > 1_000_000)) {
    return { error: "SMS inclus invalide (0 à 1 000 000)." };
  }
  const hasOverage =
    input.overageCents !== null &&
    input.overageCents !== undefined &&
    `${input.overageCents}` !== "";
  const overageCents = hasOverage ? Number(input.overageCents) : null;
  if (overageCents !== null && (!Number.isFinite(overageCents) || overageCents < 1 || overageCents > 100)) {
    return { error: "Prix du surplus invalide (1 à 100 centimes/SMS)." };
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

  const interval = period === "annual" ? "year" : "month";

  try {
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

    // Prix de base : un vrai objet Price (plus fiable qu'un price_data inline
    // lorsqu'on le combine à un prix « metered » dans un même abonnement).
    const basePrice = await stripe.prices.create({
      currency: "eur",
      unit_amount: Math.round(amount * 100),
      recurring: { interval },
      product_data: { name: `${BRAND.name} Multi — offre sur-mesure` },
    });
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: basePrice.id, quantity: 1 },
    ];

    // Facturation du dépassement (metered).
    const meterPriceId = process.env[multi.meterPriceEnvKey]?.trim();
    if (meterPriceId) {
      if (overageCents !== null) {
        // Prix du surplus sur-mesure : on calque un prix metered sur le
        // compteur Stripe existant (même compteur/produit), au tarif négocié.
        const base = await stripe.prices.retrieve(meterPriceId);
        const meterId =
          typeof base.recurring?.meter === "string"
            ? base.recurring.meter
            : undefined;
        const productId =
          typeof base.product === "string" ? base.product : base.product.id;
        const customMeterPrice = await stripe.prices.create({
          currency: "eur",
          unit_amount: overageCents,
          nickname: `Surplus SMS sur-mesure — ${overageCents} c`,
          product: productId,
          recurring: meterId
            ? { interval, meter: meterId }
            : { interval, usage_type: "metered" },
        });
        lineItems.push({ price: customMeterPrice.id });
      } else {
        lineItems.push({ price: meterPriceId });
      }
    }

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

    // Overrides mémorisés seulement une fois le lien créé avec succès.
    await prisma.salon.update({
      where: { id: salon.id },
      data: { customSmsQuota: includedSms, customOverageCents: overageCents },
    });

    return {
      url: session.url,
      salonName: salon.name,
      includedSms: includedSms ?? multi.smsQuota,
      overageCents: overageCents ?? multi.overageCents,
    };
  } catch (e) {
    // On ne laisse jamais l'exception faire planter la page : on la remonte.
    const msg = e instanceof Error ? e.message : "erreur inconnue";
    return { error: `Stripe : ${msg}` };
  }
}
