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
