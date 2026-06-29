import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => v || "")
  .refine(
    (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    "Adresse email invalide.",
  );

/** Champs éditables d'une cliente (ajout / modification manuels). */
export const clientFormSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis.").max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: emailField,
  notes: z.string().trim().max(2000).optional().default(""),
  birthdate: z.string().trim().optional().default(""),
  smsConsent: z.boolean().default(false),
  emailConsent: z.boolean().default(false),
});

/** À l'ajout, on peut renseigner une première visite (crée un passage). */
export const clientCreateSchema = clientFormSchema.extend({
  lastVisit: z.string().trim().optional().default(""),
  amount: z.string().trim().optional().default(""),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;

/** Une ligne d'import CSV, déjà mappée vers nos champs (valeurs brutes). */
export type ImportRow = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  lastVisit?: string;
  amount?: string;
  birthdate?: string;
};
