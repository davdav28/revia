"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { contactSchema } from "@/lib/validations/contact";
import { getMessagingProvider } from "@/lib/messaging";
import { ticketRef } from "@/lib/ticket";
import { LEGAL } from "@/config/legal";
import { BRAND } from "@/config/brand";

export type ContactResult = { ok: true; ref: string } | { error: string };

/** Répond à un prospect par email, depuis l'espace fondateur. */
export async function replyToContact(
  id: string,
  body: string,
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();
  const text = body.trim();
  if (text.length < 2) return { error: "Écrivez une réponse." };

  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) return { error: "Message introuvable." };

  try {
    const provider = getMessagingProvider();
    await provider.sendEmail({
      to: msg.email,
      subject: `Re : votre message à ${BRAND.name}`,
      html: `<div><p>Bonjour ${msg.name},</p><div>${text.replace(/\n/g, "<br>")}</div><p style="margin-top:24px;color:#6b5d67;font-size:12px">— L'équipe ${BRAND.name}</p></div>`,
      senderEmail: process.env.BREVO_EMAIL_SENDER ?? LEGAL.contactEmail,
      senderName: BRAND.name,
      replyTo: { email: LEGAL.contactEmail, name: BRAND.name },
    });
  } catch {
    return { error: "L'envoi a échoué. Réessayez." };
  }

  await prisma.contactMessage.update({
    where: { id },
    data: { reply: text, repliedAt: new Date() },
  });
  revalidatePath("/admin/contacts");
  return { ok: true };
}

/** Envoi du formulaire de contact public (« Parler à l'équipe »). */
export async function submitContact(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  company: string;
}): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  // Champ piège rempli = bot → on fait comme si tout allait bien, sans rien créer.
  if (parsed.data.company) return { ok: true, ref: "REV-000000" };

  const d = parsed.data;
  const created = await prisma.contactMessage.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      message: d.message,
    },
    select: { id: true },
  });
  const ref = ticketRef(created.id);

  // Notification à l'équipe (best-effort) — répondre va directement au prospect.
  try {
    const provider = getMessagingProvider();
    await provider.sendEmail({
      to: LEGAL.contactEmail,
      subject: `[${ref}] Contact — ${d.name}`,
      html: `<div><p><strong>${ref}</strong> · nouveau message via la page tarifs :</p><p><strong>${d.name}</strong> — ${d.email}${d.phone ? ` — ${d.phone}` : ""}</p><blockquote>${d.message.replace(/\n/g, "<br>")}</blockquote><p style="color:#6b5d67;font-size:12px">Répondez à cet email : votre réponse ira directement à ${d.email}.</p></div>`,
      senderEmail: process.env.BREVO_EMAIL_SENDER ?? LEGAL.contactEmail,
      senderName: BRAND.name,
      replyTo: { email: d.email, name: d.name },
    });
  } catch {
    // Silencieux : le message est déjà enregistré en base.
  }

  return { ok: true, ref };
}
