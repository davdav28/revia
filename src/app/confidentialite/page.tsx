import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/">
        <Logo className="text-xl" />
      </Link>
      <h1 className="font-display text-ink mt-8 text-2xl font-bold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="text-muted mt-2 text-sm">
        Modèle à compléter avec l'aide d'un juriste avant mise en production.
      </p>

      <div className="text-muted mt-6 space-y-4 text-sm leading-relaxed">
        <p>
          {BRAND.name} aide les salons à gérer la relation avec leurs clientes.
          Les données traitées (coordonnées, visites, consentements) le sont
          pour le compte du salon, responsable de traitement.
        </p>
        <p>
          <strong className="text-ink">Données collectées</strong> : identité et
          coordonnées des clientes, historique de visites, consentements aux
          communications.
        </p>
        <p>
          <strong className="text-ink">Finalités</strong> : gestion des
          rendez-vous et envoi de messages de réactivation, uniquement aux
          clientes ayant consenti.
        </p>
        <p>
          <strong className="text-ink">Vos droits</strong> : accès,
          rectification, suppression, portabilité, opposition. Chaque message
          permet le désabonnement ; les données sont exportables et supprimables
          depuis l'application.
        </p>
        <p>
          <strong className="text-ink">Hébergement</strong> : Union européenne.
          <strong className="text-ink"> Sous-traitants</strong> : Supabase (base
          de données), Brevo (envoi SMS/email), Stripe (paiement).
        </p>
        <p>Contact : à compléter.</p>
      </div>
    </div>
  );
}
