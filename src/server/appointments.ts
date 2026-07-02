"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AppointmentStatus } from "@prisma/client";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeClientStats } from "@/lib/client-stats";
import { parseEurosToCents } from "@/lib/money";
import { offerFreedSlot } from "@/lib/reactivation/freed-slot";

export type AppointmentActionResult = { ok: true } | { error: string };

const inputSchema = z.object({
  clientId: z.string().min(1, "Choisissez une cliente."),
  serviceId: z.string().nullable().optional(),
  startAtISO: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Date invalide.",
  }),
  durationMin: z.number().int().min(5).max(600),
  amount: z.string().optional().default(""),
  status: z.enum(["scheduled", "completed", "no_show", "cancelled"]),
});

export type AppointmentInput = z.infer<typeof inputSchema>;

async function assertClientInSalon(clientId: string, salonId: string) {
  const c = await prisma.client.findFirst({
    where: { id: clientId, salonId },
    select: { id: true },
  });
  return !!c;
}

export async function createAppointment(
  input: AppointmentInput,
): Promise<AppointmentActionResult> {
  const member = await requireMember();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  if (!(await assertClientInSalon(d.clientId, member.salonId))) {
    return { error: "Cliente introuvable." };
  }
  // Vérifie que la prestation appartient bien au salon.
  let serviceId: string | null = d.serviceId || null;
  if (serviceId) {
    const svc = await prisma.service.findFirst({
      where: { id: serviceId, salonId: member.salonId },
      select: { id: true },
    });
    if (!svc) serviceId = null;
  }

  const appt = await prisma.appointment.create({
    data: {
      salonId: member.salonId,
      clientId: d.clientId,
      serviceId,
      startAt: new Date(d.startAtISO),
      durationMin: d.durationMin,
      status: d.status,
      amountCents: parseEurosToCents(d.amount),
      source: "manual",
    },
    select: { clientId: true },
  });

  await recomputeClientStats(appt.clientId);
  revalidatePath("/agenda");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput,
): Promise<AppointmentActionResult> {
  const member = await requireMember();
  const existing = await prisma.appointment.findFirst({
    where: { id, salonId: member.salonId },
    select: { id: true, clientId: true, status: true },
  });
  if (!existing) return { error: "Rendez-vous introuvable." };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  let serviceId: string | null = d.serviceId || null;
  if (serviceId) {
    const svc = await prisma.service.findFirst({
      where: { id: serviceId, salonId: member.salonId },
      select: { id: true },
    });
    if (!svc) serviceId = null;
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      serviceId,
      startAt: new Date(d.startAtISO),
      durationMin: d.durationMin,
      status: d.status,
      amountCents: parseEurosToCents(d.amount),
    },
  });

  await recomputeClientStats(existing.clientId);
  // RDV annulé (nouveau) → on propose le créneau libéré à des dormants.
  if (d.status === "cancelled" && existing.status !== "cancelled") {
    await offerFreedSlot(member.salonId, {
      startAt: new Date(d.startAtISO),
      clientId: existing.clientId,
    }).catch(() => {});
  }
  revalidatePath("/agenda");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Marque un RDV honoré / no-show / annulé. Honoré nourrit la fiche cliente. */
export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentActionResult> {
  const member = await requireMember();
  const existing = await prisma.appointment.findFirst({
    where: { id, salonId: member.salonId },
    select: { id: true, clientId: true, status: true, startAt: true },
  });
  if (!existing) return { error: "Rendez-vous introuvable." };

  await prisma.appointment.update({ where: { id }, data: { status } });
  await recomputeClientStats(existing.clientId);
  if (status === "cancelled" && existing.status !== "cancelled") {
    await offerFreedSlot(member.salonId, {
      startAt: existing.startAt,
      clientId: existing.clientId,
    }).catch(() => {});
  }
  revalidatePath("/agenda");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAppointment(
  id: string,
): Promise<AppointmentActionResult> {
  const member = await requireMember();
  const existing = await prisma.appointment.findFirst({
    where: { id, salonId: member.salonId },
    select: { id: true, clientId: true },
  });
  if (!existing) return { error: "Rendez-vous introuvable." };

  await prisma.appointment.delete({ where: { id } });
  await recomputeClientStats(existing.clientId);
  revalidatePath("/agenda");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}
