import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Parler à l'équipe",
  description:
    "Plusieurs salons, une question sur la formule Multi, un besoin sur-mesure ? Écrivez-nous, on vous répond sous 24 h ouvrées.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* En-tête */}
      <header className="border-line border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Logo className="text-xl" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tarifs">Tarifs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Essayer {BRAND.name}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <section className="mx-auto w-full max-w-xl px-6 pt-16 pb-4 text-center">
        <Badge tone="nude" className="mb-6">
          Formule Multi · plusieurs salons
        </Badge>
        <h1 className="font-display text-ink text-4xl leading-[1.05] font-extrabold tracking-tight">
          Parlons de vos salons.
        </h1>
        <p className="text-muted mx-auto mt-5 max-w-md text-lg leading-relaxed">
          Plusieurs adresses, une équipe à connecter, une question sur la
          formule Multi&nbsp;? Dites-nous où vous en êtes — on revient vers vous
          sous 24&nbsp;h ouvrées.
        </p>
      </section>

      <section className="mx-auto w-full max-w-xl px-6 py-8">
        <ContactForm />
      </section>

      {/* Pied de page */}
      <footer className="border-line mt-auto border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center">
          <Logo className="text-lg" />
          <div className="text-muted flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/tarifs" className="hover:text-ink">
              Tarifs
            </Link>
            <Link href="/mentions-legales" className="hover:text-ink">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-ink">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:text-ink">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
