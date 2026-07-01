/** Squelette instantané de l'agenda pendant le chargement. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-nude-soft h-7 w-36 rounded-md" />
          <div className="bg-nude-soft/60 h-4 w-56 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="bg-nude-soft/60 h-9 w-24 rounded-md" />
          <div className="bg-nude-soft/60 h-9 w-24 rounded-md" />
        </div>
      </div>
      <div className="border-line bg-surface h-[28rem] rounded-lg border" />
    </div>
  );
}
