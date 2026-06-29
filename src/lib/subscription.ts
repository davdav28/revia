/** Statuts d'abonnement donnant accès aux fonctions payantes (envoi de relances). */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["trial", "active"];

export function isSubscriptionActive(
  status: string | null | undefined,
): boolean {
  return !!status && ACTIVE_SUBSCRIPTION_STATUSES.includes(status);
}

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
};
