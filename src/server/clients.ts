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

/** Une ligne d'export d'agenda (Planity, Treatwell, Fresha…) : un rendez-vous. */
export type ApptImportRow = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  date?: string;
  service?: string;
  amount?: string;
};

export type ApptImportSummary = {
  clientsCreated: number;
  appointmentsCreated: number;
  skipped: number;
  duplicates: number;
  warnings: string[];
};

function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
function nameKey(first: string, last: string | null): string {
  return `${normName(first)}|${normName(last ?? "")}`;
}

/**
 * Importe un historique de rendez-vous (export Planity/Treatwell/Fresha/caisse).
 * Chaque ligne = une visite : on rattache (ou crée) la cliente puis on crée le
 * RDV. Les statuts/dormance sont recalculés ensuite — c'est ce qui rend la
 * détection fiable. Idempotent : un même RDV (cliente + date/heure) n'est pas
 * recréé.
 */
export async function importAppointments(
  rows: ApptImportRow[],
): Promise<ApptImportSummary> {
  const member = await requireMember();
  const salonId = member.salonId;

  const [clients, services, appts] = await Promise.all([
    prisma.client.findMany({
      where: { salonId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    }),
    prisma.service.findMany({
      where: { salonId },
      select: { id: true, name: true },
    }),
    prisma.appointment.findMany({
      where: { salonId },
      select: { clientId: true, startAt: true },
    }),
  ]);

  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const c of clients) {
    if (c.phone) byPhone.set(c.phone, c.id);
    if (c.email) byEmail.set(c.email.toLowerCase(), c.id);
    byName.set(nameKey(c.firstName, c.lastName), c.id);
  }
  const serviceByName = new Map(services.map((s) => [normName(s.name), s.id]));
  const apptKeys = new Set(
    appts.map((a) => `${a.clientId}|${a.startAt.getTime()}`),
  );

  let clientsCreated = 0;
  let appointmentsCreated = 0;
  let skipped = 0;
  let duplicates = 0;
  const warnings: string[] = [];
  const affected = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 1;

    let firstName = (r.firstName ?? "").trim();
    let lastName = (r.lastName ?? "").trim();
    const full = (r.fullName ?? "").trim();
    if (!firstName && full) {
      const parts = full.split(/\s+/);
      firstName = parts.shift() ?? "";
      lastName = lastName || parts.join(" ");
    }

    const phone = normalizePhone(r.phone);
    const emailRaw = (r.email ?? "").trim();
    const email =
      emailRaw && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw) ? emailRaw : null;

    const date = parseFlexibleDate(r.date);
    if (!date) {
      skipped++;
      if ((r.date ?? "").trim())
        warnings.push(`Ligne ${line} : date illisible, ignorée.`);
      else warnings.push(`Ligne ${line} : date manquante, ignorée.`);
      continue;
    }
    if (!firstName && !phone && !email) {
      skipped++;
      warnings.push(`Ligne ${line} : aucune identité cliente, ignorée.`);
      continue;
    }

    let clientId =
      (phone && byPhone.get(phone)) ||
      (email && byEmail.get(email.toLowerCase())) ||
      (firstName && byName.get(nameKey(firstName, lastName))) ||
      null;

    if (!clientId) {
      if (!firstName) {
        skipped++;
        warnings.push(
          `Ligne ${line} : cliente sans nom (impossible à créer), ignorée.`,
        );
        continue;
      }
      const c = await prisma.client.create({
        data: { salonId, firstName, lastName: lastName || null, phone, email },
        select: { id: true },
      });
      clientId = c.id;
      clientsCreated++;
      if (phone) byPhone.set(phone, clientId);
      if (email) byEmail.set(email.toLowerCase(), clientId);
      byName.set(nameKey(firstName, lastName), clientId);
    }

    const key = `${clientId}|${date.getTime()}`;
    if (apptKeys.has(key)) {
      duplicates++;
      affected.add(clientId);
      continue;
    }

    const serviceId = r.service
      ? (serviceByName.get(normName(r.service)) ?? null)
      : null;
    const amountCents = parseEurosToCents(r.amount);

    await prisma.appointment.create({
      data: {
        salonId,
        clientId,
        startAt: date,
        status: "completed",
        source: "import",
        amountCents,
        serviceId,
      },
    });
    apptKeys.add(key);
    appointmentsCreated++;
    affected.add(clientId);
  }

  await recomputeManyClientStats(salonId, [...affected]);
  revalidatePath("/clientes");
  revalidatePath("/agenda");
  revalidatePath("/dashboard");

  return { clientsCreated, appointmentsCreated, skipped, duplicates, warnings };
}
