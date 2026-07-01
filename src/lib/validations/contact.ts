import { z } from "zod";

/** Message de contact public (formulaire « Parler à l'équipe »). */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Votre nom est requis.").max(80),
  email: z.string().trim().email("Adresse email invalide.").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  message: z
    .string()
    .trim()
    .min(5, "Dites-nous en un peu plus.")
    .max(2000, "Message trop long."),
  // Champ piège anti-spam (doit rester vide).
  company: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
