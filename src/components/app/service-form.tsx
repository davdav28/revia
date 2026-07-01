"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceActionState } from "@/server/services";

export type ServiceFormValues = {
  name?: string;
  price?: string;
  intervalDays?: string;
};

export function ServiceForm({
  action,
  defaultValues = {},
  submitLabel = "Enregistrer",
}: {
  action: (
    state: ServiceActionState,
    formData: FormData,
  ) => Promise<ServiceActionState>;
  defaultValues?: ServiceFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nom de la prestation</Label>
        <Input
          id="name"
          name="name"
          placeholder="Coupe, soin, pose…"
          defaultValue={defaultValues.name}
          aria-invalid={!!fe.name}
          required
        />
        {fe.name ? (
          <p className="text-status-dormant text-xs">{fe.name[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Prix (€)</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="35"
            defaultValue={defaultValues.price}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intervalDays">Cycle de retour (jours)</Label>
          <Input
            id="intervalDays"
            name="intervalDays"
            inputMode="numeric"
            placeholder="21"
            defaultValue={defaultValues.intervalDays}
          />
          <p className="text-muted text-xs">
            Au bout de combien de jours le client devrait revenir. Laissez vide
            pour une prestation ponctuelle.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : submitLabel}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/reglages/services">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
