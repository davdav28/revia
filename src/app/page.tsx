import Link from "next/link";
import {
  CalendarCheck,
  ScanLine,
  Send,
  TrendingUp,
  MessageSquareText,
  ShieldCheck,
  Building2,
  FlaskConical,
  Clock,
  BarChart3,
  Check,
  ArrowRight,
} from "lucide-react";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/brand/logo";
import { RecoveredCounter } from "@/components/brand/recovered-counter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCards } from "@/components/marketing/pricing-cards";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://reviagence.com";

const METIERS = [
  "Onglerie",
  "Coiffure",
  "Barbier",
  "Institut & esthétique",
  "Spa & massage",
  "Cils & sourcils",
  "Tatouage",
];

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Capter",
    text: "Qui est venu, quand, pour quelle prestation, à quel prix. Importez votre fichier en 2 minutes ou ajoutez les passages au fil de l'eau.",
  },
  {
    icon: ScanLine,
    title: "Détecter",
    text: `${BRAND.name} apprend le rythme de chaque prestation et repère automatiquement les clients qui auraient déjà dû revenir.`,
  },
  {
    icon: Send,
    title: "Relancer",
    text: "Le bon message, au bon moment, par SMS ou email. Des modèles prêts à l'emploi, adaptés à votre métier — vous ne touchez à rien.",
  },
  {
    icon: TrendingUp,
    title: "Prouver",
    text: "Un tableau de bord clair : le chiffre d'affaires que vos relances ont réellement rapporté, mois après mois.",
  },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "Détection automatique",
    text: "Revia sait quand chaque client devrait revenir et repère ceux qui décrochent — sans que vous ayez à y penser.",
  },
  {
    icon: MessageSquareText,
    title: "Messages prêts à l'emploi",
    text: "Une bibliothèque de SMS et emails écrits pour votre métier, éditables en un clic. Rappel de cycle, anniversaire, créneau libéré…",
  },
  {
    icon: BarChart3,
    title: "Preuve du chiffre récupéré",
    text: "Chaque client relancé qui reprend rendez-vous est tracé. Vous voyez le CA récupéré, pas juste des messages envoyés.",
  },
  {
    icon: FlaskConical,
    title: "Test A/B des messages",
    text: "Deux variantes par scénario, Revia mesure celle qui ramène le plus de monde et privilégie la gagnante.",
  },
  {
    icon: Building2,
    title: "Multi-salon",
    text: "Plusieurs adresses ? Un tableau de bord consolidé, des équipes, et chaque salon garde ses réglages.",
  },
  {
    icon: ShieldCheck,
    title: "Conforme RGPD",
    text: "Consentement, désabonnement STOP, hébergement en Europe. Vos données et celles de vos clients sont protégées.",
  },
];

