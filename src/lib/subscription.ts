/** Statuts d'abonnement donnant accès aux fonctions payantes (envoi de relances). */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["trial", "active"];

export function isSubscriptionActive(
  status: string | null | undefined,
): boolean {
  return !!status && ACTIVE_SUBSCRIPTION_STATUSES.includes(status);
}

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  incomplete: "À finaliser",
  trial: "Essai",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
};

/** Compte créé mais sans carte : l'essai n'a pas encore démarré. */
export function isIncomplete(status: string | null | undefined): boolean {
  return status === "incomplete";
}
