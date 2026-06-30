"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  suggestionSchema,
  type SuggestionCategory,
} from "@/lib/validations/suggestion";
import { getMessagingProvider } from "@/lib/messaging";
import { LEGAL } from "@/config/legal";
import { BRAND } from "@/config/brand";

export type SuggestionResult = { ok: true } | { error: string };

const CATEGORY_LABEL: Record<string, string> = {
  question: "Question",
  idea: "Idée",
  problem: "Souci",
};

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

  // Notification à l'équipe Revia (best-effort : n'empêche jamais l'envoi).
  try {
    const provider = getMessagingProvider();
    const label = CATEGORY_LABEL[parsed.data.category] ?? parsed.data.category;
    await provider.sendEmail({
      to: LEGAL.contactEmail,
      subject: `[${label}] ${member.salon.name} — via ${BRAND.name}`,
      html: `<div><p><strong>${label}</strong> de ${member.name ?? "—"} (${member.email}) · salon « ${member.salon.name} » :</p><blockquote>${parsed.data.message.replace(/\n/g, "<br>")}</blockquote></div>`,
      senderEmail: process.env.BREVO_EMAIL_SENDER ?? LEGAL.contactEmail,
      senderName: BRAND.name,
    });
  } catch {
    // Silencieux : la suggestion est déjà enregistrée en base.
  }

  revalidatePath("/aide");
  return { ok: true };
}
