"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, History } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { centsToEurosInput } from "@/lib/money";
import {
  GRID_START_HOUR,
  GRID_END_HOUR,
  HOUR_PX,
  SNAP_MIN,
  type AgendaView as ViewMode,
  ymd,
  parseYmd,
  addDays,
  visibleDays,
  dayName,
  rangeLabel,
  formatTime,
  minutesFromGridStart,
} from "@/lib/agenda";
import {
  AppointmentDialog,
  type AppointmentInitial,
  type DialogClient,
  type DialogService,
} from "./appointment-dialog";

export type AgendaAppointment = {
  id: string;
  startAtISO: string;
  durationMin: number;
  status: AppointmentStatus;
  amountCents: number | null;
  clientId: string;
  clientName: string;
  serviceId: string | null;
  serviceName: string | null;
};

const PX_PER_MIN = HOUR_PX / 60;
const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => GRID_START_HOUR + i,
);
const GRID_HEIGHT = HOURS.length * HOUR_PX;

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  scheduled: "bg-nude-soft border-lacquer/50 text-ink",
  completed: "bg-status-active/10 border-status-active/50 text-ink",
  no_show: "bg-status-at-risk/10 border-status-at-risk/50 text-ink",
  cancelled: "bg-line/60 border-line text-muted line-through",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function AgendaView({
  view,
  dateISO,
  appointments,
  clients,
  services,
}: {
  view: ViewMode;
  dateISO: string;
  appointments: AgendaAppointment[];
  clients: DialogClient[];
  services: DialogService[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initial, setInitial] = useState<AppointmentInitial | null>(null);

  const anchor = parseYmd(dateISO);
  const days = visibleDays(view, anchor);
  const todayKey = ymd(new Date());

  function navigate(d: Date, v: ViewMode) {
    router.push(`/agenda?view=${v}&date=${ymd(d)}`);
  }

  function openCreate(partial: Partial<AppointmentInitial>) {
    setInitial({
      date: ymd(days[0]),
      time: "10:00",
      durationMin: 45,
      status: "scheduled",
      ...partial,
    });
    setDialogOpen(true);
  }

  function openEdit(a: AgendaAppointment) {
    const start = new Date(a.startAtISO);
    setInitial({
      id: a.id,
      clientId: a.clientId,
      serviceId: a.serviceId,
      date: ymd(start),
      time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      durationMin: a.durationMin,
      amount: centsToEurosInput(a.amountCents),
      status: a.status,
    });
    setDialogOpen(true);
  }

  function onColumnClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let minutes = Math.round(y / PX_PER_MIN / SNAP_MIN) * SNAP_MIN;
    minutes = Math.max(
      0,
      Math.min((GRID_END_HOUR - GRID_START_HOUR) * 60 - SNAP_MIN, minutes),
    );
    const h = GRID_START_HOUR + Math.floor(minutes / 60);
    openCreate({ date: ymd(day), time: `${pad(h)}:${pad(minutes % 60)}` });
  }

  return (
    <div className="space-y-4">
      {/* Barre de navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(new Date(), view)}
          >
            Aujourd'hui
          </Button>
          <div className="flex">
            <button
              aria-label="Précédent"
              onClick={() =>
                navigate(addDays(anchor, view === "week" ? -7 : -1), view)
              }
              className="border-line bg-surface text-muted hover:bg-nude-soft hover:text-ink rounded-l-md border p-2"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Suivant"
              onClick={() =>
                navigate(addDays(anchor, view === "week" ? 7 : 1), view)
              }
              className="border-line bg-surface text-muted hover:bg-nude-soft hover:text-ink rounded-r-md border border-l-0 p-2"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <span className="font-display text-ink font-semibold capitalize">
            {rangeLabel(view, anchor)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="border-line bg-surface flex rounded-md border p-0.5">
            {(["week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => navigate(anchor, v)}
                className={cn(
                  "rounded px-3 py-1 text-sm font-medium transition-colors",
                  view === v ? "bg-nude-soft text-ink" : "text-muted",
                )}
              >
                {v === "week" ? "Semaine" : "Jour"}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              openCreate({
                date: todayKey,
                time: "10:00",
                status: "completed",
              })
            }
          >
            <History className="size-4" />
            Visite passée
          </Button>
          <Button size="sm" onClick={() => openCreate({})}>
            <Plus className="size-4" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {/* En-têtes de jours */}
        <div className="border-line flex border-b">
          <div className="w-14 shrink-0" />
          {days.map((d) => {
            const isToday = ymd(d) === todayKey;
            return (
              <div
                key={ymd(d)}
                className="border-line flex-1 border-l py-2 text-center"
              >
                <div className="text-muted text-xs">{dayName(d)}</div>
                <div
                  className={cn(
                    "tabular text-sm font-semibold",
                    isToday ? "text-lacquer-ink" : "text-ink",
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille horaire */}
        <div className="flex" style={{ height: GRID_HEIGHT }}>
          {/* Gouttière des heures */}
          <div className="w-14 shrink-0">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="border-line relative border-t first:border-t-0"
              >
                <span className="tabular text-muted absolute -top-2 right-2 text-xs">
                  {h}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {days.map((d) => {
            const dayKey = ymd(d);
            const dayAppts = appointments.filter(
              (a) => ymd(new Date(a.startAtISO)) === dayKey,
            );
            return (
              <div
                key={dayKey}
                onClick={(e) => onColumnClick(e, d)}
                className="border-line relative flex-1 cursor-pointer border-l"
                style={{
                  backgroundImage: `repeating-linear-gradient(var(--line) 0 1px, transparent 1px ${HOUR_PX}px)`,
                }}
              >
                {dayAppts.map((a) => {
                  const start = new Date(a.startAtISO);
                  const top = Math.max(
                    0,
                    minutesFromGridStart(start) * PX_PER_MIN,
                  );
                  const height = Math.max(18, a.durationMin * PX_PER_MIN - 2);
                  return (
                    <button
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(a);
                      }}
                      style={{ top, height }}
                      className={cn(
                        "absolute right-0.5 left-0.5 overflow-hidden rounded-md border px-1.5 py-1 text-left text-xs",
                        STATUS_STYLE[a.status],
                      )}
                    >
                      <span className="tabular font-medium">
                        {formatTime(start)}
                      </span>{" "}
                      <span className="font-medium">{a.clientName}</span>
                      {a.serviceName ? (
                        <div className="truncate opacity-80">
                          {a.serviceName}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-muted text-xs">
        Cliquez sur un créneau pour créer un rendez-vous, ou sur un rendez-vous
        pour le modifier.
      </p>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
        services={services}
        initial={initial}
      />
    </div>
  );
}
