import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { BRAND } from "@/config/brand";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecoveredCounter } from "@/components/brand/recovered-counter";
import { CLIENT_STATUS, type ClientStatus } from "@/lib/client-status";

export const metadata: Metadata = { title: "Design system" };

const SWATCHES = [
  { name: "base", var: "--base" },
  { name: "surface", var: "--surface" },
  { name: "ink", var: "--ink" },
  { name: "muted", var: "--muted" },
  { name: "line", var: "--line" },
  { name: "lacquer", var: "--lacquer" },
  { name: "lacquer-ink", var: "--lacquer-ink" },
  { name: "nude", var: "--nude" },
  { name: "nude-soft", var: "--nude-soft" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line border-t py-12">
      <h2 className="font-display text-muted mb-6 text-sm font-semibold tracking-widest uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const statuses = Object.keys(CLIENT_STATUS) as ClientStatus[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo className="text-2xl" />
        <Badge tone="outline">Design system</Badge>
      </div>

      <Section title="Couleurs">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SWATCHES.map((s) => (
            <div key={s.name}>
              <div
                className="border-line h-16 rounded-md border"
                style={{ background: `var(${s.var})` }}
              />
              <div className="text-ink mt-2 text-sm font-medium">{s.name}</div>
              <div className="tabular text-muted text-xs">{s.var}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="space-y-4">
          <p className="font-display text-ink text-5xl font-extrabold tracking-tight">
            Display · Hanken Grotesk
          </p>
          <p className="text-ink text-lg">
            Corps · Hanken Grotesk — lisible, chaleureux, sans être Inter.
          </p>
          <p className="tabular text-ink text-2xl">
            Chiffres tabulaires · 1 240 € · 0123456789
          </p>
        </div>
      </Section>

      <Section title="Compteur signature">
        <RecoveredCounter amount={1240} className="text-7xl" />
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Envoyer la relance</Button>
          <Button variant="secondary">Voir le détail</Button>
          <Button variant="subtle">Importer</Button>
          <Button variant="ghost">Annuler</Button>
          <Button variant="link">En savoir plus</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Petit</Button>
          <Button size="md">Moyen</Button>
          <Button size="lg">Grand</Button>
          <Button disabled>Désactivé</Button>
        </div>
      </Section>

      <Section title="Statuts cliente">
        <div className="flex flex-wrap gap-3">
          {statuses.map((s) => (
            <Badge key={s} dotColor={CLIENT_STATUS[s].color} tone="neutral">
              {CLIENT_STATUS[s].label}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Cartes">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Clientes à relancer</CardTitle>
              <CardDescription>
                8 clientes ont dépassé leur cycle cette semaine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecoveredCounter amount={680} className="text-4xl" />
            </CardContent>
            <CardFooter>
              <Button size="sm">Préparer les relances</Button>
            </CardFooter>
          </Card>

          {/* État vide : une invitation à agir, pas un trou. */}
          <Card className="flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-nude-soft text-lacquer-ink flex size-12 items-center justify-center rounded-full">
              <Inbox className="size-5" />
            </div>
            <p className="font-display text-ink mt-4 font-semibold">
              Aucune cliente dormante pour l'instant
            </p>
            <p className="text-muted mt-1 max-w-xs text-sm">
              Importez votre fichier clientes pour que {BRAND.name} commence à
              détecter les retours en retard.
            </p>
            <Button size="sm" className="mt-5">
              Importer mon fichier
            </Button>
          </Card>
        </div>
      </Section>

      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-6">
          <div className="border-line bg-surface rounded-lg border px-6 py-5">
            <Logo className="text-3xl" />
          </div>
          <div className="bg-ink rounded-lg px-6 py-5">
            <Logo className="text-3xl text-[var(--base)]" />
          </div>
          <div className="border-line bg-surface flex items-center gap-3 rounded-lg border px-6 py-5">
            <LogoMark className="text-lacquer size-8" />
            <LogoMark className="text-ink size-8" />
          </div>
        </div>
      </Section>
    </div>
  );
}
