import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/config/brand";

const POINTS = [
  "Détecte les clients qui ne reviennent plus.",
  "Les relance au bon moment, par SMS ou email.",
  "Vous montre le chiffre d'affaires récupéré.",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Volet de marque (caché en mobile) */}
      <aside className="bg-ink relative hidden flex-col justify-between p-12 lg:flex">
        <Link href="/">
          <Logo className="text-2xl text-[var(--base)]" />
        </Link>
        <div>
          <h2 className="font-display text-3xl leading-tight font-bold text-[var(--base)]">
            {BRAND.tagline}
          </h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[var(--nude)]">
                <span className="bg-lacquer mt-2 size-1.5 shrink-0 rounded-full" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-[var(--nude)]/70">
          Le retour de vos clients est une boucle. On la referme avec vous.
        </p>
      </aside>

      {/* Volet formulaire */}
      <main className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo className="text-2xl" />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
