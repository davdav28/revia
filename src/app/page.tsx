import Link from "next/link";
import { CalendarCheck, ScanLine, Send, TrendingUp } from "lucide-react";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/brand/logo";
import { RecoveredCounter } from "@/components/brand/recovered-counter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Capter",
    text: "Qui est venu, quand, pour quelle prestation, à quel prix. Importez votre fichier ou ajoutez les passages au fil de l'eau.",
  },
  {
    icon: ScanLine,
    title: "Détecter",
    text: `${BRAND.name} sait à quel rythme chaque client devrait revenir. Il repère ceux qui ont dépassé la date — en semaines, pas en mois.`,
  },
  {
    icon: Send,
    title: "Relancer",
    text: "Le bon message, au bon moment, avec la bonne offre. Par SMS ou par email, automatiquement.",
  },
  {
    icon: TrendingUp,
    title: "Prouver",
    text: "Un tableau de bord clair : le chiffre d'affaires que vos relances ont rapporté, mois après mois.",
  },
];

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://reviagence.com";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: BRAND.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  inLanguage: "fr-FR",
  description: BRAND.description,
  offers: {
    "@type": "Offer",
    price: "69",
    priceCurrency: "EUR",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* En-tête */}
      <header className="border-line border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo className="text-xl" />
          <nav className="text-muted hidden items-center gap-8 text-sm sm:flex">
            <a href="#boucle" className="hover:text-ink">
              Comment ça marche
            </a>
            <a href="#metiers" className="hover:text-ink">
              Votre métier
            </a>
            <Link href="/tarifs" className="hover:text-ink">
              Tarifs
            </Link>
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
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <Badge tone="nude" className="mb-6">
            Réactivation client · beauté & bien-être
          </Badge>
          <h1 className="font-display text-ink text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {BRAND.tagline}
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">
            Une partie de vos clients ne revient plus — pas par mécontentement,
            juste par oubli. {BRAND.name} les repère, les relance au bon moment
            et vous montre le chiffre d'affaires récupéré.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Essayer gratuitement</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#boucle">Voir comment ça marche</a>
            </Button>
          </div>
          <p className="text-muted mt-4 text-sm">
            Sans engagement · Conforme RGPD · Hébergé en Europe
          </p>
        </div>

        {/* Aperçu produit : on dépense l'audace ici, une seule fois. */}
        <div className="relative">
          <div className="border-line bg-surface rounded-xl border p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm font-medium">
                CA récupéré · ce mois-ci
              </span>
              <Badge tone="outline">Aperçu</Badge>
            </div>
            <div className="mt-6">
              <RecoveredCounter
                amount={1240}
                className="text-6xl sm:text-7xl"
              />
            </div>
            <div className="border-line mt-8 grid grid-cols-2 gap-4 border-t pt-6">
              <div>
                <div className="tabular text-ink text-2xl font-semibold">
                  12
                </div>
                <div className="text-muted text-sm">clients revenus</div>
              </div>
              <div>
                <div className="tabular text-ink text-2xl font-semibold">3</div>
                <div className="text-muted text-sm">relances envoyées</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* La boucle */}
      <section id="boucle" className="border-line bg-surface/40 border-t">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-ink text-3xl font-bold tracking-tight">
            {BRAND.name} referme le cycle en quatre temps
          </h2>
          <p className="text-muted mt-3 max-w-2xl">
            De la dernière visite au client qui repasse la porte,{" "}
            {BRAND.name} s'occupe de tout — vous gardez la main.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="bg-nude-soft text-lacquer-ink flex size-11 items-center justify-center rounded-md">
                  <step.icon className="size-5" />
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="tabular text-muted text-sm">0{i + 1}</span>
                  <h3 className="font-display text-ink text-lg font-semibold">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi la beauté & le bien-être */}
      <section id="metiers" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-ink text-3xl font-bold tracking-tight">
              Dans la beauté, chaque semaine compte
            </h2>
            <p className="text-muted mt-4 leading-relaxed">
              Ongles à remplir, couleur qui repousse, barbe à retailler, soin à
              renouveler : vos clients reviennent à un rythme régulier — souvent
              toutes les 2 à 6 semaines. La fenêtre est courte. {BRAND.name}{" "}
              relance pile au moment où le client hésite — avant qu'il n'aille
              tester le salon d'à côté.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { v: "2–6 sem.", l: "le rythme de retour selon la prestation" },
              { v: "1 sur 4", l: "ne revient jamais, faute d'un rappel" },
              { v: "2× plus", l: "de retours quand on relance à temps" },
            ].map((stat) => (
              <div
                key={stat.l}
                className="border-line bg-surface rounded-lg border p-5"
              >
                <div className="tabular text-ink text-2xl font-semibold">
                  {stat.v}
                </div>
                <div className="text-muted mt-1 text-sm">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-line border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <Logo className="text-lg" />
            <p className="text-muted mt-2 max-w-xs text-sm">
              Le retour de vos clients est une boucle. On la referme avec vous.
            </p>
          </div>
          <div className="text-muted flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span>Conforme RGPD</span>
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
