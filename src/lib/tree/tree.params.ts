import { z } from 'zod';
import type { TreeDisplay } from '@/server/family/family.service';

// État de l'arbre dans l'URL (plan phase 4, lot 6) : `/tree?p=<id>&view=…&past=1&depth=3`.
// Partageable, et le retour du navigateur revient à la vue précédente. Une valeur
// invalide retombe sur son défaut : une URL abîmée ne casse pas la page.

/** Même forme que ce que le service dessine : l'URL en est la copie. */
export type TreeParams = TreeDisplay;

/** Profondeur bornée : au-delà, une famille réelle n'a plus de générations à montrer. */
const DEPTH_MAX = 20;

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const fallback = <T extends z.ZodType>(schema: T) =>
  z.preprocess(first, schema.optional().catch(undefined));

const schema = z.object({
  p: fallback(z.string().min(1).max(64)),
  view: fallback(z.enum(['all', 'descendants', 'hourglass'])),
  past: fallback(z.enum(['0', '1'])),
  depth: fallback(z.coerce.number().int().min(1).max(DEPTH_MAX)),
});

export function parseTreeParams(
  searchParams: Record<string, string | string[] | undefined>,
): TreeParams {
  const { p, view, past, depth } = schema.parse(searchParams);
  return {
    view: view ?? 'all',
    ...(p ? { p } : {}),
    past: past === '1',
    ...(depth ? { depth } : {}),
  };
}

export function treeHref({ view, p, past, depth }: TreeParams): string {
  const query = new URLSearchParams();
  if (p) query.set('p', p);
  if (view !== 'all') query.set('view', view);
  if (past) query.set('past', '1');
  if (depth) query.set('depth', String(depth));
  const search = query.toString();
  return search ? `/tree?${search}` : '/tree';
}
