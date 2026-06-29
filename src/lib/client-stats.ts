import { prisma } from "./prisma";
import type { ClientStatus } from "@prisma/client";
import {
  statusFromLastVisit,
  clientCycleDays,
  DEFAULT_DORMANCY,
  type DormancyParams,
} from "./reactivation/dormancy";

type ApptStat = {
  startAt: Date;
  amountCents: number | null;
  serviceInterval: number | null;
};

type Stats = {
  lastVisitAt: Date | null;
  visitCount: number;
  totalSpendCents: number;
  averageSpendCents: number;
  status: ClientStatus;
};

async function salonParams(salonId: string): Promise<DormancyParams> {
  const s = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { defaultCycleDays: true, graceDays: true, lostAfterDays: true },
  });
  return s ?? DEFAULT_DORMANCY;
}

function statsFromAppointments(
  appts: ApptStat[],
  params: DormancyParams,
  now: Date = new Date(),
): Stats {
  const visitCount = appts.length;
  const lastVisitAt = appts.reduce<Date | null>(
    (max, a) => (!max || a.startAt > max ? a.startAt : max),
    null,
  );
  const paid = appts.filter((a) => a.amountCents != null);
  const totalSpendCents = paid.reduce((s, a) => s + (a.amountCents ?? 0), 0);
  const averageSpendCents = paid.length
    ? Math.round(totalSpendCents / paid.length)
    : 0;
  const cycle = clientCycleDays(appts, params.defaultCycleDays);
  return {
    lastVisitAt,
    visitCount,
    totalSpendCents,
    averageSpendCents,
    status: statusFromLastVisit(lastVisitAt, cycle, params, now),
  };
}

/** Recalcule et persiste les champs dénormalisés d'une cliente. */
export async function recomputeClientStats(clientId: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { salonId: true },
  });
  if (!client) return;
  const params = await salonParams(client.salonId);
  const appts = await prisma.appointment.findMany({
    where: { clientId, status: "completed" },
    select: {
      startAt: true,
      amountCents: true,
      service: { select: { defaultIntervalDays: true } },
    },
  });
  const mapped: ApptStat[] = appts.map((a) => ({
    startAt: a.startAt,
    amountCents: a.amountCents,
    serviceInterval: a.service?.defaultIntervalDays ?? null,
  }));
  await prisma.client.update({
    where: { id: clientId },
    data: statsFromAppointments(mapped, params),
  });
}

/** Recalcule en lot les clientes d'un salon (import, scan quotidien). */
export async function recomputeManyClientStats(
  salonId: string,
  clientIds: string[],
): Promise<void> {
  if (clientIds.length === 0) return;
  const params = await salonParams(salonId);
  const appts = await prisma.appointment.findMany({
    where: { salonId, status: "completed", clientId: { in: clientIds } },
    select: {
      clientId: true,
      startAt: true,
      amountCents: true,
      service: { select: { defaultIntervalDays: true } },
    },
  });

  const byClient = new Map<string, ApptStat[]>();
  for (const a of appts) {
    const list = byClient.get(a.clientId) ?? [];
    list.push({
      startAt: a.startAt,
      amountCents: a.amountCents,
      serviceInterval: a.service?.defaultIntervalDays ?? null,
    });
    byClient.set(a.clientId, list);
  }

  await prisma.$transaction(
    clientIds.map((id) =>
      prisma.client.update({
        where: { id },
        data: statsFromAppointments(byClient.get(id) ?? [], params),
      }),
    ),
  );
}
