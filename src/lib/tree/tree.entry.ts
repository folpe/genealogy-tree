// Entrée de l'arbre (plan phase 5, lot 3 ; DESIGN.md, section 10) : il pousse génération
// par génération. Ce module dit seulement quoi entre ensemble ; le rythme est dans
// `src/motion/entry.ts`.

type EntryNode = { id: string; row: number; y: number };
type EntryLink = { id: string; d: string };
type EntryHandle = { id: string; y: number };

export type EntryWaves = {
  /** Les bulles de chaque génération, de la plus haute à la plus basse. */
  persons: string[][];
  /** Les traits qui partent de chaque génération : union du couple, branches vers dessous. */
  links: string[][];
  /** Les poignées de branche posées sous chaque génération, avec ses traits. */
  handles: string[][];
};

/** Point de départ d'un chemin SVG (`M x,y`), ou rien s'il est illisible. */
const startY = (d: string) => {
  const match = /^M\s*(-?[\d.]+)[ ,](-?[\d.]+)/.exec(d);
  return match ? Number(match[2]) : undefined;
};

export function entryWaves(
  nodes: EntryNode[],
  links: EntryLink[],
  handles: EntryHandle[] = [],
): EntryWaves {
  const rows = Math.max(-1, ...nodes.map((node) => node.row)) + 1;
  const empty = () => Array.from({ length: rows }, (): string[] => []);
  const persons = empty();
  const rowY: number[] = Array.from({ length: rows }, () => Number.POSITIVE_INFINITY);
  for (const node of nodes) {
    persons[node.row]?.push(node.id);
    rowY[node.row] = Math.min(rowY[node.row] ?? Number.POSITIVE_INFINITY, node.y);
  }
  /** La génération la plus basse qui commence au-dessus de `y` ; la première sinon. */
  const rowAbove = (y: number | undefined) => {
    let row = 0;
    if (y !== undefined) for (let r = 0; r < rows; r += 1) if ((rowY[r] ?? y) <= y) row = r;
    return row;
  };
  const linkWaves = empty();
  for (const link of links) linkWaves[rowAbove(startY(link.d))]?.push(link.id);
  const handleWaves = empty();
  for (const handle of handles) handleWaves[rowAbove(handle.y)]?.push(handle.id);
  return { persons, links: linkWaves, handles: handleWaves };
}
