"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientActionState } from "@/server/clients";

export type ClientFormValues = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  birthdate?: string; // AAAA-MM-JJ
  smsConsent?: boolean;
  emailConsent?: boolean;
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-status-dormant text-xs">{msg}</p>;
}

export function ClientForm({
  action,
  defaultValues = {},
  showFirstVisit = false,
  submitLabel = "Enregistrer",
  cancelHref = "/clientes",
}: {
  action: (
    state: ClientActionState,
    formData: FormData,
  ) => Promise<ClientActionState>;
  defaultValues?: ClientFormValues;
  showFirstVisit?: boolean;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultValues.firstName}
            aria-invalid={!!fe.firstName}
            required
          />
          <FieldError msg={fe.firstName?.[0]} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultValues.lastName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            defaultValue={defaultValues.phone}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="cliente@email.fr"
            defaultValue={defaultValues.email}
            aria-invalid={!!fe.email}
          />
          <FieldError msg={fe.email?.[0]} />
        </div>
      </div>

      <div className="space-y-1.5 sm:max-w-[50%] sm:pr-2">
        <Label htmlFor="birthdate">
          Date de naissance (pour l'anniversaire)
        </Label>
        <Input
          id="birthdate"
          name="birthdate"
          type="date"
          defaultValue={defaultValues.birthdate}
        />
      </div>

      {showFirstVisit ? (
        <div className="border-line bg-nude-soft/40 grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-ink text-sm font-medium">
              Dernière visite (facultatif)
            </p>
            <p className="text-muted text-xs">
              Pour que Revia calcule tout de suite son statut.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastVisit">Date</Label>
            <Input id="lastVisit" name="lastVisit" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="35"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Préférences, allergies, remarques…"
          defaultValue={defaultValues.notes}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-ink mb-1 text-sm font-medium">
          Consentements
        </legend>
        <label className="text-ink flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="smsConsent"
            defaultChecked={defaultValues.smsConsent}
            className="accent-lacquer mt-0.5 size-4"
          />
          <span>
            Accepte de recevoir des <strong>SMS</strong> de relance.
          </span>
        </label>
        <label className="text-ink flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="emailConsent"
            defaultChecked={defaultValues.emailConsent}
            className="accent-lacquer mt-0.5 size-4"
          />
          <span>
            Accepte de recevoir des <strong>emails</strong> de relance.
          </span>
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : submitLabel}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={cancelHref}>Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
