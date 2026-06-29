"use server";

import { revalidatePath } from "next/cache";
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
