/**
 * Identité produit centralisée.
 *
 * Le nom du produit est un placeholder : pour le changer partout (UI, emails,
 * métadonnées, nom d'expéditeur SMS), il suffit de modifier `BRAND.name` ici.
 * Aucune autre partie du code ne doit écrire le nom en dur.
 */
export const BRAND = {
  /** Nom du produit (dérivé de « revenir »). Centralisé : changeable ici. */
  name: "Revia",
  /** Promesse en une ligne, utilisée dans les métadonnées et le hero. */
  tagline: "Vos clientes reviennent. Vous le prouvez.",
  /**
   * Description courte (SEO, partages). Pas de jargon : on parle métier.
   */
  description:
    "Revia repère les clientes qui ne reviennent plus, les relance au bon moment et vous montre le chiffre d'affaires récupéré.",
  /** Nom d'expéditeur SMS par défaut (≤ 11 caractères, contrainte opérateurs). */
  smsSenderDefault: "Revia",
  /** Locale et fuseau par défaut (marché France). */
  locale: "fr-FR",
  timezone: "Europe/Paris",
  /** Devise des montants affichés. */
  currency: "EUR",
} as const;

export type Brand = typeof BRAND;

/**
 * Drapeaux de fonctionnalités. La réservation en ligne publique par salon est
 * prévue mais désactivée pour l'instant (« à activer plus tard »).
 */
export const FEATURES = {
  // Activable par salon via Salon.bookingEnabled ; ce drapeau est le kill-switch global.
  onlineBooking: true,
} as const;

/**
 * Facturation du SaaS (Phase 5). 3 plans × (mensuel/annuel), quota SMS en
 * segments, dépassement, recharges, essai. Tout est centralisé ici, jamais en
 * dur. Les *PriceEnvKey pointent vers les IDs de prix Stripe (renseignés en
 * variables d'environnement pour la facturation réelle).
 */
export const SUBSCRIPTION = {
  // 3 plans × (mensuel + annuel). Quota = SMS inclus / mois (en segments).
  // Prix en centimes. Annuel = 2 mois offerts. Tout est ici, jamais en dur.
  plans: [
    {
      id: "essentiel",
      label: "Essentiel",
      smsQuota: 300,
      monthlyCents: 6900,
      annualCents: 69000,
      monthlyPriceEnvKey: "STRIPE_PRICE_ESSENTIEL_MONTHLY",
      annualPriceEnvKey: "STRIPE_PRICE_ESSENTIEL_ANNUAL",
      highlight: false,
    },
    {
      id: "pro",
      label: "Pro",
      smsQuota: 700,
      monthlyCents: 11900,
      annualCents: 119000,
      monthlyPriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
      annualPriceEnvKey: "STRIPE_PRICE_PRO_ANNUAL",
      highlight: true,
    },
    {
      id: "multi",
      label: "Multi",
      smsQuota: 1500,
      monthlyCents: 19900,
      annualCents: 199000,
      monthlyPriceEnvKey: "STRIPE_PRICE_MULTI_MONTHLY",
      annualPriceEnvKey: "STRIPE_PRICE_MULTI_ANNUAL",
      highlight: false,
    },
  ],

  // Dépassement & garde-fous (communs aux 3 plans).
  overagePerSegmentCents: 12, // prix de vente du segment en dépassement
  defaultOverageCapCents: 3000, // plafond de dépassement par défaut (30 €)
  quotaAlertPct: 80, // alerte à 80 % du quota

  // Pack de recharge (cumulé au quota, sans expiration).
  rechargePack: { segments: 500, priceCents: 4500 },

  // Essai.
  trial: { days: 30, recoveredEurosTarget: 300, freeSegments: 150 },
} as const;

export type Plan = (typeof SUBSCRIPTION.plans)[number];
export type PlanId = Plan["id"];
export type BillingPeriod = "monthly" | "annual";

/** Plan par défaut mis en avant. */
export const HIGHLIGHTED_PLAN_ID: PlanId = "pro";

export function getPlan(id: string | null | undefined): Plan | undefined {
  return SUBSCRIPTION.plans.find((p) => p.id === id);
}

/** Quota SMS mensuel d'un plan (0 si plan inconnu). */
export function planQuota(id: string | null | undefined): number {
  return getPlan(id)?.smsQuota ?? 0;
}
