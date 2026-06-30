/**
 * Informations légales centralisées. Les valeurs `[à compléter]` doivent être
 * renseignées par l'éditeur (et l'ensemble relu par un juriste) avant
 * exploitation commerciale réelle.
 */
export const LEGAL = {
  /** Date de dernière mise à jour affichée sur les pages légales. */
  updatedAt: "30 juin 2026",

  /** Éditeur du service. */
  companyName: "David Chen",
  legalForm: "Entrepreneur individuel (micro-entreprise)",
  capital: "", // sans objet pour une micro-entreprise
  siret: "SIRET 894 056 506 00039",
  vat: "", // TVA non applicable, art. 293 B du CGI (franchise en base)
  address: "60 rue François 1er, 75008 Paris",
  director: "David Chen",

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
