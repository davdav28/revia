import type { MessageChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Libellés lisibles des scénarios (groupes de variantes). */
export const SCENARIO_LABEL: Record<string, string> = {
  cycle: "Rappel de cycle",
  soft: "Dormante douce",
  long: "Dormante longue",
  firstvisit: "Après 1re visite",
  birthday: "Anniversaire",
  novelty: "Nouveauté",
  slot: "Créneau libéré",
  seasonal: "Saisonnier",
  winback: "Win-back",
};

// Envois minimum sur une variante pour la juger fiable.
const MIN_SENDS_FOR_LEADER = 5;

export type VariantStat = {
  id: string;
  name: string;
  isActive: boolean;
  sent: number;
  recovered: number;
  revenueCents: number;
  /** Taux de réactivation (réactivées / envoyés), null si aucun envoi. */
  rate: number | null;
  isLeader: boolean;
};

export type AbGroup = {
  key: string;
  scenario: string;
  channel: MessageChannel;
  label: string;
  variants: VariantStat[];
  totalSent: number;
  /** Vrai si au moins 2 variantes ont assez d'envois pour être départagées. */
  decided: boolean;
};

/**
 * Calcule les performances A/B des modèles d'un salon, groupées par
 * scénario + canal (les variantes qui tournent ensemble). Source : les
 * `Message` portant un `templateId`, et leurs `Recovery` éventuelles.
 */
export async function getAbGroups(salonId: string): Promise<AbGroup[]> {
  const templates = await prisma.messageTemplate.findMany({
    where: { salonId, scenario: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, channel: true, scenario: true, isActive: true },
  });
  if (templates.length === 0) return [];

  const ids = templates.map((t) => t.id);

  // Envois aboutis par modèle.
  const sentRows = await prisma.message.groupBy({
    by: ["templateId"],
    where: {
      salonId,
      templateId: { in: ids },
      status: { in: ["sent", "delivered"] },
    },
    _count: true,
  });
  const sentByTpl = new Map(
    sentRows.map((r) => [r.templateId as string, r._count]),
  );

  // Réactivations attribuées (message ayant produit une Recovery).
  const recRows = await prisma.message.findMany({
    where: { salonId, templateId: { in: ids }, recovery: { isNot: null } },
    select: { templateId: true, recovery: { select: { recoveredAmountCents: true } } },
  });
  const recByTpl = new Map<string, { count: number; revenue: number }>();
  for (const r of recRows) {
    if (!r.templateId) continue;
    const acc = recByTpl.get(r.templateId) ?? { count: 0, revenue: 0 };
    acc.count += 1;
    acc.revenue += r.recovery?.recoveredAmountCents ?? 0;
    recByTpl.set(r.templateId, acc);
  }

  // Regroupe par scénario + canal.
  const groups = new Map<string, AbGroup>();
  for (const t of templates) {
    const scenario = t.scenario as string;
    const key = `${scenario}|${t.channel}`;
    const sent = sentByTpl.get(t.id) ?? 0;
    const rec = recByTpl.get(t.id) ?? { count: 0, revenue: 0 };
    const variant: VariantStat = {
      id: t.id,
      name: t.name,
      isActive: t.isActive,
      sent,
      recovered: rec.count,
      revenueCents: rec.revenue,
      rate: sent > 0 ? rec.count / sent : null,
      isLeader: false,
    };
    const g =
      groups.get(key) ??
      ({
        key,
        scenario,
        channel: t.channel,
        label: SCENARIO_LABEL[scenario] ?? scenario,
        variants: [],
        totalSent: 0,
        decided: false,
      } as AbGroup);
    g.variants.push(variant);
    g.totalSent += sent;
    groups.set(key, g);
  }

  // Désigne la variante en tête dans chaque groupe (si départageable).
  for (const g of groups.values()) {
    const eligible = g.variants.filter(
      (v) => v.sent >= MIN_SENDS_FOR_LEADER && v.rate !== null,
    );
    if (eligible.length >= 2) {
      g.decided = true;
      const best = eligible.reduce((a, b) => {
        if ((b.rate ?? 0) !== (a.rate ?? 0))
          return (b.rate ?? 0) > (a.rate ?? 0) ? b : a;
        return b.revenueCents > a.revenueCents ? b : a;
      });
      if ((best.rate ?? 0) > 0) best.isLeader = true;
    }
    // Variantes triées : meilleure performance d'abord.
    g.variants.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || b.sent - a.sent);
  }

  // Groupes triés : ceux avec de l'activité d'abord.
  return [...groups.values()].sort((a, b) => b.totalSent - a.totalSent);
}
