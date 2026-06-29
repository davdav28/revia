"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { setOpeningHours } from "@/server/salon";

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

const selectClass =
  "h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-lacquer focus-visible:ring-2 focus-visible:ring-lacquer/30";

export function HoursForm({
  openDays,
  openFromHour,
  openToHour,
}: {
  openDays: number[];
  openFromHour: number;
  openToHour: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [days, setDays] = useState<number[]>(openDays);
  const [from, setFrom] = useState(openFromHour);
  const [to, setTo] = useState(openToHour);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(d: number) {
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d],
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setOpeningHours({
        openDays: days,
        openFromHour: from,
        openToHour: to,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      toast.success("Horaires enregistrés.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label>Jours d'ouverture</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "h-10 w-12 rounded-md border text-sm font-medium transition-colors",
                  on
                    ? "border-lacquer bg-lacquer text-[var(--base)]"
                    : "border-line text-muted hover:bg-nude-soft",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="from">Ouverture</Label>
          <select
            id="from"
            className={selectClass}
            value={from}
            onChange={(e) => setFrom(Number(e.target.value))}
          >
            {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
              <option key={h} value={h}>
                {h}h
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">Fermeture</Label>
          <select
            id="to"
            className={selectClass}
            value={to}
            onChange={(e) => setTo(Number(e.target.value))}
          >
            {Array.from({ length: 17 }, (_, i) => i + 7).map((h) => (
              <option key={h} value={h}>
                {h}h
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-muted text-sm">
        Vos clientes ne pourront réserver que sur ces jours et entre ces heures.
      </p>

      <Button onClick={save} disabled={isPending || days.length === 0}>
        {isPending ? "Enregistrement…" : "Enregistrer les horaires"}
      </Button>
    </div>
  );
}
