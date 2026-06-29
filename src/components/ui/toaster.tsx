"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster Revia — sonner re-thémé avec nos tokens (surface, ink, laque).
 * On réexporte `toast` pour un usage direct dans les composants.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={10}
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)",
          fontFamily: "var(--font-sans)",
        },
        classNames: {
          description: "text-muted",
          actionButton: "bg-lacquer text-[var(--base)]",
          cancelButton: "bg-nude-soft text-ink",
        },
      }}
      style={
        {
          "--success-text": "var(--status-active)",
          "--error-text": "var(--status-dormant)",
        } as React.CSSProperties
      }
    />
  );
}

export { toast } from "sonner";
