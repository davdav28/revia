import { getStripe } from "@/lib/stripe";

/**
 * Reporte des segments de dépassement à Stripe (facturation « metered »).
 * No-op tant que Stripe et un compteur (`STRIPE_OVERAGE_METER_EVENT`) ne sont
 * pas configurés — l'app fonctionne donc en mode démo sans rien casser.
 *
 * Côté Stripe : créer un compteur (Billing → Meters) avec un `event_name`,
 * une clé client `stripe_customer_id` et une valeur `value`, puis attacher au
 * plan un prix « par segment » basé sur ce compteur. Renseigner ensuite
 * `STRIPE_OVERAGE_METER_EVENT` avec l'event_name du compteur.
 */
export async function reportOverageSegments(
  stripeCustomerId: string | null | undefined,
  segments: number,
): Promise<void> {
  if (!stripeCustomerId || segments <= 0) return;
  const eventName = process.env.STRIPE_OVERAGE_METER_EVENT;
  const stripe = getStripe();
  if (!eventName || !stripe) return;

  try {
    await stripe.billing.meterEvents.create({
      event_name: eventName,
      payload: {
        stripe_customer_id: stripeCustomerId,
        value: String(segments),
      },
    });
  } catch {
    // Best-effort : un échec de report ne doit jamais bloquer l'envoi.
  }
}
