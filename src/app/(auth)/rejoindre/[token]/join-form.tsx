"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitationAction, type AcceptState } from "@/server/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AcceptState = {};

export function JoinForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    acceptInvitationAction,
    initial,
  );

  // Session ouverte côté serveur (email confirmation désactivée) → on entre.
  useEffect(() => {
    if (state.message === "ok") router.replace("/dashboard");
  }, [state.message, router]);

  // Email confirmation requise → message à afficher.
  if (state.message && state.message !== "ok") {
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
      <input type="hidden" name="token" value={token} />

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
        <Input id="email" type="email" value={email} disabled readOnly />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Votre prénom (facultatif)</Label>
        <Input id="name" name="name" placeholder="Camille" autoComplete="name" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Choisissez un mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Création…" : "Rejoindre l'équipe"}
      </Button>
    </form>
  );
}
