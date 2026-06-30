import * as React from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/config/brand";

/**
 * Le glyphe « boucle » : une spirale qui s'enroule vers son centre — le cycle
 * de l'ongle qui revient. Trait unique, rond, en rouge laque (identique au
 * branding Stripe et aux logos `public/brand/`).
 */
export function LogoMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="none"
      role="img"
      aria-hidden
      className={className}
      {...props}
    >
      <path
        d="M5 13c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2.8-2.3 5-5 5-2.2 0-4-1.8-4-4 0-1.7 1.3-3 3-3"
        stroke="var(--lacquer)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Lockup complet : le glyphe boucle (symbole du cycle / du retour) suivi du
 * nom du produit, posé dans la police display, graisse forte. Le wordmark lit
 * `BRAND.name`, donc un changement de nom se répercute ici sans toucher au code.
 */
export function Logo({
  className,
  withWordmark = true,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { withWordmark?: boolean }) {
  if (!withWordmark) {
    return (
      <span
        className={cn("text-ink inline-flex", className)}
        aria-label={BRAND.name}
        {...props}
      >
        <LogoMark className="size-[1em]" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-display text-ink inline-flex items-center gap-[0.34em] text-2xl font-extrabold tracking-tight select-none",
        className,
      )}
      aria-label={BRAND.name}
      role="img"
      {...props}
    >
      <LogoMark aria-hidden className="size-[0.82em]" />
      <span aria-hidden>{BRAND.name}</span>
    </span>
  );
}
