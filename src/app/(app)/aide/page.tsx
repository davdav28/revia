import type { Metadata } from "next";
import { LifeBuoy, Mail } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuggestionForm } from "@/components/app/suggestion-form";
import { formatDate } from "@/lib/dates";
import { ticketRef } from "@/lib/ticket";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = { title: "Aide & suggestions" };

// Contact support (centralisé dans la config légale).
const SUPPORT_EMAIL = LEGAL.contactEmail;

// FAQ — éditable ici, enrichissez-la au fil du temps.
const FAQ: { q: string; a: string }[] = [
  {
    q: "Comment importer mon fichier clients ?",
    a: "Allez dans Clients → Importer, puis choisissez un fichier CSV (prénom, nom, téléphone, email, dernière visite). Vous associez vos colonnes, vérifiez l'aperçu, et c'est importé.",
  },
  {
    q: "Comment Revia repère-t-il les clients à relancer ?",
    a: "Chaque client a un cycle de retour attendu (selon sa prestation habituelle). Quand il dépasse ce cycle, il passe « à surveiller » puis « à relancer ». Le cycle se règle dans Réglages → Prestations.",
  },
  {
    q: "Comment activer les relances automatiques ?",
    a: "Dans Relances, activez une campagne (par ex. « Relance des dormantes »). Le scan quotidien envoie alors le bon message aux bons clients, en respectant les horaires décents et leur consentement.",
  },
  {
    q: "Un client peut-il se désabonner ?",
    a: "Oui. Chaque message permet le désabonnement, et vous pouvez aussi marquer « Ne plus contacter » sur sa fiche. Un client désabonné n'est plus jamais contacté.",
  },
  {
    q: "Les messages partent-ils vraiment ?",
    a: "Tant que l'envoi réel (Brevo) n'est pas branché, les messages sont simulés en mode démonstration — tout le suivi fonctionne, sans envoi réel.",
  },
];

const CATEGORY_LABEL: Record<string, string> = {
  question: "Question",
  idea: "Idée",
  problem: "Souci",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Reçu",
  seen: "Vu",
  done: "Traité",
};

export default async function AidePage() {
  const member = await requireMember();
  const suggestions = await prisma.suggestion.findMany({
    where: { salonId: member.salonId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Aide & suggestions"
        description="Trouvez une réponse, ou dites-nous comment améliorer Revia."
      />

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
          Questions fréquentes
        </h2>
        <div className="divide-line border-line bg-surface divide-y overflow-hidden rounded-lg border">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="text-ink hover:bg-nude-soft/40 flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium">
                {item.q}
                <span className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted px-4 pb-4 text-sm leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Formulaire de suggestion */}
      <section className="space-y-3">
        <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
          Une idée, une question, un souci ?
        </h2>
        <Card>
          <CardContent className="pt-6">
            <SuggestionForm />
          </CardContent>
        </Card>
        <p className="text-muted flex items-center gap-2 text-sm">
          <Mail className="size-4" />
          Besoin d'une réponse rapide ?{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-lacquer-ink font-medium hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>

      {/* Historique des suggestions du salon */}
      {suggestions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
            Vos messages envoyés
          </h2>
          <div className="divide-line border-line bg-surface divide-y overflow-hidden rounded-lg border">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-start gap-4 p-4">
                <LifeBuoy className="text-lacquer-ink mt-0.5 size-4 shrink-0" />
                <div className="flex-1">
                  <p className="text-ink text-sm">{s.message}</p>
                  <div className="text-muted mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="tabular text-ink font-medium">
                      {ticketRef(s.id)}
                    </span>
                    <Badge tone="outline">
                      {CATEGORY_LABEL[s.category] ?? s.category}
                    </Badge>
                    <span>{formatDate(s.createdAt)}</span>
                    <span>· {STATUS_LABEL[s.status] ?? s.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
