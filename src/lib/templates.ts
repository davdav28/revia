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
 * Scénarios de la bibliothèque.
 *  - `trigger` non nul = traité automatiquement par le scan quotidien.
 *  - `trigger` nul = modèle disponible pour un envoi manuel (nouveauté,
 *    créneau libéré, saisonnier, win-back) — conforme à « pas de remise par défaut ».
 *  - `scenario` pilote la sélection (at-risk → cycle, dormante courte → soft,
 *    longue → long) et la rotation entre variantes.
 *
 * Ton : chaleureux mais vendeur — une seule action, un peu d'urgence/rareté,
 * un CTA formulé en question. Base neutre (tous métiers) ; les variantes
 * spécifiques vivent dans `metiers.ts` (overrides par métier).
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
    body: "{{prenom}}, il est temps de reprendre rendez-vous avant que l'agenda ne se remplisse ✨ Je vous bloque un créneau cette semaine ? {{lien}} — {{salon}}",
  },
  {
    key: "cycle_sms_2",
    name: "Rappel de cycle — variante 2",
    channel: "sms",
    trigger: "dormancy",
    scenario: "cycle",
    subject: null,
    body: "{{prenom}}, déjà {{semaines}} semaines ! C'est le moment idéal pour repasser. Il me reste quelques créneaux cette semaine — je vous en garde un ? {{lien}}",
  },
  // B — Dormante douce (4 à 6 semaines, sans offre)
  {
    key: "soft_sms_1",
    name: "Dormante douce — variante 1",
    channel: "sms",
    trigger: "dormancy",
    scenario: "soft",
    subject: null,
    body: "{{prenom}}, ça fait un moment qu'on ne vous a pas vu(e) chez {{salon}} ! J'aimerais vous retrouver — je vous réserve un créneau cette semaine ? {{lien}}",
  },
  {
    key: "soft_sms_2",
    name: "Dormante douce — variante 2",
    channel: "sms",
    trigger: "dormancy",
    scenario: "soft",
    subject: null,
    body: "{{prenom}}, on ne va pas se perdre de vue 😊 J'ai encore de belles disponibilités cette semaine chez {{salon}}. Je vous en garde une ? {{lien}}",
  },
  // E — Dormante longue (8 semaines et +)
  {
    key: "long_sms_1",
    name: "Dormante longue — variante 1",
    channel: "sms",
    trigger: "dormancy",
    scenario: "long",
    subject: null,
    body: "{{prenom}}, ça fait trop longtemps ! Pour vous donner une bonne raison de repasser ce mois-ci chez {{salon}}, je vous réserve une petite attention. On se voit quand ? {{lien}}",
  },
  {
    key: "long_sms_2",
    name: "Dormante longue — variante 2",
    channel: "sms",
    trigger: "dormancy",
    scenario: "long",
    subject: null,
    body: "{{prenom}}, la porte de {{salon}} vous est grande ouverte — et j'ai hâte de vous revoir. Je vous trouve un créneau cette semaine ? {{lien}}",
  },
  // G — Post-première-visite (J+15)
  {
    key: "firstvisit_sms_1",
    name: "Après 1re visite — variante 1",
    channel: "sms",
    trigger: "post_first_visit",
    scenario: "firstvisit",
    subject: null,
    body: "{{prenom}}, merci pour votre première visite chez {{salon}} 💕 C'est en revenant maintenant qu'on garde le meilleur résultat — je vous bloque le prochain rdv ? {{lien}}",
  },
  {
    key: "firstvisit_sms_2",
    name: "Après 1re visite — variante 2",
    channel: "sms",
    trigger: "post_first_visit",
    scenario: "firstvisit",
    subject: null,
    body: "{{prenom}}, ça m'a fait plaisir de vous accueillir ! J'adorerais devenir VOTRE adresse. On se refait ça bientôt ? Je vous garde une place : {{lien}} — {{salon}}",
  },
  // F — Anniversaire
  {
    key: "birthday_sms_1",
    name: "Anniversaire — variante 1",
    channel: "sms",
    trigger: "birthday",
    scenario: "birthday",
    subject: null,
    body: "Joyeux anniversaire {{prenom}} 🎉 Pour fêter ça, {{salon}} vous gâte à votre prochain rdv. Je vous réserve le meilleur créneau ? {{lien}}",
  },
  {
    key: "birthday_sms_2",
    name: "Anniversaire — variante 2",
    channel: "sms",
    trigger: "birthday",
    scenario: "birthday",
    subject: null,
    body: "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous un moment rien que pour vous — je vous garde une place de choix cette semaine ? {{lien}} — {{salon}}",
  },
  // J — Emails (format long)
  {
    key: "soft_email_1",
    name: "Dormante douce — email",
    channel: "email",
    trigger: "dormancy",
    scenario: "soft",
    subject: "{{prenom}}, on vous garde une place cette semaine ✨",
    body: "Bonjour {{prenom}},\n\nÇa fait {{semaines}} semaines qu'on ne vous a pas vu(e) chez {{salon}} — et honnêtement, vous nous manquez.\n\nJ'ai encore de belles disponibilités cette semaine, et j'aimerais vraiment vous retrouver. Réserver votre créneau ne prend qu'un clic.\n\nJe vous garde une place ?\n\nÀ très vite,\nL'équipe {{salon}}",
  },
  {
    key: "long_email_1",
    name: "Dormante longue — email",
    channel: "email",
    trigger: "dormancy",
    scenario: "long",
    subject: "{{prenom}}, une attention vous attend chez {{salon}}",
    body: "Bonjour {{prenom}},\n\nCela fait un moment qu'on ne vous a pas accueilli(e) chez {{salon}}, et on ne voulait pas vous laisser filer.\n\nPour vous donner une bonne raison de repasser ce mois-ci, on vous réserve une petite attention à votre prochain rendez-vous.\n\nVotre créneau vous attend, en un clic.\n\nOn a hâte de vous revoir,\nL'équipe {{salon}}",
  },
  // C — Une raison de revenir / nouveauté (envoi manuel)
  {
    key: "novelty_sms_1",
    name: "Nouveauté de saison — variante 1",
    channel: "sms",
    trigger: null,
    scenario: "novelty",
    subject: null,
    body: "{{prenom}}, du nouveau chez {{salon}} et j'ai pensé à vous ✨ Envie d'être parmi les premiers à tester ? Je vous réserve un créneau : {{lien}}",
  },
  {
    key: "novelty_sms_2",
    name: "Nouveauté — variante 2 (prestation)",
    channel: "sms",
    trigger: null,
    scenario: "novelty",
    subject: null,
    body: "{{prenom}}, nouveau chez {{salon}} : {{derniere_presta}}. Ça vous tente ? Je vous garde une place avant que ça parte : {{lien}}",
  },
  {
    key: "novelty_email_1",
    name: "Nouveauté de saison — email",
    channel: "email",
    trigger: null,
    scenario: "novelty",
    subject: "{{prenom}}, en avant-première chez {{salon}} ✨",
    body: "Bonjour {{prenom}},\n\nOn vient de rentrer des nouveautés chez {{salon}} — et on a tout de suite pensé que ça vous plairait.\n\nEnvie d'être parmi les premiers à en profiter ? Les meilleurs créneaux partent vite, alors je préfère vous prévenir.\n\nJe vous réserve un moment ?\n\nÀ très vite,\nL'équipe {{salon}}",
  },
  // D — Créneau qui se libère (envoi manuel, heures creuses)
  {
    key: "slot_sms_1",
    name: "Créneau libéré — variante 1",
    channel: "sms",
    trigger: null,
    scenario: "slot",
    subject: null,
    body: "{{prenom}}, une place vient de se libérer ce {{jour}} chez {{salon}} — c'est rare ! Je vous la réserve ? {{lien}}",
  },
  {
    key: "slot_sms_2",
    name: "Créneau libéré — variante 2",
    channel: "sms",
    trigger: null,
    scenario: "slot",
    subject: null,
    body: "{{prenom}}, annulation de dernière minute = un créneau libre {{jour}}. Le premier qui répond le prend 😉 Je vous le garde ? {{lien}} — {{salon}}",
  },
  // H — Saisonnier / événementiel (envoi manuel)
  {
    key: "seasonal_sms_1",
    name: "Saisonnier — fêtes",
    channel: "sms",
    trigger: null,
    scenario: "seasonal",
    subject: null,
    body: "{{prenom}}, les fêtes approchent 🎄 Les créneaux partent vite chez {{salon}} — je vous réserve le vôtre avant que tout soit pris ? {{lien}}",
  },
  {
    key: "seasonal_sms_2",
    name: "Saisonnier — été",
    channel: "sms",
    trigger: null,
    scenario: "seasonal",
    subject: null,
    body: "{{prenom}}, l'été arrive ☀️ On vous prépare pour les vacances ? Je vous garde un créneau avant la ruée : {{lien}} — {{salon}}",
  },
  // I — Win-back avec offre (à utiliser RAREMENT)
  {
    key: "winback_sms_1",
    name: "Win-back avec offre — rare",
    channel: "sms",
    trigger: null,
    scenario: "winback",
    subject: null,
    body: "{{prenom}}, ça fait vraiment trop longtemps ! Pour vous revoir cette semaine chez {{salon}} : {{offre}} rien que pour vous. Je vous réserve un créneau ? {{lien}}",
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

/** Scénario à utiliser selon le déclencheur et la situation du client. */
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
