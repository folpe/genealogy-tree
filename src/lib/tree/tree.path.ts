// Chemin du lien de parenté dans l'arbre dessiné (plan phase 5, lot 6). Le domaine
// rend une suite de personnes et d'unions (`findRelationshipPath`) ; on en déduit les
// bulles et les traits à allumer, d'après les identifiants de `tree.routes.ts`.

type UnionShape = { id: string; partnerIds: [string, string | null] };

/** Un trait du chemin ; `reverse` : parcouru de l'enfant vers le parent. */
type PathLink = { id: string; reverse: boolean };

/** Les traits d'un pas du chemin, allumés ensemble. */
export type PathStep = PathLink[];

export type PathHighlight = {
  persons: Set<string>;
  links: Set<string>;
  /** À cadrer : le chemin, plus les parents d'où partent ses branches. */
  framed: Set<string>;
  /** Le chemin pas à pas, depuis Toi : l'ordre de son tracé. */
  steps: PathStep[];
};

export function pathHighlight(path: string[], unions: UnionShape[]): PathHighlight {
  const byId = new Map(unions.map((u) => [u.id, u]));
  const persons = new Set(path.filter((id) => !byId.has(id)));
  // Au sommet, le chemin monte d'un enfant et redescend vers un autre : le couple est
  // celui des ancêtres communs, que la carte nomme ; il s'allume avec le chemin.
  path.forEach((id, i) => {
    const union = byId.get(id);
    const [before, after] = [path[i - 1], path[i + 1]];
    // Deux personnes de part et d'autre : un chemin filtré peut avoir perdu un maillon.
    if (!union || !before || !after || byId.has(before) || byId.has(after)) return;
    if (union.partnerIds.includes(before) || union.partnerIds.includes(after)) return;
    for (const parent of union.partnerIds) if (parent) persons.add(parent);
  });
  const framed = new Set(persons);
  /** Un enfant rattaché à une union : son trait, ou les branches de chaque parent. */
  const fromUnion = (union: UnionShape, child: string, reverse: boolean): PathStep => {
    const step = [{ id: `child:${union.id}>${child}`, reverse }];
    for (const parent of union.partnerIds) {
      if (!parent) continue;
      step.push({ id: `parent:${parent}>${child}`, reverse });
      framed.add(parent);
    }
    return step;
  };
  const steps: PathStep[] = [];
  for (let i = 0; i + 1 < path.length; i += 1) {
    const a = path[i] ?? '';
    const b = path[i + 1] ?? '';
    const ua = byId.get(a);
    const ub = byId.get(b);
    const union = ua ?? ub;
    const other = ua ? b : a;
    if (union) {
      const joined = `union:${union.id}`;
      // Vers l'union depuis un enfant, le chemin remonte ; depuis l'union, il descend.
      // De conjoint à conjoint, l'union est atteinte puis quittée : un seul trait.
      if (!union.partnerIds.includes(other)) steps.push(fromUnion(union, other, ub !== undefined));
      else if (steps.at(-1)?.[0]?.id !== joined) steps.push([{ id: joined, reverse: false }]);
    } else {
      steps.push([
        { id: `parent:${a}>${b}`, reverse: false },
        { id: `parent:${b}>${a}`, reverse: true },
      ]);
    }
  }
  const links = new Set(steps.flat().map((link) => link.id));
  return { persons, links, framed, steps };
}
