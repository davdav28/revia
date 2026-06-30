/**
 * Informations légales centralisées. Les valeurs `[à compléter]` doivent être
 * renseignées par l'éditeur (et l'ensemble relu par un juriste) avant
 * exploitation commerciale réelle.
 */
export const LEGAL = {
  /** Date de dernière mise à jour affichée sur les pages légales. */
  updatedAt: "30 juin 2026",

  /** Éditeur du service. */
  companyName: "[Raison sociale à compléter]",
  legalForm: "[Forme juridique à compléter — ex. micro-entreprise, SASU]",
  capital: "", // ex. "1 000 €" si société ; vide pour micro-entreprise
  siret: "[SIREN / SIRET à compléter]",
  vat: "", // n° TVA intracommunautaire si applicable
  address: "[Adresse du siège à compléter]",
  director: "[Nom du responsable de la publication à compléter]",

  /** Contact & site. */
  contactEmail: "contact@reviagence.com",
  websiteUrl: "https://reviagence.com",
  websiteLabel: "reviagence.com",

  /** Hébergeur de l'application. */
  host: {
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
    note: "Données applicatives servies depuis la région de Paris (cdg1).",
  },

  /**
   * Sous-traitants ultérieurs (au sens RGPD) mobilisés pour fournir le service.
   */
  subprocessors: [
    {
      name: "Vercel Inc.",
      purpose: "Hébergement de l'application",
      location: "UE / États-Unis (clauses contractuelles types)",
    },
    {
      name: "Supabase",
      purpose: "Base de données et authentification",
      location: "Union européenne (Irlande)",
    },
    {
      name: "Brevo (Sendinblue SAS)",
      purpose: "Acheminement des emails et SMS",
      location: "Union européenne (France)",
    },
    {
      name: "Stripe",
      purpose: "Paiement des abonnements",
      location: "UE / États-Unis (clauses contractuelles types)",
    },
  ],
} as const;
