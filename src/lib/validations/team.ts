import { z } from "zod";

/** Invitation d'un coéquipier : email + rôle. */
export const inviteSchema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  role: z.enum(["owner", "staff"]),
});

/** Acceptation d'une invitation : on choisit son nom + mot de passe. */
export const acceptInviteSchema = z.object({
  token: z.string().min(10, "Invitation invalide."),
  name: z
    .string()
    .trim()
    .max(80, "Le nom est trop long.")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères.")
    .max(72, "Le mot de passe est trop long."),
});

export type InviteInput = z.infer<typeof inviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
