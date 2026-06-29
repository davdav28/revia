import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function CguPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/">
        <Logo className="text-xl" />
      </Link>
      <h1 className="font-display text-ink mt-8 text-2xl font-bold tracking-tight">
        Conditions d'utilisation
      </h1>
      <p className="text-muted mt-2 text-sm">
        Modèle à compléter avec l'aide d'un juriste avant mise en production.
      </p>

      <div className="text-muted mt-6 space-y-4 text-sm leading-relaxed">
        <p>
          {BRAND.name} est un service d'aide à la réactivation client pour
          salons. En créant un compte, vous acceptez les présentes conditions.
        </p>
        <p>
          <strong className="text-ink">Abonnement</strong> : l'accès aux
          fonctions d'envoi est soumis à un abonnement actif, facturé selon la
          formule choisie, résiliable à tout moment.
        </p>
        <p>
          <strong className="text-ink">Responsabilités</strong> : le salon
          s'engage à ne contacter que des clientes ayant consenti, dans le
          respect de la réglementation (RGPD, prospection).
        </p>
        <p>
          <strong className="text-ink">Données</strong> : voir la{" "}
          <Link
            href="/confidentialite"
            className="text-lacquer-ink hover:underline"
          >
            politique de confidentialité
          </Link>
          .
        </p>
        <p>Contact : à compléter.</p>
      </div>
    </div>
  );
}
