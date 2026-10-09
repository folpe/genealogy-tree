import { z } from 'zod';

export const memberSchema = z.object({
  id: z.string().min(1),
  /** Fiche « C'est moi » ; `null` pour un admin non relié (ou un compte en attente). */
  personId: z.string().min(1).nullable(),
  isAdmin: z.boolean(),
  /** Horodatage d'inscription (ms) : départage déterministe des gardiens. */
  joinedAt: z.number().int().nonnegative(),
});
export type Member = z.infer<typeof memberSchema>;

/**
 * Niveau de visibilité d'une fiche (spec section 6.4) :
 * - `full` : tout ;
 * - `family` : vivant hors périmètre, année et ville de naissance seulement ;
 * - `structure` : fiche restreinte au cercle proche, nom et liens seulement ;
 * - `minor` : mineur hors cercle proche, prénom et initiales seulement.
 */
export type VisibilityLevel = 'full' | 'family' | 'structure' | 'minor';

export type Visibility = {
  level: VisibilityLevel;
  /** Lecture d'admin sur une fiche qu'il ne verrait pas autrement : à journaliser. */
  audit: boolean;
};

/** Pourquoi une modification est directe ou passe par une suggestion. */
export type EditReason =
  | 'self'
  | 'circle'
  | 'lineage'
  | 'open'
  | 'admin'
  | 'outside'
  | 'reverted'
  | 'sourced';

export type EditDecision = {
  mode: 'direct' | 'suggest';
  reason: EditReason;
  /** Membres qui reçoivent la suggestion (vide en mode direct). */
  guardians: string[];
};

export type ProposedChange = {
  /** Champs modifiés, en chemin pointé (`death.date`, `residence`...). */
  fields: string[];
  /** Une nouvelle source accompagne la modification. */
  withNewSource?: boolean;
  /** L'auteur réapplique une modification qu'un autre a annulée (anti guerre d'édition). */
  reappliesReverted?: boolean;
};
