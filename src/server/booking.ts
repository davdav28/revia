"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recomputeClientStats } from "@/lib/client-stats";
import { normalizePhone } from "@/lib/phone";
import { parseFlexibleDate } from "@/lib/dates";
import { isSlotBookable, HORIZON_DAYS, type BusyInterval } from "@/lib/booking";
import { getMessagingProvider } from "@/lib/messaging";

const DAY = 86_400_000;

const schema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1, "Choisissez une prestation."),
  startAtISO: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Créneau invalide."),
  firstName: z.string().trim().min(1, "Votre prénom est requis.").max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("")
    .refine(
      (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
      "Adresse email invalide.",
    ),
  birthdate: z.string().trim().optional().default(""),
  smsConsent: z.boolean().default(false),
  emailConsent: z.boolean().default(false),
});

export type BookingInput = z.infer<typeof schema>;
export type BookingResult =
  { ok: true; dateLabel: string; serviceName: string } | { error: string };

async function loadBusy(salonId: string, now: Date): Promise<BusyInterval[]> {
  const appts = await prisma.appointment.findMany({
    where: {
      salonId,
      status: { in: ["scheduled", "completed"] },
      startAt: {
        gte: new Date(now.getTime() - DAY),
        lte: new Date(now.getTime() + (HORIZON_DAYS + 1) * DAY),
      },
    },
    select: { startAt: true, durationMin: true },
  });
  return appts.map((a) => ({
    start: a.startAt.getTime(),
    end: a.startAt.getTime() + a.durationMin * 60_000,
  }));
}

/** Réservation publique par une cliente finale (aucune authentification). */
export async function createPublicBooking(
  input: BookingInput,
): Promise<BookingResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  if (!d.phone && !d.email) {
    return { error: "Laissez un téléphone ou un email pour la confirmation." };
  }

  const salon = await prisma.salon.findUnique({ where: { slug: d.slug } });
  if (!salon || !salon.bookingEnabled) {
    return { error: "La réservation en ligne n'est pas disponible." };
  }

  const service = await prisma.service.findFirst({
    where: { id: d.serviceId, salonId: salon.id, isActive: true },
  });
  if (!service) return { error: "Prestation introuvable." };

  const now = new Date();
  const startAt = new Date(d.startAtISO);
  const busy = await loadBusy(salon.id, now);
  const hours = {
    openDays: salon.openDays,
    openFromHour: salon.openFromHour,
    openToHour: salon.openToHour,
  };
  if (
    !isSlotBookable(
      startAt,
      service.defaultDurationMin,
      busy,
      salon.timezone,
      hours,
      now,
    )
  ) {
    return {
      error: "Ce créneau n'est plus disponible. Choisissez-en un autre.",
    };
  }

  const phone = normalizePhone(d.phone);
  const email = d.email || null;

  // Rapproche d'une cliente existante (téléphone puis email), sinon en crée une.
  let client =
    (phone
      ? await prisma.client.findFirst({ where: { salonId: salon.id, phone } })
      : null) ??
    (email
      ? await prisma.client.findFirst({ where: { salonId: salon.id, email } })
      : null);

  const birthdate = parseFlexibleDate(d.birthdate);

  if (!client) {
    client = await prisma.client.create({
      data: {
        salonId: salon.id,
        firstName: d.firstName,
        lastName: d.lastName || null,
        phone,
        email,
        birthdate,
        smsConsent: d.smsConsent,
        smsConsentAt: d.smsConsent ? now : null,
        emailConsent: d.emailConsent,
        emailConsentAt: d.emailConsent ? now : null,
      },
    });
  } else {
    // Met à jour consentements + date de naissance si nouvellement fournis.
    await prisma.client.update({
      where: { id: client.id },
      data: {
        birthdate: client.birthdate ?? birthdate,
        smsConsent: client.smsConsent || d.smsConsent,
        smsConsentAt: client.smsConsentAt ?? (d.smsConsent ? now : null),
        emailConsent: client.emailConsent || d.emailConsent,
        emailConsentAt: client.emailConsentAt ?? (d.emailConsent ? now : null),
      },
    });
  }

  await prisma.appointment.create({
    data: {
      salonId: salon.id,
      clientId: client.id,
      serviceId: service.id,
      startAt,
      durationMin: service.defaultDurationMin,
      status: "scheduled",
      amountCents: service.priceCents,
      source: "online_booking",
    },
  });

  await recomputeClientStats(client.id);
  revalidatePath("/agenda");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: salon.timezone,
  }).format(startAt);

  // Confirmation à la cliente (best-effort : n'empêche jamais la réservation).
  try {
    const provider = getMessagingProvider();
    if (email) {
      await provider.sendEmail({
        to: email,
        subject: `Votre rendez-vous au ${salon.name} est confirmé`,
        html: `<div><p>Bonjour ${d.firstName},</p><p>Votre rendez-vous est confirmé :</p><p><strong>${service.name}</strong><br>${dateLabel}</p>${salon.address ? `<p>📍 ${salon.address}</p>` : ""}${salon.phone ? `<p>📞 ${salon.phone}</p>` : ""}<p>À très vite,<br>${salon.name}</p></div>`,
        senderEmail: process.env.BREVO_EMAIL_SENDER ?? "contact@reviagence.com",
        senderName: salon.senderName,
      });
    } else if (phone) {
      await provider.sendSms({
        to: phone,
        sender: salon.senderName,
        body: `${salon.name} : votre RDV ${service.name} le ${dateLabel} est confirmé. À bientôt !`,
      });
    }
  } catch {
    // Silencieux : la confirmation est un bonus.
  }

  return { ok: true, dateLabel, serviceName: service.name };
}

/** Données publiques pour afficher la page de réservation d'un salon. */
export async function getBookingData(slug: string) {
  const salon = await prisma.salon.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      bookingEnabled: true,
      timezone: true,
      openDays: true,
      openFromHour: true,
      openToHour: true,
    },
  });
  if (!salon || !salon.bookingEnabled) return null;

  const [services, busy] = await Promise.all([
    prisma.service.findMany({
      where: { salonId: salon.id, isActive: true },
      select: {
        id: true,
        name: true,
        priceCents: true,
        defaultDurationMin: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    loadBusy(salon.id, new Date()),
  ]);

  return {
    salonName: salon.name,
    salonAddress: salon.address,
    salonPhone: salon.phone,
    services,
    busy,
    hours: {
      openDays: salon.openDays,
      openFromHour: salon.openFromHour,
      openToHour: salon.openToHour,
    },
  };
}
