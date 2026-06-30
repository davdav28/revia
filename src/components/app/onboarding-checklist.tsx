import Link from "next/link";
import { Check, Upload, Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS = { clients: Upload, relance: Send, adresse: MapPin } as const;

export type OnboardingStep = {
  key: keyof typeof ICONS;
  done: boolean;
  title: string;
  desc: string;
  href: string;
  cta: string;
};

/**
 * Checklist « Premiers pas » affichée tant que le salon n'a pas terminé sa
 * mise en route. Disparaît automatiquement une fois les 3 étapes faites.
 */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="border-lacquer/20 bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-ink font-semibold">Premiers pas</h2>
        <span className="tabular text-muted text-sm">
          {doneCount} / {steps.length}
        </span>
      </div>
      <p className="text-muted mt-1 text-sm">
        Trois étapes pour que Revia commence à vous ramener des clientes.
      </p>

      <ol className="mt-4 space-y-2">
        {steps.map((s) => {
          const Icon = ICONS[s.key];
          return (
            <li
              key={s.key}
              className={cn(
                "border-line flex items-center gap-3 rounded-lg border p-3",
                s.done && "bg-nude-soft/30",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  s.done
                    ? "bg-status-active/15 text-status-active"
                    : "bg-nude-soft text-lacquer-ink",
                )}
              >
                {s.done ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    s.done ? "text-muted line-through" : "text-ink",
                  )}
                >
                  {s.title}
                </p>
                {!s.done ? (
                  <p className="text-muted text-xs">{s.desc}</p>
                ) : null}
              </div>
              {!s.done ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={s.href}>{s.cta}</Link>
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
