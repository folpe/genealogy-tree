import { z } from 'zod';
import type { TreeDisplay } from '@/server/family/family.service';

// État de l'arbre dans l'URL (plan phase 4, lot 6) : `/tree?p=<id>&view=…&past=1&depth=3`.
// Partageable, et le retour du navigateur revient à la vue précédente. Une valeur
// invalide retombe sur son défaut : une URL abîmée ne casse pas la page.

/** Même forme que ce que le service dessine : l'URL en est la copie. */
export type TreeParams = TreeDisplay;

/** Profondeur bornée : au-delà, une famille réelle n'a plus de générations à montrer. */
const DEPTH_MAX = 20;
/** Familles de conjoints dépliées à la fois, au plus. */
const FAMILIES_MAX = 40;

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const fallback = <T extends z.ZodType>(schema: T) =>
  z.preprocess(first, schema.optional().catch(undefined));

const schema = z.object({
  p: fallback(z.string().min(1).max(64)),
  view: fallback(z.enum(['all', 'couple', 'descendants', 'hourglass'])),
  past: fallback(z.enum(['0', '1'])),
  depth: fallback(z.coerce.number().int().min(1).max(DEPTH_MAX)),
  famille: fallback(
    z
      .string()
      .max(FAMILIES_MAX * 65)
      .transform((value) => value.split(',').filter((id) => id.length > 0 && id.length <= 64)),
  ),
  fiche: fallback(z.string().min(1).max(64)),
});

export function parseTreeParams(
  searchParams: Record<string, string | string[] | undefined>,
): TreeParams {
  const { p, view, past, depth, famille, fiche } = schema.parse(searchParams);
  const families = famille?.slice(0, FAMILIES_MAX);
  return {
    ...(view ? { view } : {}),
    ...(p ? { p } : {}),
    past: past === '1',
    ...(depth ? { depth } : {}),
    ...(families && families.length > 0 ? { families } : {}),
    ...(fiche ? { reveal: fiche } : {}),
  };
}

export function treeHref({ view, p, past, depth, families }: TreeParams): string {
  const query = new URLSearchParams();
  if (p) query.set('p', p);
  if (view) query.set('view', view);
  if (past) query.set('past', '1');
  // La profondeur ne vaut que pour les vues centrées sur une personne.
  if (depth && view && view !== 'all') query.set('depth', String(depth));
  // Les familles dépliées ne valent que pour Toute la famille.
  if (families && families.length > 0 && view === 'all') query.set('famille', families.join(','));
  const search = query.toString();
  return search ? `/tree?${search}` : '/tree';
}

/**
 * Déplie ou replie la famille d'origine d'un conjoint (Toute la famille). L'arbre se
 * replace : la caméra revient sur le conjoint (`focus`), d'où la famille part.
 * `open` : l'état affiché, qui compte aussi une famille ouverte par une fiche demandée.
 */
export function familyToggleHref(params: TreeParams, spouseId: string, open: boolean): string {
  const current = (params.families ?? []).filter((id) => id !== spouseId);
  const families = open ? current : [...current, spouseId];
  const base = treeHref({ ...params, view: 'all', families });
  return `${base}${base.includes('?') ? '&' : '?'}focus=${encodeURIComponent(spouseId)}`;
}
