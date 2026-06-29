"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Le compteur de CA récupéré — l'élément signature de Revia.
 * C'est la première chose que voit la gérante : énorme, en rouge laque,
 * chiffres tabulaires, animé en montant. Tout le reste reste calme autour.
 *
 * L'animation écrit directement dans le DOM (ref) plutôt que dans un state
 * React : pas de re-render à chaque frame, et le rendu serveur affiche déjà la
 * valeur finale (accessible, lisible sans JS). Respecte prefers-reduced-motion
 * (on reste alors sur la valeur finale, sans animer).
 */
export function RecoveredCounter({
  amount,
  durationMs = 1400,
  className,
}: {
  /** Montant cible, en euros entiers. */
  amount: number;
  durationMs?: number;
  className?: string;
}) {
  const numberRef = React.useRef<HTMLSpanElement>(null);
  const fmt = React.useMemo(() => new Intl.NumberFormat("fr-FR"), []);
  const finalText = fmt.format(amount);

  React.useEffect(() => {
    const el = numberRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Mouvement réduit ou rien à animer : on laisse la valeur finale déjà rendue.
    if (prefersReduced || amount <= 0) return;

    let raf = 0;
    let start: number | null = null;
    // easeOutExpo : démarre vite, ralentit en fin — sensation de « ça monte ».
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / durationMs, 1);
      el.textContent = fmt.format(Math.round(ease(t) * amount));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    el.textContent = fmt.format(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [amount, durationMs, fmt]);

  return (
    <span
      className={cn(
        "tabular text-lacquer leading-none font-semibold tracking-tight",
        className,
      )}
      // La valeur réelle est annoncée d'un bloc par les lecteurs d'écran.
      aria-label={`${finalText} euros récupérés`}
    >
      <span aria-hidden ref={numberRef}>
        {finalText}
      </span>
      <span aria-hidden className="ml-1 align-baseline">
        €
      </span>
    </span>
  );
}
