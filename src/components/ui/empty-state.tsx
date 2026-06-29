import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * État vide : une invitation à agir, jamais un trou. Toujours un titre clair,
 * une phrase qui dit quoi faire, et (idéalement) une action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line bg-surface/60 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="bg-nude-soft text-lacquer-ink mb-4 flex size-12 items-center justify-center rounded-full">
          <Icon className="size-5" />
        </div>
      ) : null}
      <p className="font-display text-ink font-semibold">{title}</p>
      {description ? (
        <p className="text-muted mt-1 max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
