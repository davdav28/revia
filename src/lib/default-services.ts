/**
 * Catalogue de prestations onglerie types, pour pré-remplir un salon.
 * `defaultIntervalDays` = cycle de retour attendu (null = prestation ponctuelle).
 */
export const DEFAULT_SERVICES: {
  name: string;
  priceCents: number;
  defaultIntervalDays: number | null;
}[] = [
  {
    name: "Pose gel (pose complète)",
    priceCents: 4500,
    defaultIntervalDays: 28,
  },
  { name: "Pose semi-permanent", priceCents: 3500, defaultIntervalDays: 21 },
  { name: "Remplissage gel", priceCents: 3000, defaultIntervalDays: 21 },
  { name: "Nail art", priceCents: 1000, defaultIntervalDays: null },
  { name: "Dépose", priceCents: 1500, defaultIntervalDays: null },
];
