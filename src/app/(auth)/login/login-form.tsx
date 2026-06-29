"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

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
          autoComplete="current-password"
          placeholder="••••••••"
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
        {isPending ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-muted text-center text-sm">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="text-lacquer-ink font-medium hover:underline"
        >
          Créer un salon
        </Link>
      </p>
    </form>
  );
}
