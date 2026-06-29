import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en résolvant les conflits (la dernière gagne).
 * Utilisé par tous les composants d'UI pour autoriser des surcharges propres.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en euros, sans décimales par défaut (les salons
 * raisonnent en euros entiers). Chiffres adaptés à un affichage tabulaire.
 */
export function formatEuros(
  amount: number,
  options?: { decimals?: boolean },
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: options?.decimals ? 2 : 0,
    maximumFractionDigits: options?.decimals ? 2 : 0,
  }).format(amount);
}
