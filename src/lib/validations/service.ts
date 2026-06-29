import { z } from "zod";

/** Champs d'une prestation. `price` et `intervalDays` sont des chaînes
 * (saisie libre), converties côté serveur. */
export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(80),
  price: z.string().trim().optional().default(""),
  intervalDays: z.string().trim().optional().default(""),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
