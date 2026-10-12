import { normalizePlaceLabel } from '../family/family.mapper';
import type { GeocodeCandidate } from './places.geocoder';

// Choix d'un candidat de géocodage. Un lieu n'est placé sur la carte que sans
// doute raisonnable : des homonymes proches (« Saint-Denis » à La Réunion et en
// Seine-Saint-Denis), un score faible ou un précisant introuvable partent en revue
// manuelle avec leurs candidats, plutôt que d'inscrire des coordonnées fausses.

/** En dessous, la BAN a reconnu un autre nom que celui demandé (« Paris 13 » -> Paris). */
const SCORE_MIN = 0.7;
/** Écart de score sous lequel deux communes de même nom restent indiscernables. */
const HOMONYM_MARGIN = 0.05;

export type GeocodeVerdict =
  | { status: 'found'; best: GeocodeCandidate }
  | {
      status: 'review';
      reason: 'homonymes' | 'score_faible' | 'precisant_absent';
      candidates: GeocodeCandidate[];
    }
  | { status: 'not_found' };

const sameName = (a: GeocodeCandidate, b: GeocodeCandidate) =>
  normalizePlaceLabel(a.name) === normalizePlaceLabel(b.name);

function isHomonym(best: GeocodeCandidate, other: GeocodeCandidate): boolean {
  if (other.ref === best.ref || !sameName(best, other)) return false;
  if (best.score === undefined || other.score === undefined) return true;
  return best.score - other.score <= HOMONYM_MARGIN;
}

export function judgeCandidates(
  candidates: GeocodeCandidate[],
  query: { hint: string | undefined },
): GeocodeVerdict {
  if (candidates.length === 0) return { status: 'not_found' };
  const hint = query.hint ? normalizePlaceLabel(query.hint) : undefined;
  const matching = hint
    ? candidates.filter((c) => normalizePlaceLabel(c.context).includes(hint))
    : candidates;
  const [best] = matching;
  if (!best) return { status: 'review', reason: 'precisant_absent', candidates };
  if (best.score !== undefined && best.score < SCORE_MIN) {
    return { status: 'review', reason: 'score_faible', candidates: matching };
  }
  const homonyms = matching.filter((other) => isHomonym(best, other));
  if (homonyms.length > 0) {
    return { status: 'review', reason: 'homonymes', candidates: [best, ...homonyms] };
  }
  return { status: 'found', best };
}
