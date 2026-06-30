import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LEGAL } from "@/config/legal";

const LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/sous-traitance", label: "Sous-traitance (RGPD)" },
];

/** Titre de section + paragraphe, réutilisés dans les pages légales. */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-ink text-base font-semibold">{title}</h2>
      <div className="text-muted space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-base min-h-dvh">
      <header className="border-line border-b">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <Link href="/">
            <Logo className="text-xl" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-muted mt-2 text-xs">
          Dernière mise à jour : {LEGAL.updatedAt}
        </p>
        {intro ? (
          <p className="text-muted mt-4 text-sm leading-relaxed">{intro}</p>
        ) : null}

        <div className="mt-8 space-y-7">{children}</div>

        <p className="border-status-at-risk/30 bg-status-at-risk/10 text-status-at-risk mt-10 rounded-md border px-3 py-2 text-xs">
          Ce document est un modèle de bonne foi. Faites-le vérifier par un
          juriste et complétez les mentions{" "}
          <code className="font-mono">[à compléter]</code> avant toute
          exploitation commerciale.
        </p>

        <nav className="border-line mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
