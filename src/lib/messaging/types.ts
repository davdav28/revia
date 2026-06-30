export type SendResult =
  | { ok: true; providerId?: string; costCents?: number }
  | { ok: false; error: string };

export type SmsParams = { to: string; body: string; sender: string };
export type EmailParams = {
  to: string;
  subject: string;
  html: string;
  senderEmail: string;
  senderName: string;
  /** Adresse à laquelle vont les réponses (« Répondre ») — ex. l'email du salon. */
  replyTo?: { email: string; name?: string };
};

/**
 * Abstraction d'envoi. Implémentations : Brevo (réel) et Mock (dev).
 * Permet de changer de fournisseur (Twilio en secours) sans toucher au moteur.
 */
export interface MessagingProvider {
  readonly name: string;
  sendSms(p: SmsParams): Promise<SendResult>;
  sendEmail(p: EmailParams): Promise<SendResult>;
}
