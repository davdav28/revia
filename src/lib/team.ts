import { getPlan, HIGHLIGHTED_PLAN_ID } from "@/config/brand";

/**
 * Nombre de sièges (utilisateurs) autorisés pour un salon.
 * `null` = illimité. Pendant l'essai (aucun plan choisi), on autorise les
 * limites du plan mis en avant pour que le salon puisse tester la fonction.
 */
export function seatLimitFor(salon: {
  plan: string | null;
}): number | null {
  const plan = getPlan(salon.plan);
  return (plan ?? getPlan(HIGHLIGHTED_PLAN_ID)!).maxUsers;
}

/** URL d'acceptation d'une invitation. */
export function joinUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/rejoindre/${token}`;
}

/** Libellé d'un rôle. */
export function roleLabel(role: string): string {
  return role === "owner" ? "Propriétaire" : "Équipe";
}
