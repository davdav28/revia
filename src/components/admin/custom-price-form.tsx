"use client";

import { useState, useTransition } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCustomMultiCheckout } from "@/server/admin-billing";
import type { BillingPeriod } from "@/config/brand";

export function CustomPriceForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    url: string;
    salonName: string;
    includedSms: number;
    overageCents: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [includedSms, setIncludedSms] = useState("");
  const [overageCents, setOverageCents] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await createCustomMultiCheckout({
        email,
        amountEuros: Number(amount),
        period,
        includedSms: includedSms === "" ? null : Number(includedSms),
        overageCents: overageCents === "" ? null : Number(overageCents),
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResult(res);
    });
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="a-email">Email du compte client</Label>
        <Input
          id="a-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@salon.fr"
          required
        />
        <p className="text-muted text-xs">
          Le client doit déjà avoir créé son compte Revia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="a-amount">
            Montant {period === "annual" ? "annuel" : "mensuel"} (€)
          </Label>
          <Input
            id="a-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="179"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Période</Label>
          <div className="border-line flex rounded-md border p-1">
            {(["monthly", "annual"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  period === p
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink",
                )}
              >
                {p === "monthly" ? "Mensuel" : "Annuel"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="a-sms">SMS inclus / mois</Label>
          <Input
            id="a-sms"
            inputMode="numeric"
            value={includedSms}
            onChange={(e) => setIncludedSms(e.target.value)}
            placeholder="1500 (standard)"
          />
          <p className="text-muted text-xs">Vide = 1500 (plan Multi).</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-overage">Prix du surplus (centimes / SMS)</Label>
          <Input
            id="a-overage"
            inputMode="numeric"
            value={overageCents}
            onChange={(e) => setOverageCents(e.target.value)}
            placeholder="10 (standard)"
          />
          <p className="text-muted text-xs">Vide = 10 c (0,10 €).</p>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Génération…" : "Générer le lien de paiement"}
      </Button>

      {result ? (
        <div className="border-line bg-surface space-y-3 rounded-xl border p-4">
          <p className="text-ink text-sm font-medium">
            Lien prêt pour « {result.salonName} »
          </p>
          <p className="text-muted text-xs">
            {result.includedSms.toLocaleString("fr-FR")} SMS inclus / mois ·
            surplus {(result.overageCents / 100).toFixed(2).replace(".", ",")} €
            / SMS
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={result.url}
              className="text-muted text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 px-3"
              onClick={copy}
              title="Copier"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 px-3"
              asChild
            >
              <a href={result.url} target="_blank" rel="noreferrer" title="Ouvrir">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
          <p className="text-muted text-xs">
            Envoie ce lien au client. Dès qu'il paie, son salon passe en Multi
            automatiquement (au tarif que tu viens de fixer).
          </p>
        </div>
      ) : null}
    </form>
  );
}
