/** Squelette instantané de la page Relances pendant le chargement. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-nude-soft h-7 w-32 rounded-md" />
          <div className="bg-nude-soft/60 h-4 w-72 rounded" />
        </div>
        <div className="bg-nude-soft/60 h-9 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-line bg-surface h-20 rounded-lg border" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-line bg-surface h-24 rounded-lg border" />
        ))}
      </div>
    </div>
  );
}
