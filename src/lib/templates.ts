import type { CampaignTrigger, MessageChannel } from "@prisma/client";

/**
 * Remplace les variables d'un modèle.
 * {{prenom}} {{salon}} {{lien}} {{offre}} {{jour}} {{semaines}} {{derniere_presta}}
 */
export function renderTemplate(
  body: string,
  vars: {
    prenom?: string;
    salon?: string;
    lien?: string;
    offre?: string;
    jour?: string;
    semaines?: string | number;
    derniere_presta?: string;
  },
): string {
  const repl: Record<string, string> = {
    prenom: vars.prenom ?? "",
    salon: vars.salon ?? "",
    lien: vars.lien ?? "",
    offre: vars.offre ?? "",
    jour: vars.jour ?? "",
    semaines: vars.semaines != null ? String(vars.semaines) : "",
    derniere_presta: vars.derniere_presta ?? "",
  };
  return body
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k: string) => repl[k] ?? "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Scénarios de la bibliothèque (cf. modeles-reactivation-manucure.md).
 *  - `trigger` non nul = traité automatiquement par le scan quotidien.
 *  - `trigger` nul = modèle disponible pour un envoi manuel (nouveauté,
 *    créneau libéré, saisonnier, win-back) — conforme à « pas de remise par défaut ».
 *  - `scenario` pilote la sélection (at-risk → cycle, dormante courte → soft,
 *    longue → long) et la rotation entre variantes.
 */
export type TemplateSeed = {
  key: string;
  name: string;
  channel: MessageChannel;
  trigger: CampaignTrigger | null;
  scenario: string;
  subject: string | null;
  body: string;
};

