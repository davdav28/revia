import { DEFAULT_TEMPLATES, type TemplateSeed } from "@/lib/templates";
import { DEFAULT_SERVICES } from "@/lib/default-services";

/**
 * Packs par métier (beauté & bien-être). Chaque métier fournit ses prestations
 * de départ et des variantes de modèles de messages adaptées à son vocabulaire.
 * Tout est éditable ensuite par le salon — ce ne sont que des points de départ.
 *
 * Les modèles reposent sur une base neutre (`DEFAULT_TEMPLATES`). Un métier ne
 * surcharge que les modèles où son vocabulaire change vraiment (`overrides`) ;
 * les autres restent neutres. Ton : chaleureux mais vendeur (urgence douce,
 * rareté, CTA en question).
 */
export type MetierId =
  | "onglerie"
  | "coiffure"
  | "barbier"
  | "esthetique"
  | "cils"
  | "autre";

export type MetierService = {
  name: string;
  priceCents: number;
  defaultIntervalDays: number | null;
};

/** Un override = juste le corps (SMS), ou { subject, body } pour un email. */
type TemplateOverride = string | { subject?: string | null; body: string };

type Metier = {
  id: MetierId;
  label: string;
  services: MetierService[];
  overrides: Record<string, TemplateOverride>;
};

