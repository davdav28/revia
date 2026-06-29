import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { AgendaView } from "@/components/agenda/agenda-view";
import {
  parseYmd,
  queryRange,
  type AgendaView as ViewMode,
} from "@/lib/agenda";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const member = await requireMember();
  const { view: viewParam, date: dateParam } = await searchParams;
  const view: ViewMode = viewParam === "day" ? "day" : "week";
  const anchor = parseYmd(dateParam);
  const { gte, lt } = queryRange(view, anchor);

  const [appts, clients, services] = await Promise.all([
    prisma.appointment.findMany({
      where: { salonId: member.salonId, startAt: { gte, lt } },
      include: {
        client: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.client.findMany({
      where: { salonId: member.salonId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.service.findMany({
      where: { salonId: member.salonId, isActive: true },
      select: {
        id: true,
        name: true,
        priceCents: true,
        defaultDurationMin: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const appointments = appts.map((a) => ({
    id: a.id,
    startAtISO: a.startAt.toISOString(),
    durationMin: a.durationMin,
    status: a.status,
    amountCents: a.amountCents,
    clientId: a.clientId,
    clientName: `${a.client.firstName} ${a.client.lastName ?? ""}`.trim(),
    serviceId: a.serviceId,
    serviceName: a.service?.name ?? null,
  }));

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName ?? ""}`.trim(),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Agenda"
        description="Vos rendez-vous. Chaque passage honoré nourrit la réactivation."
      />
      <AgendaView
        view={view}
        dateISO={dateParam ?? ""}
        appointments={appointments}
        clients={clientOptions}
        services={services}
      />
    </div>
  );
}
