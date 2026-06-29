"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serviceFormSchema } from "@/lib/validations/service";
import { parseEurosToCents } from "@/lib/money";
import { DEFAULT_SERVICES } from "@/lib/default-services";

export type ServiceActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseInterval(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n > 0 && n <= 366 ? n : null;
}

export async function createService(
  _prev: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const member = await requireMember();
  const parsed = serviceFormSchema.safeParse({
    name: formData.get("name") ?? "",
    price: formData.get("price") ?? "",
    intervalDays: formData.get("intervalDays") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.service.create({
    data: {
      salonId: member.salonId,
      name: parsed.data.name,
      priceCents: parseEurosToCents(parsed.data.price) ?? 0,
      defaultIntervalDays: parseInterval(parsed.data.intervalDays),
    },
  });

  revalidatePath("/reglages/services");
  redirect("/reglages/services");
}

export async function updateService(
  serviceId: string,
  _prev: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const member = await requireMember();
  const existing = await prisma.service.findFirst({
    where: { id: serviceId, salonId: member.salonId },
    select: { id: true },
  });
  if (!existing) return { error: "Prestation introuvable." };

  const parsed = serviceFormSchema.safeParse({
    name: formData.get("name") ?? "",
    price: formData.get("price") ?? "",
    intervalDays: formData.get("intervalDays") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: parsed.data.name,
      priceCents: parseEurosToCents(parsed.data.price) ?? 0,
      defaultIntervalDays: parseInterval(parsed.data.intervalDays),
    },
  });

  revalidatePath("/reglages/services");
  redirect("/reglages/services");
}

export async function deleteService(serviceId: string): Promise<void> {
  const member = await requireMember();
  const existing = await prisma.service.findFirst({
    where: { id: serviceId, salonId: member.salonId },
    select: { id: true },
  });
  if (existing) {
    await prisma.service.delete({ where: { id: serviceId } });
    revalidatePath("/reglages/services");
  }
}

/** Pré-remplit le catalogue avec les prestations onglerie types (si vide). */
export async function seedDefaultServices(): Promise<void> {
  const member = await requireMember();
  const count = await prisma.service.count({
    where: { salonId: member.salonId },
  });
  if (count === 0) {
    await prisma.service.createMany({
      data: DEFAULT_SERVICES.map((s) => ({ ...s, salonId: member.salonId })),
    });
    revalidatePath("/reglages/services");
  }
}
