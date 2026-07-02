export type TrendPoint = { label: string; value: number };

/** Petit graphe à barres (6 mois), sans dépendance externe. */
export function TrendChart({
  title,
  points,
  format,
}: {
  title: string;
  points: TrendPoint[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <div className="border-line bg-surface rounded-xl border p-5">
      <h3 className="text-ink text-sm font-semibold">{title}</h3>
      <div className="mt-4 flex h-40 gap-2">
        {points.map((p, i) => {
          const pct = Math.round((p.value / max) * 100);
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="text-muted tabular h-4 text-[10px]">
                {p.value > 0 ? format(p.value) : ""}
              </div>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="bg-lacquer/70 w-full rounded-t-md transition-all"
                  style={{ height: `${p.value > 0 ? Math.max(pct, 3) : 0}%` }}
                  title={`${p.label} · ${format(p.value)}`}
                />
              </div>
              <div className="text-muted mt-1 h-4 text-xs capitalize">
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
