import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Traduit le statut d'abonnement Stripe vers le nôtre. */
function mapStatus(s: string): string {
  if (s === "trialing") return "trial";
  if (s === "active") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

/** Lit `current_period_end` quelle que soit la forme de l'objet Stripe. */
function periodEndOf(sub: Stripe.Subscription): number | undefined {
  const direct = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  if (direct) return direct;
  // Nouvelles versions : la période est portée par l'item d'abonnement.
  return sub.items?.data?.[0]?.current_period_end ?? undefined;
}

/** Synchronise l'état d'abonnement (statut, plan, période) depuis Stripe. */
async function applySubscription(sub: Stripe.Subscription) {
  const salonId = sub.metadata?.salonId;
  const where = salonId
    ? { id: salonId }
    : { stripeCustomerId: String(sub.customer) };
  const periodEnd = periodEndOf(sub);
  const plan = sub.metadata?.plan;
  const period = sub.metadata?.period;

  await prisma.salon.updateMany({
    where,
    data: {
      subscriptionStatus: mapStatus(sub.status),
      stripeSubscriptionId: sub.id,
      ...(plan ? { plan } : {}),
      ...(period ? { billingPeriod: period } : {}),
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

/** Remet le quota SMS à zéro pour une nouvelle période de facturation. */
async function resetQuota(
  where: { id: string } | { stripeCustomerId: string },
  periodEndTs?: number,
) {
  await prisma.salon.updateMany({
    where,
    data: {
      smsUsedThisPeriod: 0,
      quotaPeriodStart: new Date(),
      quotaAlertSent: false,
      ...(periodEndTs ? { currentPeriodEnd: new Date(periodEndTs * 1000) } : {}),
    },
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return new NextResponse("Stripe non configuré", { status: 400 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new NextResponse("Signature invalide", { status: 400 });
  }

  try {
    switch (event.type) {
      // Nouvel abonnement payé → on l'active et on démarre une période neuve.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const salonId = session.metadata?.salonId;
        if (salonId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            String(session.subscription),
          );
          await applySubscription(sub);
          await resetQuota({ id: salonId }, periodEndOf(sub));
        }
        break;
      }

      // Changement de plan / renouvellement / résiliation.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object as Stripe.Subscription);
        break;

      // Facture payée = nouvelle période → remise à zéro du quota.
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          await resetQuota(
            { stripeCustomerId: String(invoice.customer) },
            periodEnd,
          );
        }
        break;
      }
    }
  } catch {
    return new NextResponse("Erreur de traitement", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
