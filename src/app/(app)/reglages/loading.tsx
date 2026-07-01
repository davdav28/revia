/** Squelette instantané des Réglages pendant le chargement. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="bg-nude-soft h-7 w-36 rounded-md" />
        <div className="bg-nude-soft/60 h-4 w-64 rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-line bg-surface h-20 rounded-lg border" />
      ))}
    </div>
  );
}
