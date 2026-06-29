import * as React from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/config/brand";

/**
 * Le glyphe « boucle » : un anneau presque clos dont la queue revient vers le
 * début — la boucle du cycle de l'ongle qui se referme. Trait unique, rond,
 * en `currentColor` pour se décliner en --ink sur clair et --base sur foncé.
 */
export function LogoMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-hidden
      className={className}
      {...props}
    >
      <path
        d="M61.6 18.1 A34 34 0 1 1 38.4 18.1 Q49 5.5 61 13.4"
        stroke="currentColor"
        strokeWidth={11}
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
