import type { Metadata } from "next";
import { BRAND, SUBSCRIPTION } from "@/config/brand";
import { LEGAL } from "@/config/legal";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      intro={`Les présentes conditions régissent l'utilisation du service ${BRAND.name} par les salons professionnels (« le Client »). En créant un compte, le Client les accepte sans réserve.`}
    >
      <Section title="1. Objet du service">
        <p>
          {BRAND.name} est un outil d'aide à la réactivation de la clientèle des
          salons : détection des clientes inactives, envoi de messages de
          relance (SMS / email), prise de rendez-vous en ligne et suivi du
          chiffre d'affaires récupéré.
        </p>
      </Section>

      <Section title="2. Compte et accès">
        <p>
          L'accès nécessite la création d'un compte avec une adresse email
          valide. Le Client est responsable de la confidentialité de ses
          identifiants et de toute activité réalisée depuis son compte.
        </p>
      </Section>

      <Section title="3. Abonnement et facturation">
        <p>
          L'envoi de relances requiert un abonnement actif. Trois formules sont
          proposées ({SUBSCRIPTION.plans.map((p) => p.label).join(", ")}),
          mensuelles ou annuelles, incluant un quota de SMS. Au-delà du quota,
          les segments supplémentaires sont facturés au tarif de la formule,
          dans la limite d'un plafond fixé par le Client.
        </p>
        <p>
          Un essai gratuit de {SUBSCRIPTION.trial.days} jours est proposé. Une
          carte bancaire est demandée à l'inscription ; aucun débit n'a lieu
          pendant l'essai. À l'issue de l'essai, l'abonnement démarre
          automatiquement selon la formule choisie, sauf résiliation.
          L'abonnement est sans engagement, résiliable à tout moment depuis
          l'espace du Client ; il reste actif jusqu'à la fin de la période
          en cours. Les paiements sont opérés par Stripe.
        </p>
      </Section>

      <Section title="4. Obligations du Client">
        <p>Le Client s'engage à :</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            ne contacter que des personnes ayant valablement consenti à recevoir
            ses messages, conformément à la réglementation (RGPD, règles de
            prospection) ;
          </li>
          <li>
            respecter le droit d'opposition (désabonnement) et les horaires
            décents d'envoi ;
          </li>
          <li>
            n'utiliser le service que pour son activité légitime, sans contenu
            illicite ni détournement.
          </li>
        </ul>
        <p>
          Le Client est seul responsable des données qu'il importe et des
          messages qu'il diffuse.
        </p>
      </Section>

      <Section title="5. Données personnelles">
        <p>
          Le traitement des données est décrit dans la{" "}
          politique de confidentialité et l'accord de sous-traitance. Le Client
          agit comme responsable de traitement des données de sa clientèle ;{" "}
          {BRAND.name} agit en qualité de sous-traitant.
        </p>
      </Section>

      <Section title="6. Disponibilité et responsabilité">
        <p>
          {BRAND.name} met en œuvre les moyens raisonnables pour assurer la
          disponibilité du service, sans garantie d'absence d'interruption. La
          responsabilité de l'éditeur ne saurait être engagée pour les
          dommages indirects, ni au-delà des montants payés par le Client au
          titre des douze derniers mois.
        </p>
      </Section>

      <Section title="7. Résiliation">
        <p>
          Le Client peut résilier à tout moment depuis son espace. L'éditeur peut
          suspendre un compte en cas de manquement aux présentes conditions. À la
          fin du contrat, les données peuvent être exportées puis supprimées
          (voir la politique de confidentialité).
        </p>
      </Section>

      <Section title="8. Droit applicable">
        <p>
          Les présentes conditions sont régies par le droit français. Tout litige
          relève des tribunaux compétents, à défaut de résolution amiable.
          Contact : {LEGAL.contactEmail}.
        </p>
      </Section>
    </LegalPage>
  );
}
