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
 * Abonnement du SaaS. `monthlyCents` sert de référence ROI. Les `plans`
 * alimentent la page de tarifs et Stripe (priceEnvKey = ID de prix Stripe).
 */
export const SUBSCRIPTION = {
  monthlyCents: 4900, // 49 € / mois (référence ROI)
  plans: [
    {
      id: "monthly",
      label: "Mensuel",
      priceCents: 4900,
      period: "mois",
      highlight: false,
      note: "Sans engagement",
      priceEnvKey: "STRIPE_PRICE_MONTHLY",
    },
    {
      id: "annual",
      label: "Annuel",
      priceCents: 49000,
      period: "an",
      highlight: true,
      note: "2 mois offerts",
      priceEnvKey: "STRIPE_PRICE_ANNUAL",
    },
  ],
} as const;

export type PlanId = (typeof SUBSCRIPTION.plans)[number]["id"];
