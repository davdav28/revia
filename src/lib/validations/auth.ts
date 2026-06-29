import { z } from "zod";

export const signupSchema = z.object({
  salonName: z
    .string()
    .trim()
    .min(2, "Le nom du salon est trop court.")
    .max(80, "Le nom du salon est trop long."),
  name: z
    .string()
    .trim()
    .max(80, "Le nom est trop long.")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Adresse email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères.")
    .max(72, "Le mot de passe est trop long."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
