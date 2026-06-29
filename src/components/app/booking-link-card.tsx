"use client";

import { useState, useTransition } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { setBookingEnabled } from "@/server/salon";

export function BookingLinkCard({
  url,
  enabled,
}: {
  url: string;
  enabled: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const shown = isPending ? !enabled : enabled;

  function copy() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      toast.success("Lien copié.");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggle() {
    startTransition(async () => {
      await setBookingEnabled(!enabled);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-ink text-sm font-medium">Réservation en ligne</p>
          <p className="text-muted mt-0.5 text-sm">
            {enabled
              ? "Vos clientes peuvent réserver via ce lien."
              : "Désactivée — le lien renvoie une page indisponible."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={shown}
          aria-label="Activer la réservation en ligne"
          disabled={isPending}
          onClick={toggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            shown ? "bg-lacquer" : "bg-line",
          )}
        >
          <span
            className={cn(
              "bg-surface inline-block size-5 rounded-full shadow transition-transform",
              shown ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <code className="border-line bg-base text-muted flex-1 truncate rounded-md border px-3 py-2 text-sm">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="border-line bg-surface text-ink hover:bg-nude-soft flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copié" : "Copier"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="border-line bg-surface text-ink hover:bg-nude-soft flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors"
        >
          <ExternalLink className="size-4" />
          Ouvrir
        </a>
      </div>
    </div>
  );
}
