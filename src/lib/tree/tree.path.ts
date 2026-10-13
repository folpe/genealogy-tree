// Chemin du lien de parenté dans l'arbre dessiné (plan phase 5, lot 6). Le domaine
// rend une suite de personnes et d'unions (`findRelationshipPath`) ; on en déduit les
// bulles et les traits à allumer, d'après les identifiants de `tree.routes.ts`.

type UnionShape = { id: string; partnerIds: [string, string | null] };

export type PathHighlight = { persons: Set<string>; links: Set<string> };

export function pathHighlight(path: string[], unions: UnionShape[]): PathHighlight {
  const byId = new Map(unions.map((u) => [u.id, u]));
  const persons = new Set(path.filter((id) => !byId.has(id)));
  const links = new Set<string>();
  /** Un enfant rattaché à une union : son trait, ou les branches de chaque parent. */
  const fromUnion = (union: UnionShape, child: string) => {
    links.add(`child:${union.id}>${child}`);
    for (const parent of union.partnerIds) if (parent) links.add(`parent:${parent}>${child}`);
  };
  for (let i = 0; i + 1 < path.length; i += 1) {
    const a = path[i] ?? '';
    const b = path[i + 1] ?? '';
    const ua = byId.get(a);
    const ub = byId.get(b);
    const union = ua ?? ub;
    const other = ua ? b : a;
    if (union) {
      if (union.partnerIds.includes(other)) links.add(`union:${union.id}`);
      else fromUnion(union, other);
    } else {
      links.add(`parent:${a}>${b}`);
      links.add(`parent:${b}>${a}`);
    }
  }
  return { persons, links };
}
