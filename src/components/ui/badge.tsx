import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-nude-soft text-ink",
        nude: "bg-nude text-ink",
        outline: "border border-line text-muted",
        lacquer: "bg-lacquer text-[var(--base)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Couleur d'une pastille optionnelle (statut). */
  dotColor?: string;
}

function Badge({ className, tone, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dotColor ? (
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
