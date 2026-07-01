"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/server/contact";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    company: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitContact(form);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setDone(res.ref);
    });
  }

  if (done) {
    return (
      <div className="border-line bg-surface rounded-xl border p-6 text-center">
        <div className="bg-status-active/10 text-status-active mx-auto flex size-12 items-center justify-center rounded-full">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="font-display text-ink mt-4 text-lg font-semibold">
          Message envoyé !
        </p>
        <p className="text-muted mt-1 text-sm">
          On vous répond très vite. Votre référence :{" "}
          <span className="tabular text-ink font-medium">{done}</span>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border-line bg-surface space-y-4 rounded-xl border p-6"
    >
      {error ? (
        <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {/* Champ piège anti-spam, caché aux humains */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={form.company}
        onChange={(e) => set("company", e.target.value)}
        className="hidden"
        aria-hidden
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Votre nom</Label>
          <Input
            id="c-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Camille Dupont"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input
            id="c-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="vous@salon.fr"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-phone">Téléphone (facultatif)</Label>
        <Input
          id="c-phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="06 12 34 56 78"
          inputMode="tel"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-message">Votre message</Label>
        <Textarea
          id="c-message"
          className="min-h-28"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Combien de salons ? Vos outils actuels ? Ce que vous cherchez…"
          required
        />
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Envoi…" : "Envoyer mon message"}
      </Button>
      <p className="text-muted text-center text-xs">
        On vous répond en général sous 24 h ouvrées.
      </p>
    </form>
  );
}
