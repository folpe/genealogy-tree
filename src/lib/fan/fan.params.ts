import { z } from 'zod';
import { FAN_GENERATIONS } from '@/components/fan/fan.helper';

// État de l'éventail dans l'URL : `/ancestors?p=<id>&g=5`. Comme pour l'arbre, une
// valeur invalide retombe sur son défaut : une URL abîmée ne casse pas la page.

export type FanParams = {
  /** Personne au centre ; par défaut, le lecteur. */
  p?: string;
  generations: number;
};

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const fallback = <T extends z.ZodType>(schema: T) =>
  z.preprocess(first, schema.optional().catch(undefined));

const schema = z.object({
  p: fallback(z.string().min(1).max(64)),
  g: fallback(z.coerce.number().int().min(FAN_GENERATIONS.min).max(FAN_GENERATIONS.max)),
});

export function parseFanParams(
  searchParams: Record<string, string | string[] | undefined>,
): FanParams {
  const { p, g } = schema.parse(searchParams);
  return { ...(p ? { p } : {}), generations: g ?? FAN_GENERATIONS.initial };
}

export function fanHref({ p, generations }: FanParams): string {
  const query = new URLSearchParams();
  if (p) query.set('p', p);
  if (generations !== FAN_GENERATIONS.initial) query.set('g', String(generations));
  const search = query.toString();
  return search ? `/ancestors?${search}` : '/ancestors';
}
