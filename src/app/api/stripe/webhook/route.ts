import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Traduit le statut d'abonnement Stripe vers le nôtre. */
function mapStatus(s: string): string {
  if (s === "active" || s === "trialing")
    return s === "trialing" ? "trial" : "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

async function updateBySubscription(sub: Stripe.Subscription) {
  const salonId = sub.metadata?.salonId;
  const where = salonId
    ? { id: salonId }
    : { stripeCustomerId: String(sub.customer) };
  const periodEnd = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  await prisma.salon.updateMany({
    where,
    data: {
      subscriptionStatus: mapStatus(sub.status),
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const salonId = session.metadata?.salonId;
        if (salonId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            String(session.subscription),
          );
          await prisma.salon.update({
            where: { id: salonId },
            data: {
              subscriptionStatus: mapStatus(sub.status),
              stripeSubscriptionId: sub.id,
              plan: session.metadata?.plan ?? null,
            },
          });
          await updateBySubscription(sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await updateBySubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch {
    return new NextResponse("Erreur de traitement", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
