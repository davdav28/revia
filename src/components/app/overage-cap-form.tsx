"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { setOverageCap } from "@/server/subscription";

/** Réglage du plafond de dépassement mensuel (en euros). */
export function OverageCapForm({ currentCents }: { currentCents: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(Math.round(currentCents / 100)));
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    const euros = Number(value.replace(",", "."));
    startTransition(async () => {
      const res = await setOverageCap(euros);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Plafond enregistré.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="flex items-end gap-2">
      <div className="space-y-1.5">
        <label htmlFor="cap" className="text-ink block text-sm font-medium">
          Plafond de dépassement / mois
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="cap"
            type="number"
            min={0}
            max={1000}
            step={5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28"
          />
          <span className="text-muted text-sm">€</span>
        </div>
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "…" : "Enregistrer"}
      </Button>
    </form>
  );
}
