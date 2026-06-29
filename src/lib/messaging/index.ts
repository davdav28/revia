import type { MessagingProvider } from "./types";
import { BrevoProvider } from "./brevo";
import { MockProvider } from "./mock";

export type { MessagingProvider, SendResult } from "./types";

/**
 * Sélectionne le fournisseur d'envoi : Brevo si une clé API est configurée,
 * sinon le fournisseur factice (dev). Permet de tout tester sans compte Brevo.
 */
export function getMessagingProvider(): MessagingProvider {
  const key = process.env.BREVO_API_KEY;
  if (key && key.trim()) return new BrevoProvider(key);
  return new MockProvider();
}

export function isRealMessagingConfigured(): boolean {
  return !!process.env.BREVO_API_KEY?.trim();
}
