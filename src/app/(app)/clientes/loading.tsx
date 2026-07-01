/** Squelette instantané de la liste clientes (tableau) pendant le chargement. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-nude-soft h-7 w-40 rounded-md" />
        <div className="bg-nude-soft/60 h-4 w-64 rounded" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="bg-nude-soft/60 h-11 flex-1 rounded-md" />
        <div className="bg-nude-soft/60 h-11 w-40 rounded-md" />
      </div>
      <div className="border-line bg-surface overflow-hidden rounded-lg border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-line flex items-center gap-4 border-b p-4 last:border-0"
          >
            <div className="bg-nude-soft h-4 w-44 rounded" />
            <div className="bg-nude-soft/60 h-4 w-20 rounded" />
            <div className="bg-nude-soft/60 ml-auto h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
