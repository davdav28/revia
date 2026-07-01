"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salonLimitFor } from "@/lib/team";
import { normalizeMetier, servicesForMetier } from "@/lib/metiers";
import { seedReactivationDefaults } from "@/lib/reactivation/seed";
import { generateUniqueSlug } from "@/lib/slug";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Le nom du salon est trop court.")
  .max(80, "Le nom du salon est trop long.");

/** Bascule le salon actif (doit appartenir aux salons accessibles). */
export async function setActiveSalon(
  salonId: string,
): Promise<{ error?: string }> {
  const member = await requireMember();
  if (!member.salons.some((s) => s.id === salonId)) {
    return { error: "Salon inaccessible." };
  }
  await prisma.user.update({
    where: { id: member.id },
    data: { activeSalonId: salonId },
  });
  revalidatePath("/", "layout");
  return {};
}

/** Crée un nouveau salon rattaché au compte (dans la limite du plan). */
export async function createSalon(
  name: string,
  metier?: string,
): Promise<{ error?: string } | { ok: true; salonId: string }> {
  const member = await requireMember();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nom invalide." };
  }
  // À défaut, le nouveau salon hérite du métier du salon courant.
  const salonMetier = normalizeMetier(metier ?? member.salon.metier);

  const limit = salonLimitFor(member.salon);
  if (limit !== null && member.salons.length >= limit) {
    return {
      error: `Votre formule permet ${limit} salon${limit > 1 ? "s" : ""}. Passez à une formule supérieure pour en ajouter.`,
    };
  }

  const slug = await generateUniqueSlug(parsed.data);
  const salon = await prisma.salon.create({
    data: {
      name: parsed.data,
      slug,
      metier: salonMetier,
      services: { create: servicesForMetier(salonMetier) },
    },
    select: { id: true },
  });
  await seedReactivationDefaults(salon.id, salonMetier);
  await prisma.membership.create({
    data: { userId: member.id, salonId: salon.id, role: "owner" },
  });
  // Le nouveau salon devient le salon actif.
  await prisma.user.update({
    where: { id: member.id },
    data: { activeSalonId: salon.id },
  });

  revalidatePath("/", "layout");
  return { ok: true, salonId: salon.id };
}
