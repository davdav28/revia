"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Active / désactive la réservation en ligne publique du salon. */
export async function setBookingEnabled(enabled: boolean): Promise<void> {
  const member = await requireMember();
  await prisma.salon.update({
    where: { id: member.salonId },
    data: { bookingEnabled: enabled },
  });
  revalidatePath("/reglages");
}

const contactSchema = z.object({
  // Expéditeur SMS : contrainte opérateurs = ≤ 11 caractères alphanumériques,
  // au moins une lettre (un expéditeur purement numérique est refusé).
  senderName: z
    .string()
    .trim()
    .min(2, "Nom expéditeur trop court.")
    .max(11, "11 caractères maximum.")
    .regex(/^[A-Za-z0-9 ]+$/, "Lettres et chiffres uniquement.")
    .refine((v) => /[A-Za-z]/.test(v), "Doit contenir au moins une lettre."),
  address: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
});

/** Coordonnées du salon (affichées aux clientes) + nom expéditeur SMS. */
export async function setSalonContact(input: {
  senderName: string;
  address: string;
  phone: string;
}): Promise<{ ok: true } | { error: string }> {
  const member = await requireMember();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Coordonnées invalides." };
  }
  await prisma.salon.update({
    where: { id: member.salonId },
    data: {
      senderName: parsed.data.senderName,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
    },
  });
  revalidatePath("/reglages");
  return { ok: true };
}

const hoursSchema = z
  .object({
    openDays: z.array(z.number().int().min(0).max(6)).max(7),
    openFromHour: z.number().int().min(6).max(22),
    openToHour: z.number().int().min(7).max(23),
  })
  .refine((v) => v.openToHour > v.openFromHour, {
    message: "L'heure de fermeture doit être après l'ouverture.",
  });

export type HoursResult = { ok: true } | { error: string };

/** Enregistre les horaires d'ouverture (réservation en ligne) du salon. */
export async function setOpeningHours(input: {
  openDays: number[];
  openFromHour: number;
  openToHour: number;
}): Promise<HoursResult> {
  const member = await requireMember();
  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Horaires invalides." };
  }
  await prisma.salon.update({
    where: { id: member.salonId },
    data: {
      openDays: [...new Set(parsed.data.openDays)].sort(),
      openFromHour: parsed.data.openFromHour,
      openToHour: parsed.data.openToHour,
    },
  });
  revalidatePath("/reglages/horaires");
  revalidatePath("/reglages");
  return { ok: true };
}