export const DEFAULT_TEMPLATES: TemplateSeed[] = [
  // A — Rappel de cycle (à surveiller, J+21 à J+28)
  {
    key: "cycle_sms_1",
    name: "Rappel de cycle — variante 1",
    channel: "sms",
    trigger: "dormancy",
    scenario: "cycle",
    subject: null,
    body: "{{prenom}}, il est bientôt temps de reprendre rendez-vous ✨ Je vous garde un créneau cette semaine ? {{lien}} — {{salon}}",
  },
  {
    key: "cycle_sms_2",
    name: "Rappel de cycle — variante 2",
    channel: "sms",
    trigger: "dormancy",
    scenario: "cycle",
    subject: null,
    body: "{{prenom}}, déjà {{semaines}} semaines depuis votre dernière visite 😊 On vous trouve un moment pour un nouveau rendez-vous ? {{lien}}",
  },
  // B — Dormante douce (4 à 6 semaines, sans offre)
  {
    key: "soft_sms_1",
    name: "Dormante douce — variante 1",
    channel: "sms",
    trigger: "dormancy",
    scenario: "soft",
    subject: null,
    body: "{{prenom}}, ça fait un moment qu'on ne vous a pas vue chez {{salon}} ! On serait ravies de vous retrouver. Votre créneau en 1 clic : {{lien}}",
  },
  {
    key: "soft_sms_2",
    name: "Dormante douce — variante 2",
    channel: "sms",
    trigger: "dormancy",
    scenario: "soft",
    subject: null,
    body: "{{prenom}}, vous nous manquez chez {{salon}} 😊 Si l'envie de repasser vous prend, on vous garde une place avec plaisir : {{lien}}",
  },
  // E — Dormante longue (8 semaines et +)
  {
    key: "long_sms_1",
    name: "Dormante longue — variante 1",
    channel: "sms",
    trigger: "dormancy",
    scenario: "long",
    subject: null,
    body: "{{prenom}}, ça fait un moment ! On ne voudrait pas vous oublier 😊 Si vous repassez ce mois-ci chez {{salon}}, on vous réserve une petite attention. {{lien}}",
  },
  {
    key: "long_sms_2",
    name: "Dormante longue — variante 2",
    channel: "sms",
    trigger: "dormancy",
    scenario: "long",
    subject: null,
    body: "{{prenom}}, la porte de {{salon}} vous est toujours grande ouverte. Quand vous voulez, on est là : {{lien}}",
  },
  // G — Post-première-visite (J+15)
  {
    key: "firstvisit_sms_1",
    name: "Après 1re visite — variante 1",
    channel: "sms",
    trigger: "post_first_visit",
    scenario: "firstvisit",
    subject: null,
    body: "{{prenom}}, j'espère que votre première visite chez {{salon}} vous a plu 💕 C'est le bon moment pour reprendre rendez-vous. {{lien}}",
  },
  {
    key: "firstvisit_sms_2",
    name: "Après 1re visite — variante 2",
    channel: "sms",
    trigger: "post_first_visit",
    scenario: "firstvisit",
    subject: null,
    body: "{{prenom}}, ça nous a fait plaisir de vous accueillir ! On serait ravies de devenir VOTRE salon. À très vite ? {{lien}} — {{salon}}",
  },
  // F — Anniversaire
  {
    key: "birthday_sms_1",
    name: "Anniversaire — variante 1",
    channel: "sms",
    trigger: "birthday",
    scenario: "birthday",
    subject: null,
    body: "Joyeux anniversaire {{prenom}} 🎉 Chez {{salon}}, on aimerait le fêter avec vous : une attention vous attend sur votre prochaine pose. {{lien}}",
  },
  {
    key: "birthday_sms_2",
    name: "Anniversaire — variante 2",
    channel: "sms",
    trigger: "birthday",
    scenario: "birthday",
    subject: null,
    body: "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous un moment rien que pour vous, on s'occupe du reste. {{lien}} — {{salon}}",
  },
  // J — Emails (format long)
  {
    key: "soft_email_1",
    name: "Dormante douce — email",
    channel: "email",
    trigger: "dormancy",
    scenario: "soft",
    subject: "{{prenom}}, vous nous manquez 💫",
    body: "Bonjour {{prenom}},\n\nÇa fait {{semaines}} semaines qu'on ne vous a pas vu(e) chez {{salon}}, et on s'est dit qu'un petit mot s'imposait.\n\nPas de grand discours : juste l'envie de vous retrouver et de prendre soin de vous comme la dernière fois.\n\nQuand vous voulez, votre créneau vous attend — il suffit d'un clic.\n\nÀ très vite,\nL'équipe {{salon}}",
  },
  {
    key: "long_email_1",
    name: "Dormante longue — email",
    channel: "email",
    trigger: "dormancy",
    scenario: "long",
    subject: "{{prenom}}, la porte vous reste grande ouverte",
    body: "Bonjour {{prenom}},\n\nCela fait un moment qu'on ne vous a pas accueilli(e) chez {{salon}}. On ne voulait pas vous oublier.\n\nSi l'envie de repasser vous prend, on serait vraiment ravis de vous revoir et de vous chouchouter.\n\nVotre créneau vous attend, en un clic.\n\nÀ bientôt peut-être,\nL'équipe {{salon}}",
  },
  // C — Une raison de revenir / nouveauté (envoi manuel)
  {
    key: "novelty_sms_1",
    name: "Nouveauté de saison — variante 1",
    channel: "sms",
    trigger: null,
    scenario: "novelty",
    subject: null,
    body: "{{prenom}}, on a des nouveautés à vous faire découvrir chez {{salon}} ✨ Envie d'en profiter ? Votre créneau vous attend : {{lien}}",
  },
  {
    key: "novelty_sms_2",
    name: "Nouveauté — variante 2 (prestation)",
    channel: "sms",
    trigger: null,
    scenario: "novelty",
    subject: null,
    body: "{{prenom}}, nouveau chez {{salon}} : {{derniere_presta}}. Ça vous tente pour un prochain rendez-vous ? {{lien}}",
  },
  {
    key: "novelty_email_1",
    name: "Nouveauté de saison — email",
    channel: "email",
    trigger: null,
    scenario: "novelty",
    subject: "{{prenom}}, on a des nouveautés pour vous ✨",
    body: "Bonjour {{prenom}},\n\nOn a quelques nouveautés à vous faire découvrir chez {{salon}} — et franchement, on pense qu'elles vous plairont.\n\nEnvie de vous faire plaisir et de tester quelque chose de nouveau à votre prochain rendez-vous ?\n\nOn a hâte de vous revoir,\nL'équipe {{salon}}",
  },
  // D — Créneau qui se libère (envoi manuel, heures creuses)
  {
    key: "slot_sms_1",
    name: "Créneau libéré — variante 1",
    channel: "sms",
    trigger: null,
    scenario: "slot",
    subject: null,
    body: "{{prenom}}, une place vient de se libérer ce {{jour}} chez {{salon}}. Elle est pour vous si ça vous tente : {{lien}}",
  },
  {
    key: "slot_sms_2",
    name: "Créneau libéré — variante 2",
    channel: "sms",
    trigger: null,
    scenario: "slot",
    subject: null,
    body: "{{prenom}}, annulation de dernière minute = un créneau dispo {{jour}} après-midi. Je vous le réserve ? {{lien}} — {{salon}}",
  },
  // H — Saisonnier / événementiel (envoi manuel)
  {
    key: "seasonal_sms_1",
    name: "Saisonnier — fêtes",
    channel: "sms",
    trigger: null,
    scenario: "seasonal",
    subject: null,
    body: "{{prenom}}, les fêtes approchent 🎄 Réservez votre rendez-vous chez {{salon}} avant que l'agenda se remplisse : {{lien}}",
  },
  {
    key: "seasonal_sms_2",
    name: "Saisonnier — été",
    channel: "sms",
    trigger: null,
    scenario: "seasonal",
    subject: null,
    body: "{{prenom}}, bientôt l'été ☀️ On vous prépare un moment beauté avant les vacances ? Votre créneau : {{lien}} — {{salon}}",
  },
  // I — Win-back avec offre (à utiliser RAREMENT)
  {
    key: "winback_sms_1",
    name: "Win-back avec offre — rare",
    channel: "sms",
    trigger: null,
    scenario: "winback",
    subject: null,
    body: "{{prenom}}, parce que ça fait trop longtemps : {{offre}} sur votre retour chez {{salon}} cette semaine 💅 Votre créneau : {{lien}}",
  },
];

