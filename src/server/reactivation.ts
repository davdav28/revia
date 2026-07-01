"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runScanForSalon, type ScanSummary } from "@/lib/reactivation/scan";
import { seedReactivationDefaults } from "@/lib/reactivation/seed";

export type ReactState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function toggleCampaign(
  campaignId: string,
  isActive: boolean,
): Promise<void> {
  const member = await requireMember();
  const c = await prisma.campaign.findFirst({
    where: { id: campaignId, salonId: member.salonId },
    select: { id: true },
  });
  if (!c) return;
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { isActive },
  });
  revalidatePath("/relances");
}

const templateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(120),
  subject: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(1, "Le message ne peut pas être vide.").max(2000),
});

export async function updateTemplate(
  templateId: string,
  _prev: ReactState,
  formData: FormData,
): Promise<ReactState> {
  const member = await requireMember();
  const existing = await prisma.messageTemplate.findFirst({
    where: { id: templateId, salonId: member.salonId },
    select: { id: true },
  });
  if (!existing) return { error: "Modèle introuvable." };

  const parsed = templateSchema.safeParse({
    name: formData.get("name") ?? "",
    subject: formData.get("subject") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.messageTemplate.update({
    where: { id: templateId },
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject || null,
      body: parsed.data.body,
    },
  });
  revalidatePath("/relances");
  return {};
}

export async function setupReactivation(): Promise<void> {
  const member = await requireMember();
  await seedReactivationDefaults(member.salonId, member.salon.metier);
  revalidatePath("/relances");
}

export async function runScanNow(): Promise<ScanSummary> {
  const member = await requireMember();
  const summary = await runScanForSalon(member.salonId, { force: true });
  revalidatePath("/relances");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return summary;
}

export async function setClientOptOut(
  clientId: string,
  optedOut: boolean,
): Promise<void> {
  const member = await requireMember();
  const c = await prisma.client.findFirst({
    where: { id: clientId, salonId: member.salonId },
    select: { id: true },
  });
  if (!c) return;
  await prisma.client.update({
    where: { id: clientId },
    data: { optedOutAt: optedOut ? new Date() : null },
  });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}
