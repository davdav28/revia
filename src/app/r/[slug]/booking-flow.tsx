"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { availableSlots, type BusyInterval } from "@/lib/booking";
import { createPublicBooking } from "@/server/booking";

type Service = {
  id: string;
  name: string;
  priceCents: number;
  defaultDurationMin: number;
};

function dayLabel(ms: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(ms));
}

export function BookingFlow({
  slug,
  services,
  busy,
}: {
  slug: string;
  services: Service[];
  busy: BusyInterval[];
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [service, setService] = useState<Service | null>(null);
  const [dayMs, setDayMs] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthdate: "",
    smsConsent: true,
    emailConsent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<{
    dateLabel: string;
    serviceName: string;
  } | null>(null);

  const slots = useMemo(
    () => (service ? availableSlots(service.defaultDurationMin, busy) : []),
    [service, busy],
  );
  const selectedDay = slots.find((s) => s.dayMs === dayMs) ?? slots[0] ?? null;

  function chooseService(s: Service) {
    setService(s);
    setDayMs(null);
    setTime(null);
    setStep(2);
  }

  function chooseSlot(t: string) {
    setTime(t);
    setStep(3);
  }

  function submit() {
    if (!service || !selectedDay || !time) return;
    setError(null);
    const [h, m] = time.split(":").map(Number);
    const day = new Date(selectedDay.dayMs);
    const startAt = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      h,
      m,
    );
    startTransition(async () => {
      const res = await createPublicBooking({
        slug,
        serviceId: service.id,
        startAtISO: startAt.toISOString(),
        ...form,
      });
      if ("error" in res) {
        setError(res.error);
        // Créneau pris entre-temps : on rafraîchit les dispos et on renvoie au choix.
        if (/pris|disponible/i.test(res.error)) {
          setTime(null);
          setStep(2);
          router.refresh();
        }
        return;
      }
      setConfirmation({
        dateLabel: res.dateLabel,
        serviceName: res.serviceName,
      });
      setStep(4);
    });
  }

  // Étape 4 — confirmation
  if (step === 4 && confirmation) {
    return (
      <div className="border-line bg-surface rounded-xl border p-8 text-center shadow-[var(--shadow-card)]">
        <div className="bg-status-active/10 text-status-active mx-auto flex size-12 items-center justify-center rounded-full">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="font-display text-ink mt-4 text-lg font-semibold">
          C'est réservé !
        </p>
        <p className="text-muted mt-1">
          {confirmation.serviceName}
          <br />
          <span className="text-ink font-medium capitalize">
            {confirmation.dateLabel}
          </span>
        </p>
        <p className="text-muted mt-4 text-sm">
          À très vite. Vous recevrez bientôt une confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Fil d'étapes */}
      <div className="text-muted flex items-center gap-2 text-xs">
        {["Prestation", "Créneau", "Vos infos"].map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5",
                step === i + 1
                  ? "bg-lacquer text-[var(--base)]"
                  : step > i + 1
                    ? "bg-nude text-ink"
                    : "bg-nude-soft text-muted",
              )}
            >
              {i + 1}. {label}
            </span>
          </span>
        ))}
      </div>

      {error ? (
        <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {/* Étape 1 — prestation */}
      {step === 1 ? (
        <div className="space-y-2">
          {services.length === 0 ? (
            <p className="text-muted text-sm">
              Aucune prestation disponible à la réservation pour l'instant.
            </p>
          ) : (
            services.map((s) => (
              <button
                key={s.id}
                onClick={() => chooseService(s)}
                className="border-line bg-surface hover:border-lacquer/50 hover:bg-nude-soft/40 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors"
              >
                <span>
                  <span className="text-ink font-medium">{s.name}</span>
                  <span className="text-muted mt-0.5 flex items-center gap-1 text-xs">
                    <Clock className="size-3" />
                    {s.defaultDurationMin} min
                  </span>
                </span>
                <span className="tabular text-ink font-semibold">
                  {formatCents(s.priceCents)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {/* Étape 2 — créneau */}
      {step === 2 && service ? (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            {service.name}
          </button>

          {slots.length === 0 ? (
            <p className="text-muted text-sm">
              Aucun créneau disponible dans les prochains jours. Réessayez plus
              tard ou contactez le salon.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {slots.map((d) => (
                  <button
                    key={d.dayMs}
                    onClick={() => setDayMs(d.dayMs)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
                      (selectedDay?.dayMs ?? -1) === d.dayMs
                        ? "border-lacquer bg-lacquer text-[var(--base)]"
                        : "border-line text-ink hover:bg-nude-soft",
                    )}
                  >
                    {dayLabel(d.dayMs)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {selectedDay?.times.map((t) => (
                  <button
                    key={t}
                    onClick={() => chooseSlot(t)}
                    className="tabular border-line bg-surface text-ink hover:border-lacquer hover:bg-nude-soft rounded-md border py-2 text-sm transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Étape 3 — coordonnées */}
      {step === 3 && service && selectedDay && time ? (
        <div className="space-y-4">
          <button
            onClick={() => setStep(2)}
            className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            {dayLabel(selectedDay.dayMs)} à {time}
          </button>

          <div className="border-line bg-nude-soft/40 text-ink rounded-lg border px-4 py-3 text-sm">
            <span className="font-medium">{service.name}</span> ·{" "}
            <span className="capitalize">{dayLabel(selectedDay.dayMs)}</span> à{" "}
            {time} · {formatCents(service.priceCents)}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b-firstName">Prénom</Label>
              <Input
                id="b-firstName"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-lastName">Nom</Label>
              <Input
                id="b-lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b-phone">Téléphone</Label>
              <Input
                id="b-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-email">Email</Label>
              <Input
                id="b-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:max-w-[50%] sm:pr-1.5">
            <Label htmlFor="b-birthdate">
              Date de naissance <span className="text-muted">(facultatif)</span>
            </Label>
            <Input
              id="b-birthdate"
              type="date"
              value={form.birthdate}
              onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
            />
          </div>

          <label className="text-ink flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.smsConsent}
              onChange={(e) =>
                setForm({
                  ...form,
                  smsConsent: e.target.checked,
                  emailConsent: e.target.checked,
                })
              }
              className="accent-lacquer mt-0.5 size-4"
            />
            <span>
              J'accepte de recevoir des rappels et informations par SMS / email.
            </span>
          </label>

          <Button
            onClick={submit}
            size="lg"
            className="w-full"
            disabled={isPending || form.firstName.trim().length < 1}
          >
            {isPending ? "Réservation…" : "Confirmer ma réservation"}
          </Button>
          <p className="text-muted text-center text-xs">
            Vos informations servent uniquement à gérer votre rendez-vous.
          </p>
        </div>
      ) : null}
    </div>
  );
}
