import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";

export type RecoveryBucket = { label: string; amountCents: number };

/**
 * Graphe d'évolution du CA récupéré (barres mensuelles). Rendu serveur, sans
 * dépendance : le mois en cours est mis en avant en laque, les autres en nude.
 */
export function RecoveryChart({ data }: { data: RecoveryBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.amountCents));
  const hasData = data.some((d) => d.amountCents > 0);

  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-4">
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const pct = (d.amountCents / max) * 100;
          return (
            <div
              key={d.label}
              className="flex flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="tabular text-muted text-xs font-medium">
                {d.amountCents > 0 ? formatCents(d.amountCents) : ""}
              </span>
              <div
                title={`${d.label} : ${formatCents(d.amountCents)}`}
                style={{
                  height: `${Math.max(pct, d.amountCents > 0 ? 4 : 0)}%`,
                }}
                className={cn(
                  "w-full rounded-t-md transition-all",
                  d.amountCents === 0 && "bg-line h-0.5",
                  d.amountCents > 0 && (isLast ? "bg-lacquer" : "bg-nude"),
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {data.map((d) => (
          <div
            key={d.label}
            className="text-muted flex-1 text-center text-xs capitalize"
          >
            {d.label}
          </div>
        ))}
      </div>
      {!hasData ? (
        <p className="text-muted mt-4 text-center text-sm">
          Le CA récupéré s'affichera ici dès vos premières réactivations.
        </p>
      ) : null}
    </div>
  );
}
