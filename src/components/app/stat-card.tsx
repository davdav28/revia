import { cn } from "@/lib/utils";

/**
 * Petite carte de statistique du tableau de bord. `value` accepte un noeud
 * pour permettre le compteur animé sur la carte « CA récupéré ».
 */
export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line bg-surface rounded-lg border p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <p className="text-muted text-sm font-medium">{label}</p>
      <div className="mt-2">{value}</div>
      {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
