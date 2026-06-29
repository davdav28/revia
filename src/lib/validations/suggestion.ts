import { z } from "zod";

export const SUGGESTION_CATEGORIES = ["question", "idea", "problem"] as const;
export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];

export const suggestionSchema = z.object({
  category: z.enum(SUGGESTION_CATEGORIES).default("idea"),
  message: z
    .string()
    .trim()
    .min(3, "Votre message est un peu court.")
    .max(2000, "Votre message est trop long."),
});
