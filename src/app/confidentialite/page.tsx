import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { LEGAL } from "@/config/legal";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro={`Cette politique explique comment ${BRAND.name} traite les données personnelles. Deux situations sont distinguées : les données des utilisateurs du service (les salons), et les données des clientes de ces salons.`}
    >
      <Section title="Rôles : responsable de traitement et sous-traitant">
        <p>
          Pour les données des <strong className="text-ink">salons</strong>{" "}
          (compte, facturation), {BRAND.name} est responsable de traitement.
        </p>
        <p>
          Pour les données des <strong className="text-ink">clientes</strong> des
          salons (importées et gérées par le salon), le salon est responsable de
          traitement et {BRAND.name} agit comme sous-traitant, selon l'accord de
          sous-traitance.
        </p>
      </Section>

      <Section title="Données collectées">
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong className="text-ink">Salon</strong> : nom, email, mot de
            passe (chiffré), coordonnées du salon, données de facturation.
          </li>
          <li>
            <strong className="text-ink">Clientes du salon</strong> : identité et
            coordonnées (téléphone, email), date de naissance facultative,
            historique de visites et de dépenses, consentements, statut de
            réactivation.
          </li>
          <li>
            <strong className="text-ink">Techniques</strong> : journaux de
            connexion et données strictement nécessaires au fonctionnement.
          </li>
        </ul>
      </Section>

      <Section title="Finalités et bases légales">
        <ul className="list-inside list-disc space-y-1">
          <li>
            Fournir le service (gestion des clientes, relances, réservation,
            tableau de bord) — exécution du contrat ;
          </li>
          <li>
            Envoyer des messages de réactivation aux clientes — consentement
            recueilli par le salon, ou intérêt légitime pour une clientèle
            existante, avec droit d'opposition à chaque message ;
          </li>
          <li>Facturer l'abonnement — exécution du contrat / obligation légale ;</li>
          <li>Assurer la sécurité — intérêt légitime.</li>
        </ul>
      </Section>

      <Section title="Destinataires et sous-traitants">
        <p>
          Les données ne sont jamais vendues. Elles sont accessibles à l'éditeur
          et aux prestataires techniques strictement nécessaires :
        </p>
        <ul className="list-inside list-disc space-y-1">
          {LEGAL.subprocessors.map((s) => (
            <li key={s.name}>
              <strong className="text-ink">{s.name}</strong> — {s.purpose} (
              {s.location}).
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Durées de conservation">
        <ul className="list-inside list-disc space-y-1">
          <li>
            Données d'un compte salon : pendant la durée de l'abonnement, puis
            supprimées (ou anonymisées) sous un délai raisonnable après
            résiliation.
          </li>
          <li>
            Données des clientes : tant que le salon les conserve dans son
            espace ; supprimées sur demande du salon ou à la clôture du compte.
          </li>
          <li>
            Données de facturation : conservées selon les obligations légales
            (comptables et fiscales).
          </li>
        </ul>
      </Section>

      <Section title="Vos droits">
        <p>
          Toute personne dispose des droits d'accès, de rectification,
          d'effacement, de limitation, de portabilité et d'opposition. Chaque
          message permet le désabonnement ; les données sont exportables et
          supprimables depuis l'application.
        </p>
        <p>
          Une cliente d'un salon exerce ses droits auprès de ce salon
          (responsable de traitement) ; {BRAND.name} l'y assiste. Pour toute
          demande relative au service : {LEGAL.contactEmail}. Un recours est
          possible auprès de la CNIL.
        </p>
      </Section>

      <Section title="Sécurité">
        <p>
          Les données sont hébergées dans l'Union européenne, les accès sont
          authentifiés et cloisonnés par salon, les mots de passe et secrets sont
          chiffrés. Les transferts hors UE éventuels (certains sous-traitants)
          sont encadrés par des clauses contractuelles types.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question sur cette politique : {LEGAL.contactEmail}.
        </p>
      </Section>
    </LegalPage>
  );
}