export const METIERS: Metier[] = [
  {
    id: "onglerie",
    label: "Onglerie / manucure",
    services: DEFAULT_SERVICES,
    overrides: {
      cycle_sms_1:
        "{{prenom}}, vos ongles ont dû bien vivre depuis la dernière fois 💅 Je vous bloque un créneau remplissage cette semaine ? {{lien}} — {{salon}}",
      cycle_sms_2:
        "{{prenom}}, déjà {{semaines}} semaines depuis votre pose ✨ Un petit raccord et c'est reparti pour de belles mains. Je vous garde un créneau cette semaine ? {{lien}}",
      soft_sms_1:
        "{{prenom}}, vos ongles réclament un peu d'attention 💅 J'ai de belles dispos cette semaine chez {{salon}} — je vous en réserve une ? {{lien}}",
      soft_sms_2:
        "{{prenom}}, envie de retrouver des ongles impeccables ? 😊 Il me reste quelques créneaux cette semaine chez {{salon}}. Je vous en garde un ? {{lien}}",
      firstvisit_sms_1:
        "{{prenom}}, j'espère que votre première pose vous a plu 💕 Pour garder de belles mains, le remplissage se joue maintenant — je vous bloque le prochain rdv ? {{lien}}",
      birthday_sms_2:
        "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous des ongles parfaits pour l'occasion — je vous garde le meilleur créneau ? {{lien}} — {{salon}}",
      novelty_sms_1:
        "{{prenom}}, les nouvelles teintes de la saison viennent d'arriver chez {{salon}} 💅 Envie d'être la première à les porter ? Je vous réserve un créneau : {{lien}}",
      seasonal_sms_1:
        "{{prenom}}, les fêtes approchent 🎄 Les créneaux « ongles de fête » partent vite chez {{salon}} — je vous garde le vôtre ? {{lien}}",
      seasonal_sms_2:
        "{{prenom}}, bientôt l'été ☀️ Des ongles parfaits pour les sandales, ça vous tente ? Je vous réserve un créneau avant la ruée : {{lien}} — {{salon}}",
      winback_sms_1:
        "{{prenom}}, ça fait trop longtemps sans vos mains chez {{salon}} 💅 Pour votre retour cette semaine : {{offre}} rien que pour vous. Je réserve ? {{lien}}",
    },
  },
  {
    id: "coiffure",
    label: "Coiffure",
    services: [
      { name: "Coupe femme", priceCents: 3500, defaultIntervalDays: 42 },
      { name: "Coupe homme", priceCents: 2000, defaultIntervalDays: 28 },
      { name: "Couleur", priceCents: 5500, defaultIntervalDays: 35 },
      { name: "Balayage / mèches", priceCents: 8000, defaultIntervalDays: 70 },
      { name: "Brushing", priceCents: 2500, defaultIntervalDays: null },
    ],
    overrides: {
      cycle_sms_1:
        "{{prenom}}, votre coupe commence à perdre sa forme ✂️ Je vous bloque un créneau cette semaine chez {{salon}} ? {{lien}}",
      cycle_sms_2:
        "{{prenom}}, déjà {{semaines}} semaines ! Racines ou pointes réclament un petit coup de frais. Je vous garde un créneau cette semaine ? {{lien}}",
      soft_sms_1:
        "{{prenom}}, une envie de coupe fraîche ? 💇 J'ai de belles dispos cette semaine chez {{salon}} — je vous en réserve une ? {{lien}}",
      soft_sms_2:
        "{{prenom}}, ça fait un moment ! On rafraîchit votre coupe ou votre couleur ? Il me reste des créneaux cette semaine — je vous en garde un ? {{lien}} — {{salon}}",
      firstvisit_sms_1:
        "{{prenom}}, j'espère que votre première visite vous a plu 💕 Pour garder une coupe nette, on se refait ça dans quelques semaines — je vous bloque le prochain rdv ? {{lien}}",
      birthday_sms_2:
        "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous une belle coupe pour l'occasion — je vous garde le meilleur créneau ? {{lien}} — {{salon}}",
      novelty_sms_1:
        "{{prenom}}, nouvelle saison, nouvelle tête ? ✨ J'ai des idées coupe & couleur pour vous chez {{salon}}. Je vous réserve un créneau ? {{lien}}",
      seasonal_sms_1:
        "{{prenom}}, les fêtes approchent 🎄 Les créneaux coupe & couleur partent vite chez {{salon}} — je vous garde le vôtre ? {{lien}}",
      seasonal_sms_2:
        "{{prenom}}, bientôt l'été ☀️ Une coupe fraîche avant les vacances ? Je vous réserve un créneau avant la ruée : {{lien}} — {{salon}}",
      winback_sms_1:
        "{{prenom}}, ça fait trop longtemps ! Pour votre retour cette semaine chez {{salon}} : {{offre}} rien que pour vous. On bloque un créneau ? {{lien}}",
    },
  },
  {
    id: "barbier",
    label: "Barbier",
    services: [
      { name: "Coupe homme", priceCents: 2500, defaultIntervalDays: 21 },
      { name: "Taille de barbe", priceCents: 1500, defaultIntervalDays: 21 },
      { name: "Coupe + barbe", priceCents: 3500, defaultIntervalDays: 21 },
      { name: "Rasage traditionnel", priceCents: 3000, defaultIntervalDays: null },
      { name: "Contours / finitions", priceCents: 1000, defaultIntervalDays: 14 },
    ],
    overrides: {
      cycle_sms_1:
        "{{prenom}}, la coupe et la barbe commencent à pousser 💈 Je vous bloque un créneau cette semaine chez {{salon}} ? {{lien}}",
      cycle_sms_2:
        "{{prenom}}, déjà {{semaines}} semaines ✂️ Un petit rafraîchissement s'impose. Je vous garde un créneau cette semaine ? {{lien}}",
      soft_sms_1:
        "{{prenom}}, il est temps de remettre la coupe et la barbe au carré 💈 J'ai des dispos cette semaine chez {{salon}} — je vous en garde une ? {{lien}}",
      soft_sms_2:
        "{{prenom}}, ça fait un moment ! On vous remet au propre ? Il me reste quelques créneaux cette semaine — je vous en garde un ? {{lien}} — {{salon}}",
      firstvisit_sms_1:
        "{{prenom}}, content que votre premier passage chez {{salon}} vous ait plu 💈 Pour rester net, on se refait ça dans 3 semaines — je vous bloque le prochain ? {{lien}}",
      birthday_sms_2:
        "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous une coupe fraîche pour l'occasion — je vous garde une place ? {{lien}} — {{salon}}",
      novelty_sms_1:
        "{{prenom}}, nouveaux soins et finitions chez {{salon}} 💈 Envie de tester ? Je vous réserve un créneau ? {{lien}}",
      seasonal_sms_1:
        "{{prenom}}, les fêtes approchent 🎄 Les créneaux partent vite chez {{salon}} — je vous garde le vôtre pour être net le jour J ? {{lien}}",
      seasonal_sms_2:
        "{{prenom}}, bientôt l'été ☀️ Une coupe nette avant les vacances ? Je vous réserve un créneau avant la ruée : {{lien}} — {{salon}}",
      winback_sms_1:
        "{{prenom}}, ça fait trop longtemps ! Pour votre retour cette semaine chez {{salon}} : {{offre}} rien que pour vous. On bloque un créneau ? {{lien}}",
    },
  },
  {
    id: "esthetique",
    label: "Institut / esthétique",
    services: [
      { name: "Soin du visage", priceCents: 6000, defaultIntervalDays: 35 },
      { name: "Épilation demi-jambes", priceCents: 2500, defaultIntervalDays: 28 },
      { name: "Épilation maillot", priceCents: 2000, defaultIntervalDays: 28 },
      { name: "Beauté des mains", priceCents: 3000, defaultIntervalDays: 28 },
      { name: "Massage 30 min", priceCents: 4000, defaultIntervalDays: null },
    ],
    overrides: {
      cycle_sms_1:
        "{{prenom}}, il est temps de renouveler votre soin pour garder les résultats ✨ Je vous bloque un créneau cette semaine chez {{salon}} ? {{lien}}",
      cycle_sms_2:
        "{{prenom}}, déjà {{semaines}} semaines depuis votre dernier soin 🌸 On prolonge les effets ? Je vous garde un créneau cette semaine ? {{lien}}",
      soft_sms_1:
        "{{prenom}}, un vrai moment détente vous ferait du bien 🌸 J'ai de belles dispos cette semaine chez {{salon}} — je vous en réserve une ? {{lien}}",
      soft_sms_2:
        "{{prenom}}, envie de prendre soin de vous ? 😊 Il me reste quelques créneaux cette semaine chez {{salon}}. Je vous en garde un ? {{lien}}",
      firstvisit_sms_1:
        "{{prenom}}, j'espère que votre premier soin vous a fait du bien 💕 Pour de vrais résultats, on enchaîne dans 3-4 semaines — je vous bloque le prochain rdv ? {{lien}}",
      birthday_sms_2:
        "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous un vrai moment détente — je vous garde le meilleur créneau ? {{lien}} — {{salon}}",
      novelty_sms_1:
        "{{prenom}}, nouveaux soins à découvrir chez {{salon}} ✨ Envie d'être parmi les premières à tester ? Je vous réserve un créneau ? {{lien}}",
      seasonal_sms_1:
        "{{prenom}}, les fêtes approchent 🎄 Les créneaux partent vite chez {{salon}} — je vous garde le vôtre pour être au top ? {{lien}}",
      seasonal_sms_2:
        "{{prenom}}, bientôt l'été ☀️ On vous prépare pour les vacances ? Je vous réserve un soin avant la ruée : {{lien}} — {{salon}}",
      winback_sms_1:
        "{{prenom}}, ça fait trop longtemps ! Pour votre retour cette semaine chez {{salon}} : {{offre}} rien que pour vous. Je vous réserve un moment ? {{lien}}",
    },
  },
  {
    id: "cils",
    label: "Cils & sourcils",
    services: [
      { name: "Extensions de cils (pose)", priceCents: 8000, defaultIntervalDays: 28 },
      { name: "Remplissage cils", priceCents: 4500, defaultIntervalDays: 21 },
      { name: "Rehaussement de cils", priceCents: 5500, defaultIntervalDays: 42 },
      { name: "Teinture des sourcils", priceCents: 2000, defaultIntervalDays: 28 },
      { name: "Restructuration sourcils", priceCents: 2500, defaultIntervalDays: 28 },
    ],
    overrides: {
      cycle_sms_1:
        "{{prenom}}, vos cils arrivent en fin de tenue ✨ Un remplissage et votre regard est comme neuf. Je vous bloque un créneau cette semaine ? {{lien}} — {{salon}}",
      cycle_sms_2:
        "{{prenom}}, déjà {{semaines}} semaines depuis votre pose 👁️ Un petit raccord s'impose. Je vous garde un créneau cette semaine ? {{lien}}",
      soft_sms_1:
        "{{prenom}}, envie de retrouver un regard de biche ? 👁️ J'ai de belles dispos cette semaine chez {{salon}} — je vous en réserve une ? {{lien}}",
      soft_sms_2:
        "{{prenom}}, ça fait un moment ! On remet votre regard en valeur ? Il me reste quelques créneaux cette semaine — je vous en garde un ? {{lien}} — {{salon}}",
      firstvisit_sms_1:
        "{{prenom}}, j'espère que votre première pose vous a plu 💕 Pour garder un regard parfait, le remplissage se joue maintenant — je vous bloque le prochain rdv ? {{lien}}",
      birthday_sms_2:
        "{{prenom}}, c'est bientôt votre jour 🎂 Offrez-vous un regard de fête — je vous garde le meilleur créneau ? {{lien}} — {{salon}}",
      novelty_sms_1:
        "{{prenom}}, nouvelles techniques et volumes à découvrir chez {{salon}} ✨ Envie d'un regard neuf ? Je vous réserve un créneau ? {{lien}}",
      seasonal_sms_1:
        "{{prenom}}, les fêtes approchent 🎄 Les créneaux partent vite chez {{salon}} — je vous garde le vôtre pour un regard de fête ? {{lien}}",
      seasonal_sms_2:
        "{{prenom}}, bientôt l'été ☀️ Un regard parfait sans mascara pour les vacances ? Je vous réserve un créneau avant la ruée : {{lien}} — {{salon}}",
      winback_sms_1:
        "{{prenom}}, ça fait trop longtemps sans votre regard sublimé 👁️ Pour votre retour cette semaine : {{offre}} rien que pour vous. Je réserve ? {{lien}} — {{salon}}",
    },
  },
  {
    id: "autre",
    label: "Autre (beauté & bien-être)",
    services: [
      { name: "Prestation signature", priceCents: 6000, defaultIntervalDays: 35 },
      { name: "Séance découverte", priceCents: 4000, defaultIntervalDays: 28 },
      { name: "Forfait bien-être", priceCents: 9000, defaultIntervalDays: 42 },
      { name: "Retouche / séance courte", priceCents: 3000, defaultIntervalDays: 21 },
    ],
    // Aucun override : la base neutre convient (spa, massage, tatouage…).
    overrides: {},
  },
];

const METIER_BY_ID = new Map(METIERS.map((m) => [m.id, m]));

/** Métier valide, ou « autre » par défaut. */
export function normalizeMetier(value: string | null | undefined): MetierId {
  return value && METIER_BY_ID.has(value as MetierId)
    ? (value as MetierId)
    : "autre";
}

/** Prestations de départ pour un métier. */
export function servicesForMetier(metier: string | null | undefined): MetierService[] {
  return METIER_BY_ID.get(normalizeMetier(metier))!.services;
}

/** Modèles de départ pour un métier : base neutre + overrides du métier. */
export function templatesForMetier(metier: string | null | undefined): TemplateSeed[] {
  const overrides = METIER_BY_ID.get(normalizeMetier(metier))!.overrides;
  return DEFAULT_TEMPLATES.map((t) => {
    const o = overrides[t.key];
    if (!o) return t;
    const ov = typeof o === "string" ? { body: o, subject: undefined } : o;
    return {
      ...t,
      body: ov.body,
      subject: ov.subject !== undefined ? ov.subject : t.subject,
    };
  });
}

/** Options pour le sélecteur de métier (inscription). */
export const METIER_OPTIONS = METIERS.map((m) => ({ id: m.id, label: m.label }));
