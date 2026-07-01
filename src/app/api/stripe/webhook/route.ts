import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { notifySalon } from "@/lib/notifications";
import { enforceTrialEligibility } from "@/lib/trial-abuse";

export const dynamic = "force-dynamic";

/** Retrouve le salon rattaché à un client Stripe. */
async function salonIdForCustomer(
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;
  const s = await prisma.salon.findFirst({
    where: { stripeCustomerId: String(customerId) },
    select: { id: true },
  });
  return s?.id ?? null;
}

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

        // Achat d'un pack de recharge (paiement unique) → on crédite.
        if (session.metadata?.kind === "recharge") {
          const segs = Number(session.metadata.segments ?? 0);
          if (salonId && segs > 0) {
            await prisma.salon.update({
              where: { id: salonId },
              data: { rechargeSegments: { increment: segs } },
            });
          }
          break;
        }

        if (salonId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            String(session.subscription),
            { expand: ["default_payment_method"] },
          );
          await applySubscription(sub);
          await resetQuota({ id: salonId }, periodEndOf(sub));
          // Anti-abus : pas d'essai pour carte prépayée/réutilisée.
          const trialCut = await enforceTrialEligibility(
            stripe,
            sub,
            salonId,
          ).catch(() => false);
          const onTrial = sub.status === "trialing" && !trialCut;
          await notifySalon(salonId, {
            type: "billing",
            title: onTrial
              ? "Votre essai Revia a démarré 🎉"
              : "Votre abonnement Revia est actif 🎉",
            body: "Vos relances sont activées. Bienvenue !",
            url: "/reglages/abonnement",
          }).catch(() => {});
        }
        break;
      }

      // Changement de plan / renouvellement / résiliation.
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await applySubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(sub);
        const sid = sub.metadata?.salonId ?? (await salonIdForCustomer(sub.customer as string));
        if (sid) {
          await notifySalon(sid, {
            type: "billing",
            title: "Abonnement résilié",
            body: "Vos relances sont en pause. Vous pouvez réactiver quand vous voulez.",
            url: "/reglages/abonnement",
          }).catch(() => {});
        }
        break;
      }

      // Échec de paiement → on prévient pour éviter la coupure.
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const sid = await salonIdForCustomer(invoice.customer as string);
        if (sid) {
          await notifySalon(sid, {
            type: "billing",
            title: "Paiement échoué",
            body: "Mettez à jour votre moyen de paiement pour continuer vos relances.",
            url: "/reglages/abonnement",
          }).catch(() => {});
        }
        break;
      }

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
