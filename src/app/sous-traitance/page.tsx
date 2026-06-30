import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { LEGAL } from "@/config/legal";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Accord de sous-traitance (RGPD)" };

export default function SousTraitancePage() {
  return (
    <LegalPage
      title="Accord de sous-traitance (RGPD)"
      intro={`Cet accord (art. 28 du RGPD) encadre le traitement, par ${BRAND.name} (le sous-traitant), des données personnelles pour le compte du salon (le responsable de traitement). Il s'applique dès la création d'un compte.`}
    >
      <Section title="1. Objet et durée">
        <p>
          {BRAND.name} traite les données de la clientèle du salon uniquement
          pour fournir le service (détection des clientes inactives, envoi de
          relances, réservation, statistiques), sur instruction du salon, pendant
          toute la durée du contrat.
        </p>
      </Section>

      <Section title="2. Données et personnes concernées">
        <p>
          Catégories de données : identité et coordonnées des clientes,
          historique de visites et de dépenses, consentements, date de naissance
          facultative. Personnes concernées : les clientes du salon.
        </p>
      </Section>

      <Section title="3. Instructions">
        <p>
          {BRAND.name} ne traite les données que sur instruction documentée du
          salon (l'utilisation du service valant instruction), sans les utiliser
          à d'autres fins ni les vendre.
        </p>
      </Section>

      <Section title="4. Confidentialité et sécurité">
        <p>
          Les personnes autorisées à traiter les données sont tenues à la
          confidentialité. {BRAND.name} met en œuvre des mesures techniques et
          organisationnelles appropriées : hébergement dans l'Union européenne,
          cloisonnement des données par salon, contrôle des accès, chiffrement
          des secrets et des mots de passe.
        </p>
      </Section>

      <Section title="5. Sous-traitants ultérieurs">
        <p>
          Le salon autorise {BRAND.name} à recourir aux sous-traitants suivants,
          présentant des garanties suffisantes :
        </p>
        <ul className="list-inside list-disc space-y-1">
          {LEGAL.subprocessors.map((s) => (
            <li key={s.name}>
              <strong className="text-ink">{s.name}</strong> — {s.purpose} (
              {s.location}).
            </li>
          ))}
        </ul>
        <p>
          Tout changement est porté à la connaissance du salon, qui peut s'y
          opposer pour un motif légitime.
        </p>
      </Section>

      <Section title="6. Assistance et droits des personnes">
        <p>
          {BRAND.name} aide le salon à répondre aux demandes des clientes (accès,
          rectification, effacement, opposition, portabilité) grâce aux fonctions
          d'export, de suppression et de désabonnement intégrées.
        </p>
      </Section>

      <Section title="7. Violation de données">
        <p>
          En cas de violation de données, {BRAND.name} en informe le salon dans
          les meilleurs délais et lui fournit les éléments utiles pour, le cas
          échéant, notifier la CNIL et les personnes concernées.
        </p>
      </Section>

      <Section title="8. Fin du contrat">
        <p>
          À la fin du contrat, le salon peut exporter ses données ; celles-ci
          sont ensuite supprimées (sauf obligation légale de conservation).
        </p>
      </Section>

      <Section title="9. Audit">
        <p>
          {BRAND.name} met à disposition les informations nécessaires pour
          démontrer le respect de ses obligations et permet, dans des conditions
          raisonnables, des audits. Contact : {LEGAL.contactEmail}.
        </p>
      </Section>
    </LegalPage>
  );
}
