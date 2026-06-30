import type {
  MessagingProvider,
  SendResult,
  SmsParams,
  EmailParams,
} from "./types";

const BREVO_API = "https://api.brevo.com/v3";

/**
 * Fournisseur Brevo (ex-Sendinblue) — société française, RGPD-friendly.
 * SMS marketing + email transactionnel via une seule API.
 */
export class BrevoProvider implements MessagingProvider {
  readonly name = "brevo";
  constructor(private apiKey: string) {}

  private headers() {
    return {
      "api-key": this.apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    };
  }

  async sendSms(p: SmsParams): Promise<SendResult> {
    try {
      const res = await fetch(`${BREVO_API}/transactionalSMS/sms`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          type: "marketing",
          sender: p.sender.slice(0, 11),
          recipient: p.to,
          content: p.body,
          unicodeEnabled: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.message ?? `Brevo SMS ${res.status}` };
      }
      // Brevo renvoie le nombre de crédits SMS utilisés (~0,045 €/SMS FR).
      const credits =
        typeof data.usedCredits === "number" ? data.usedCredits : 1;
      return {
        ok: true,
        providerId: String(data.reference ?? data.messageId ?? ""),
        costCents: Math.round(credits * 4.5),
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur SMS",
      };
    }
  }

  async sendEmail(p: EmailParams): Promise<SendResult> {
    try {
      const res = await fetch(`${BREVO_API}/smtp/email`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          sender: { email: p.senderEmail, name: p.senderName },
          to: [{ email: p.to }],
          subject: p.subject,
          htmlContent: p.html,
          ...(p.replyTo ? { replyTo: p.replyTo } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error: data?.message ?? `Brevo email ${res.status}`,
        };
      }
      return {
        ok: true,
        providerId: String(data.messageId ?? ""),
        costCents: 0,
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur email",
      };
    }
  }
}