const FAQ = [
  {
    q: "Revia, c'est pour quels salons ?",
    a: "Pour tous les métiers de la beauté et du bien-être sur rendez-vous : onglerie, coiffure, barbier, institut et esthétique, spa, massage, extensions de cils, tatouage… Si vos clients reviennent à un rythme régulier, Revia est fait pour vous.",
  },
  {
    q: "Comment Revia sait quand relancer un client ?",
    a: "Revia apprend le cycle de chaque prestation (un remplissage toutes les 3 semaines, une couleur toutes les 5…) et repère automatiquement les clients qui ont dépassé leur date de retour habituelle. La relance part au bon moment, sans que vous ayez à surveiller quoi que ce soit.",
  },
  {
    q: "Dois-je écrire les messages moi-même ?",
    a: "Non. Revia fournit une bibliothèque de SMS et d'emails déjà rédigés, adaptés à votre métier. Vous pouvez les envoyer tels quels ou les personnaliser en un clic depuis votre espace.",
  },
  {
    q: "Faut-il installer un logiciel ou changer ma caisse ?",
    a: "Non, tout se passe en ligne. Vous importez votre fichier client (ou vous saisissez les visites au fil de l'eau) et c'est parti — aucune installation, aucun matériel.",
  },
  {
    q: "Est-ce conforme au RGPD ?",
    a: "Oui. Revia gère le consentement, la mention de désabonnement STOP obligatoire et l'hébergement des données en Europe. Vous restez propriétaire de vos données et pouvez les exporter ou les supprimer à tout moment.",
  },
  {
    q: "Combien ça coûte et puis-je résilier ?",
    a: "À partir de 69 €/mois, avec un essai gratuit de 30 jours. Vous payez le volume de SMS, pas les fonctionnalités : toutes les formules ont accès à tout. Sans engagement, résiliable à tout moment.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: BRAND.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      inLanguage: "fr-FR",
      description: BRAND.description,
      offers: { "@type": "Offer", price: "69", priceCurrency: "EUR" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
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
      <header className="border-line bg-base/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo className="text-xl" />
          <nav className="text-muted hidden items-center gap-8 text-sm md:flex">
            <a href="#methode" className="hover:text-ink">
              Comment ça marche
            </a>
            <a href="#fonctionnalites" className="hover:text-ink">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="hover:text-ink">
              Tarifs
            </a>
            <a href="#faq" className="hover:text-ink">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <Badge tone="nude" className="mb-6">
            Réactivation client · beauté & bien-être
          </Badge>
          <h1 className="font-display text-ink text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Vos clients reviennent.
            <br />
            <span className="text-lacquer-ink">Vous le prouvez.</span>
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">
            Une partie de vos clients ne revient plus — pas par mécontentement,
            juste par oubli. {BRAND.name} les repère, les relance au bon moment
            par SMS, et vous montre le chiffre d'affaires récupéré.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Essayer gratuitement
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#methode">Voir comment ça marche</a>
            </Button>
          </div>
          <p className="text-muted mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-status-active size-4" /> 30 jours d'essai
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-status-active size-4" /> Sans engagement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="text-status-active size-4" /> Conforme RGPD
            </span>
          </p>
        </div>

        {/* Aperçu produit */}
        <div className="relative">
          <div className="border-line bg-surface rounded-2xl border p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm font-medium">
                CA récupéré · ce mois-ci
              </span>
              <Badge tone="outline">Aperçu</Badge>
            </div>
            <div className="mt-5">
              <RecoveredCounter amount={1240} className="text-6xl sm:text-7xl" />
            </div>
            <div className="border-line mt-6 grid grid-cols-2 gap-4 border-t pt-6">
              <div>
                <div className="tabular text-ink text-2xl font-semibold">12</div>
                <div className="text-muted text-sm">clients revenus</div>
              </div>
              <div>
                <div className="tabular text-ink text-2xl font-semibold">
                  38
                </div>
                <div className="text-muted text-sm">relances envoyées</div>
              </div>
            </div>
            <div className="border-line mt-6 space-y-3 border-t pt-6">
              {[
                { n: "Camille", s: "Remplissage · revenue", ok: true },
                { n: "Marc", s: "Relance envoyée · en attente", ok: false },
                { n: "Léa", s: "Anniversaire · revenue", ok: true },
              ].map((r) => (
                <div key={r.n} className="flex items-center gap-3">
                  <span
                    className={
                      r.ok
                        ? "bg-status-active/15 text-status-active flex size-8 items-center justify-center rounded-full"
                        : "bg-nude-soft text-lacquer-ink flex size-8 items-center justify-center rounded-full"
                    }
                  >
                    {r.ok ? (
                      <Check className="size-4" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-ink text-sm font-medium">{r.n}</div>
                    <div className="text-muted truncate text-xs">{r.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau métiers */}
      <section className="border-line bg-surface/40 border-y">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-muted text-center text-sm font-medium">
            Pensé pour les salons de beauté &amp; de bien-être
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {METIERS.map((m) => (
              <span
                key={m}
                className="border-line text-ink rounded-full border px-3.5 py-1.5 text-sm"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problème */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge tone="nude" className="mb-5">
              Le problème
            </Badge>
            <h2 className="font-display text-ink text-3xl font-bold tracking-tight sm:text-4xl">
              Chaque mois, des clients disparaissent en silence
            </h2>
            <p className="text-muted mt-4 leading-relaxed">
              Ils étaient satisfaits. Ils comptaient revenir. Puis la vie a
              pris le dessus, et un mois plus tard ils testent le salon d'à
              côté. Sans relance, <strong className="text-ink">1 client
              sur 4 ne revient jamais</strong> — et vous ne le voyez même pas
              passer.
            </p>
            <p className="text-muted mt-4 leading-relaxed">
              Récupérer un client existant coûte bien moins cher que d'en
              trouver un nouveau. {BRAND.name} s'en occupe automatiquement.
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
                className="border-line bg-surface rounded-xl border p-5"
              >
                <div className="tabular text-lacquer-ink text-2xl font-bold sm:text-3xl">
                  {stat.v}
                </div>
                <div className="text-muted mt-1 text-sm">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Méthode / la boucle */}
      <section
        id="methode"
        className="border-line bg-surface/40 scroll-mt-20 border-t"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <Badge tone="nude" className="mb-5">
              Comment ça marche
            </Badge>
            <h2 className="font-display text-ink text-3xl font-bold tracking-tight sm:text-4xl">
              {BRAND.name} referme le cycle en quatre temps
            </h2>
            <p className="text-muted mt-3">
              De la dernière visite au client qui repasse la porte,{" "}
              {BRAND.name} s'occupe de tout — vous gardez la main.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="border-line bg-surface relative rounded-xl border p-6"
              >
                <div className="bg-nude-soft text-lacquer-ink flex size-11 items-center justify-center rounded-lg">
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

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="max-w-2xl">
          <Badge tone="nude" className="mb-5">
            Fonctionnalités
          </Badge>
          <h2 className="font-display text-ink text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce qu'il faut pour faire revenir vos clients
          </h2>
          <p className="text-muted mt-3">
            Le produit complet, sur chaque formule. Vous payez le volume, pas
            les fonctionnalités.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border-line bg-surface rounded-xl border p-6"
            >
              <div className="bg-nude-soft text-lacquer-ink flex size-11 items-center justify-center rounded-lg">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display text-ink mt-5 text-lg font-semibold">
                {f.title}
              </h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Preuve / ROI (bandeau sombre) */}
      <section className="bg-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--base)] sm:text-4xl">
              Vous voyez exactement ce que {BRAND.name} vous rapporte
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--nude)]">
              Pas de promesses en l'air. Chaque relance qui ramène un client est
              tracée et chiffrée. À la fin du mois, vous savez précisément
              combien {BRAND.name} a remis dans votre caisse — et l'outil se
              rembourse largement.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Démarrer mon essai gratuit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--nude)]/80">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> Prêt en 10 minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4" /> Sans engagement, résiliable à tout
                moment
              </span>
            </p>
          </div>
          <div className="border-lacquer/20 rounded-2xl border bg-[color-mix(in_srgb,var(--base)_6%,transparent)] p-8 text-center">
            <div className="text-sm font-medium text-[var(--nude)]">
              CA récupéré · 90 derniers jours
            </div>
            <div className="mt-3">
              <RecoveredCounter
                amount={4870}
                className="text-5xl text-[var(--base)] sm:text-6xl"
              />
            </div>
            <div className="mt-4 text-sm text-[var(--nude)]/80">
              soit bien plus que le coût de l'abonnement
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="nude" className="mb-5">
            Tarifs
          </Badge>
          <h2 className="font-display text-ink text-3xl font-bold tracking-tight sm:text-4xl">
            Un prix simple. Payez le volume, pas les fonctionnalités
          </h2>
          <p className="text-muted mt-3">
            Trois formules, toutes les fonctionnalités incluses. Essai gratuit
            de 30 jours, sans engagement.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards />
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/tarifs"
            className="text-lacquer-ink inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            Voir le détail des tarifs et le comparatif
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-line bg-surface/40 scroll-mt-20 border-t"
      >
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center">
            <Badge tone="nude" className="mb-5">
              FAQ
            </Badge>
            <h2 className="font-display text-ink text-3xl font-bold tracking-tight sm:text-4xl">
              Les questions qu'on nous pose
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="border-line bg-surface group rounded-xl border p-5 [&_svg]:open:rotate-45"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-ink font-medium">{f.q}</span>
                  <span className="text-muted text-2xl leading-none transition-transform">
                    +
                  </span>
                </summary>
                <p className="text-muted mt-3 text-sm leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-display text-ink mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Arrêtez de perdre des clients en silence
        </h2>
        <p className="text-muted mx-auto mt-4 max-w-xl">
          Importez votre fichier, activez vos relances, et laissez {BRAND.name}
          vous ramener du monde. La plupart des salons récupèrent leurs premiers
          clients avant la fin de l'essai.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">
              Essayer {BRAND.name} gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </Button>
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
            <Link href="/tarifs" className="hover:text-ink">
              Tarifs
            </Link>
            <Link href="/contact" className="hover:text-ink">
              Contact
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
            <Link href="/sous-traitance" className="hover:text-ink">
              Sous-traitance
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
