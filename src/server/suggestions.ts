"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  suggestionSchema,
  type SuggestionCategory,
} from "@/lib/validations/suggestion";

export type SuggestionResult = { ok: true } | { error: string };

export async function submitSuggestion(input: {
  category: SuggestionCategory;
  message: string;
}): Promise<SuggestionResult> {
  const member = await requireMember();
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message invalide." };
  }

  await prisma.suggestion.create({
    data: {
      salonId: member.salonId,
      category: parsed.data.category,
      message: parsed.data.message,
      authorName: member.name,
      authorEmail: member.email,
    },
  });

  revalidatePath("/aide");
  return { ok: true };
}
