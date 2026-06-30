import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { LEGAL } from "@/config/legal";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <Section title="Éditeur du site">
        <p>
          Le service {BRAND.name}, accessible à l'adresse {LEGAL.websiteLabel},
          est édité par :
        </p>
        <p>
          {LEGAL.companyName}
          <br />
          {LEGAL.legalForm}
          {LEGAL.capital ? ` au capital de ${LEGAL.capital}` : ""}
          <br />
          Siège : {LEGAL.address}
          <br />
          {LEGAL.siret}
          <br />
          {LEGAL.vat
            ? `TVA intracommunautaire : ${LEGAL.vat}`
            : "TVA non applicable, art. 293 B du CGI"}
          <br />
          Contact : {LEGAL.contactEmail}
        </p>
      </Section>

      <Section title="Responsable de la publication">
        <p>{LEGAL.director}</p>
      </Section>

      <Section title="Hébergement">
        <p>
          L'application est hébergée par {LEGAL.host.name}, {LEGAL.host.address}.{" "}
          {LEGAL.host.note}
        </p>
        <p>
          La base de données et l'authentification sont opérées par Supabase
          (Union européenne).
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          La marque {BRAND.name}, le logo, l'interface et le code du service sont
          la propriété de l'éditeur. Toute reproduction non autorisée est
          interdite.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question : {LEGAL.contactEmail}. Voir aussi nos{" "}
          conditions d'utilisation et notre politique de confidentialité.
        </p>
      </Section>
    </LegalPage>
  );
}
