"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  recomputeClientStats,
  recomputeManyClientStats,
} from "@/lib/client-stats";
import { clientCreateSchema, clientFormSchema } from "@/lib/validations/client";
import type { ImportRow } from "@/lib/validations/client";
import { parseEurosToCents } from "@/lib/money";
import { parseFlexibleDate } from "@/lib/dates";
import { normalizePhone } from "@/lib/phone";

export type ClientActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function readForm(formData: FormData) {
  return {
    firstName: (formData.get("firstName") as string) ?? "",
    lastName: (formData.get("lastName") as string) ?? "",
    phone: (formData.get("phone") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    notes: (formData.get("notes") as string) ?? "",
    birthdate: (formData.get("birthdate") as string) ?? "",
    smsConsent: formData.get("smsConsent") === "on",
    emailConsent: formData.get("emailConsent") === "on",
    lastVisit: (formData.get("lastVisit") as string) ?? "",
    amount: (formData.get("amount") as string) ?? "",
  };
}

export async function createClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const member = await requireMember();
  const parsed = clientCreateSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const now = new Date();
  const visitDate = parseFlexibleDate(d.lastVisit);
  const amountCents = parseEurosToCents(d.amount);

  const client = await prisma.client.create({
    data: {
      salonId: member.salonId,
      firstName: d.firstName,
      lastName: d.lastName || null,
      phone: normalizePhone(d.phone),
      email: d.email || null,
      notes: d.notes || null,
      birthdate: parseFlexibleDate(d.birthdate),
      smsConsent: d.smsConsent,
      smsConsentAt: d.smsConsent ? now : null,
      emailConsent: d.emailConsent,
      emailConsentAt: d.emailConsent ? now : null,
      appointments: visitDate
        ? {
            create: {
              salonId: member.salonId,
              startAt: visitDate,
              status: "completed",
              source: "manual",
              amountCents,
            },
          }
        : undefined,
    },
  });

  await recomputeClientStats(client.id);
  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}

export async function updateClient(
  clientId: string,
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const member = await requireMember();
  const existing = await prisma.client.findFirst({
    where: { id: clientId, salonId: member.salonId },
  });
  if (!existing) return { error: "Cliente introuvable." };

  const parsed = clientFormSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const now = new Date();

  await prisma.client.update({
    where: { id: clientId },
    data: {
      firstName: d.firstName,
      lastName: d.lastName || null,
      phone: normalizePhone(d.phone),
      email: d.email || null,
      notes: d.notes || null,
      birthdate: parseFlexibleDate(d.birthdate),
      smsConsent: d.smsConsent,
      smsConsentAt: d.smsConsent ? (existing.smsConsentAt ?? now) : null,
      emailConsent: d.emailConsent,
      emailConsentAt: d.emailConsent ? (existing.emailConsentAt ?? now) : null,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}`);
}

export async function deleteClient(clientId: string): Promise<void> {
  const member = await requireMember();
  const existing = await prisma.client.findFirst({
    where: { id: clientId, salonId: member.salonId },
    select: { id: true },
  });
  if (!existing) redirect("/clientes");

  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export type ImportSummary = {
  created: number;
  skipped: number;
  duplicates: number;
  warnings: string[];
};

export async function importClients(rows: ImportRow[]): Promise<ImportSummary> {
  const member = await requireMember();

  // Dédoublonnage : on ignore les lignes dont le téléphone ou l'email existe déjà.
  const existing = await prisma.client.findMany({
    where: { salonId: member.salonId },
    select: { phone: true, email: true },
  });
  const seenPhones = new Set(
    existing.map((c) => c.phone).filter(Boolean) as string[],
  );
  const seenEmails = new Set(
    existing.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[],
  );

  let created = 0;
  let skipped = 0;
  let duplicates = 0;
  const warnings: string[] = [];
  const createdIds: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const firstName = (row.firstName ?? "").trim();
    if (!firstName) {
      skipped++;
      continue;
    }

    const phone = normalizePhone(row.phone);
    const emailRaw = (row.email ?? "").trim();
    const emailValid = emailRaw && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw);
    const email = emailValid ? emailRaw : null;
    if (emailRaw && !emailValid) {
      warnings.push(`Ligne ${line} : email ignoré (format invalide).`);
    }

    if (phone && seenPhones.has(phone)) {
      duplicates++;
      continue;
    }
    if (email && seenEmails.has(email.toLowerCase())) {
      duplicates++;
      continue;
    }

    const visitDate = parseFlexibleDate(row.lastVisit);
    if ((row.lastVisit ?? "").trim() && !visitDate) {
      warnings.push(
        `Ligne ${line} : date de dernière visite illisible, ignorée.`,
      );
    }
    const amountCents = parseEurosToCents(row.amount);

    const client = await prisma.client.create({
      data: {
        salonId: member.salonId,
        firstName,
        lastName: (row.lastName ?? "").trim() || null,
        phone,
        email,
        birthdate: parseFlexibleDate(row.birthdate),
        appointments: visitDate
          ? {
              create: {
                salonId: member.salonId,
                startAt: visitDate,
                status: "completed",
                source: "import",
                amountCents,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    createdIds.push(client.id);
    if (phone) seenPhones.add(phone);
    if (email) seenEmails.add(email.toLowerCase());
    created++;
  }

  await recomputeManyClientStats(member.salonId, createdIds);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return { created, skipped, duplicates, warnings };
}
