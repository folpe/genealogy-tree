// tdd-cover: e2e src/lib/tree/tree.layout.test.ts
// Gabarit d'une personne dans l'arbre, partagé par le placement (serveur) et le
// canevas (navigateur). Sans dépendance : le canevas l'importe sans tirer ELK ni Zod.

export type Point = { x: number; y: number };

export type LayoutMetrics = {
  /** Diamètre de la bulle (DESIGN.md : 76 px en desktop). */
  bubble: number;
  /** Emprise d'une personne : bulle, prénom et années dessous. */
  nodeWidth: number;
  nodeHeight: number;
  /** Écart entre deux partenaires d'un même bloc. */
  gap: number;
  /** Écart entre deux blocs d'une même génération. */
  blockGap: number;
  /** Écart vertical entre deux générations. */
  layerGap: number;
};

export const DEFAULT_METRICS: LayoutMetrics = {
  bubble: 76,
  nodeWidth: 120,
  nodeHeight: 132,
  gap: 16,
  blockGap: 40,
  layerGap: 72,
};
