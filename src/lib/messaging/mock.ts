import type {
  MessagingProvider,
  SendResult,
  SmsParams,
  EmailParams,
} from "./types";

/**
 * Fournisseur factice (dev / sans clé Brevo) : « envoie » en loggant et
 * réussit toujours. Coûts estimés réalistes pour alimenter le suivi.
 */
export class MockProvider implements MessagingProvider {
  readonly name = "mock";

  async sendSms(p: SmsParams): Promise<SendResult> {
    console.log(`[mock sms → ${p.to}] (${p.sender}) ${p.body}`);
    return { ok: true, providerId: `mock_${Date.now()}`, costCents: 7 };
  }

  async sendEmail(p: EmailParams): Promise<SendResult> {
    console.log(`[mock email → ${p.to}] ${p.subject}`);
    return { ok: true, providerId: `mock_${Date.now()}`, costCents: 0 };
  }
}
