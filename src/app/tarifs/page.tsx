import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { OverageSimulator } from "@/components/marketing/overage-simulator";
import { ComparisonMatrix } from "@/components/marketing/comparison-matrix";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Trois formules simples pour réactiver vos clients, dans les salons de beauté et de bien-être. Vous payez le volume, pas les fonctionnalités. Essai gratuit de 30 jours, sans engagement.",
};

export default function TarifsPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* En-tête */}
      <header className="border-line border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Logo className="text-xl" />
          </Link>
          <nav className="text-muted hidden items-center gap-8 text-sm sm:flex">
            <a href="#plans" className="hover:text-ink">
              Formules
            </a>
            <a href="#comparatif" className="hover:text-ink">
              Comparatif
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Essayer {BRAND.name}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-4 text-center">
        <Badge tone="nude" className="mb-6">
          Réactivation client · beauté & bien-être
        </Badge>
        <h1 className="font-display text-ink text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
          Vos clients reviennent. Sans que vous y pensiez.
        </h1>
        <p className="text-muted mx-auto mt-5 max-w-xl text-lg leading-relaxed">
          {BRAND.name} repère les clients qui ne reviennent plus et les relance
          au bon moment. Vous ne touchez à rien — vous voyez juste le chiffre
          d'affaires rentrer.
        </p>
      </section>

      {/* Formules */}
      <section id="plans" className="mx-auto w-full max-w-5xl px-6 py-10">
        <PricingCards />
      </section>

      {/* Simulateur de dépassement */}
      <section className="mx-auto w-full max-w-3xl px-6 py-10">
        <OverageSimulator />
      </section>

      {/* Comparatif */}
      <section
        id="comparatif"
        className="mx-auto w-full max-w-5xl px-6 py-12"
      >
        <div className="mb-8 text-center">
          <h2 className="font-display text-ink text-3xl font-bold tracking-tight">
            Tout comparer
          </h2>
          <p className="text-muted mt-2">
            Le produit complet sur chaque formule. Vous payez le volume, pas les
            fonctionnalités.
          </p>
        </div>
        <ComparisonMatrix />
      </section>

      {/* Pied de page */}
      <footer className="border-line mt-8 border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center">
          <Logo className="text-lg" />
          <p className="text-muted max-w-xl text-xs leading-relaxed">
            Tous les prix sont en euros TTC. Le quota de SMS se renouvelle chaque
            mois et n'est pas cumulable. Au-delà du quota, chaque SMS est facturé
            selon votre formule (0,16 € · 0,13 € · 0,10 €), avec un plafond que
            vous fixez.
          </p>
          <div className="text-muted flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/mentions-legales" className="hover:text-ink">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-ink">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:text-ink">
              Confidentialité
            </Link>
            <Link href="/sous-traitance" className="hover:text-ink">
              Sous-traitance
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
