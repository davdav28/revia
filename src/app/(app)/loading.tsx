/**
 * Squelette de chargement affiché instantanément à chaque navigation dans
 * l'app (App Router). Donne un retour immédiat le temps que les données du
 * serveur arrivent — l'app paraît bien plus fluide.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-nude-soft h-7 w-52 rounded-md" />
        <div className="bg-nude-soft/60 h-4 w-72 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-line bg-surface h-24 rounded-lg border"
          />
        ))}
      </div>
      <div className="border-line bg-surface h-56 rounded-lg border" />
    </div>
  );
}
