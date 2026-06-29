/**
 * Statuts d'une cliente dans la boucle de réactivation.
 * Le calcul (qui est dormante, à risque…) viendra en Phase 2 ; ici on fige
 * seulement le vocabulaire métier et les couleurs, pour que toute l'UI parle
 * la même langue. On nomme par ce que la gérante voit, pas par le segment.
 */
export type ClientStatus =
  "active" | "at_risk" | "dormant" | "recovered" | "lost";

export const CLIENT_STATUS: Record<
  ClientStatus,
  { label: string; help: string; color: string }
> = {
  active: {
    label: "Active",
    help: "Revient dans son cycle habituel.",
    color: "var(--status-active)",
  },
  at_risk: {
    label: "À surveiller",
    help: "Approche de la fin de son cycle sans nouveau rendez-vous.",
    color: "var(--status-at-risk)",
  },
  dormant: {
    label: "À relancer",
    help: "A dépassé son cycle. C'est le bon moment pour la relancer.",
    color: "var(--status-dormant)",
  },
  recovered: {
    label: "Revenue",
    help: "Relancée puis revenue. Réactivation réussie.",
    color: "var(--status-recovered)",
  },
  lost: {
    label: "Perdue",
    help: "Sans retour malgré les relances.",
    color: "var(--status-lost)",
  },
};
