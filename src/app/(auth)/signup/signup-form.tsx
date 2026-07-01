"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { METIER_OPTIONS } from "@/lib/metiers";

const initial: AuthState = {};

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initial);

  if (state.message) {
    return (
      <p
        role="status"
        className="border-status-active/30 bg-status-active/10 text-status-active rounded-md border px-4 py-3 text-sm"
      >
        {state.message}
      </p>
    );
  }

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
        <Label htmlFor="salonName">Nom de votre salon</Label>
        <Input
          id="salonName"
          name="salonName"
          placeholder="Studio Beauté & Co"
          aria-invalid={!!state.fieldErrors?.salonName}
          required
        />
        {state.fieldErrors?.salonName ? (
          <p className="text-status-dormant text-xs">
            {state.fieldErrors.salonName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metier">Votre métier</Label>
        <select
          id="metier"
          name="metier"
          defaultValue="onglerie"
          className="border-line bg-surface text-ink focus-visible:ring-lacquer/40 h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        >
          {METIER_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-muted text-xs">
          On pré-remplit vos prestations et vos modèles de messages en fonction.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Votre prénom (facultatif)</Label>
        <Input
          id="name"
          name="name"
          placeholder="Camille"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@salon.fr"
          aria-invalid={!!state.fieldErrors?.email}
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-status-dormant text-xs">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          aria-invalid={!!state.fieldErrors?.password}
          required
        />
        {state.fieldErrors?.password ? (
          <p className="text-status-dormant text-xs">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Création…" : "Créer mon salon"}
      </Button>

      <p className="text-muted text-center text-xs">
        En créant votre salon, vous acceptez les{" "}
        <Link href="/cgu" className="hover:text-ink underline">
          conditions d'utilisation
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" className="hover:text-ink underline">
          politique de confidentialité
        </Link>
        .
      </p>

      <p className="text-muted text-center text-sm">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-lacquer-ink font-medium hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
