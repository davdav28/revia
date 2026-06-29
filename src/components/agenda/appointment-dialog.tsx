"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { centsToEurosInput } from "@/lib/money";
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/server/appointments";

export type DialogClient = { id: string; name: string };
export type DialogService = {
  id: string;
  name: string;
  priceCents: number;
  defaultDurationMin: number;
};

export type AppointmentInitial = {
  id?: string;
  clientId?: string;
  serviceId?: string | null;
  date: string; // AAAA-MM-JJ
  time: string; // HH:mm
  durationMin?: number;
  amount?: string;
  status?: AppointmentStatus;
};

const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Planifié" },
  { value: "completed", label: "Honoré" },
  { value: "no_show", label: "Absente" },
  { value: "cancelled", label: "Annulé" },
];

const selectClass =
  "h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-lacquer focus-visible:ring-2 focus-visible:ring-lacquer/30";

/** Corps du formulaire — monté à chaque ouverture, donc initialisé proprement
 * depuis `initial` sans effet de synchronisation. */
function AppointmentForm({
  initial,
  clients,
  services,
  onClose,
}: {
  initial: AppointmentInitial;
  clients: DialogClient[];
  services: DialogService[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(initial.clientId ?? "");
  const [serviceId, setServiceId] = useState(initial.serviceId ?? "");
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [durationMin, setDurationMin] = useState(initial.durationMin ?? 45);
  const [amount, setAmount] = useState(initial.amount ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(
    initial.status ?? "scheduled",
  );

  const isEdit = !!initial.id;

  function onServiceChange(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) {
      setDurationMin(svc.defaultDurationMin);
      if (!amount) setAmount(centsToEurosInput(svc.priceCents));
    }
  }

  function submit() {
    setError(null);
    const startAtISO = new Date(`${date}T${time}:00`).toISOString();
    const payload = {
      clientId,
      serviceId: serviceId || null,
      startAtISO,
      durationMin,
      amount,
      status,
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateAppointment(initial.id!, payload)
        : await createAppointment(payload);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function onDelete() {
    if (!initial.id) return;
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    startTransition(async () => {
      const res = await deleteAppointment(initial.id!);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="appt-client">Cliente</Label>
        <select
          id="appt-client"
          className={selectClass}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">— Choisir —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appt-service">Prestation</Label>
        <select
          id="appt-service"
          className={selectClass}
          value={serviceId}
          onChange={(e) => onServiceChange(e.target.value)}
        >
          <option value="">— Aucune —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="appt-date">Date</Label>
          <Input
            id="appt-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-time">Heure</Label>
          <Input
            id="appt-time"
            type="time"
            step={300}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="appt-duration">Durée (min)</Label>
          <Input
            id="appt-duration"
            type="number"
            step={15}
            min={5}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value) || 45)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-amount">Montant (€)</Label>
          <Input
            id="appt-amount"
            inputMode="decimal"
            placeholder="35"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Statut</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                status === s.value
                  ? "border-lacquer bg-lacquer text-[var(--base)]"
                  : "border-line text-muted hover:bg-nude-soft",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {status === "completed" ? (
          <p className="text-muted text-xs">
            Un rendez-vous honoré met à jour la fiche de la cliente.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button onClick={submit} disabled={isPending || !clientId}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
        </div>
        {isEdit ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
            className="text-status-dormant hover:bg-status-dormant/10"
          >
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AppointmentDialog({
  open,
  onOpenChange,
  clients,
  services,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: DialogClient[];
  services: DialogService[];
  initial: AppointmentInitial | null;
}) {
  const isEdit = !!initial?.id;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        description={
          isEdit
            ? "Déplacez, modifiez ou marquez ce rendez-vous."
            : "Renseignez la cliente, la prestation et le créneau."
        }
      >
        {initial ? (
          <AppointmentForm
            key={`${initial.id ?? "new"}-${initial.date}-${initial.time}`}
            initial={initial}
            clients={clients}
            services={services}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