export type CampaignSeed = {
  name: string;
  trigger: CampaignTrigger;
  channel: MessageChannel;
  templateKey: string; // modèle « primaire » (le scan choisit dynamiquement)
  isActive: boolean;
};

export const DEFAULT_CAMPAIGNS: CampaignSeed[] = [
  {
    name: "Relance des dormantes",
    trigger: "dormancy",
    channel: "sms",
    templateKey: "soft_sms_1",
    isActive: false,
  },
  {
    name: "Bienvenue après 1re visite",
    trigger: "post_first_visit",
    channel: "sms",
    templateKey: "firstvisit_sms_1",
    isActive: false,
  },
  {
    name: "Anniversaire",
    trigger: "birthday",
    channel: "sms",
    templateKey: "birthday_sms_1",
    isActive: false,
  },
];

/** Scénario à utiliser selon le déclencheur et la situation de la cliente. */
export function scenarioFor(
  trigger: CampaignTrigger,
  opts: { status: string; weeksSinceVisit: number | null },
): string | null {
  if (trigger === "dormancy") {
    if (opts.status === "at_risk") return "cycle";
    if ((opts.weeksSinceVisit ?? 0) >= 8) return "long";
    return "soft";
  }
  if (trigger === "post_first_visit") return "firstvisit";
  if (trigger === "birthday") return "birthday";
  return null; // slow_slot : envoi manuel
}
