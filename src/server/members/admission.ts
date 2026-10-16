// Accès sur invitation seulement (spec section 6.5) : un compte n'existe que pour
// l'admin d'amorçage ou pour une adresse qui détient une invitation en cours.
// La règle est vérifiée au moment où better-auth crée l'utilisateur, ce qui ferme
// toutes les portes d'un coup (lien magique, passkey, toute méthode ajoutée plus tard).

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Domaines d'une même boîte Gmail : `googlemail.com` est l'ancien nom de `gmail.com`. */
export const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'] as const;

/**
 * Clé de comparaison de deux adresses, jamais stockée : Gmail ignore les points de la
 * partie locale et tout suffixe `+…`, donc `a.b+x@gmail.com` et `ab@googlemail.com`
 * arrivent dans la même boîte. Ailleurs, chaque caractère compte : deux adresses qui
 * ne diffèrent que d'un point restent deux personnes.
 */
export function emailMatchKey(email: string): string {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at < 0) return normalized;
  const domain = normalized.slice(at + 1);
  if (!GMAIL_DOMAINS.some((gmail) => gmail === domain)) return normalized;
  const local = normalized.slice(0, at).split('+')[0] ?? '';
  return `${local.replaceAll('.', '')}@gmail.com`;
}

export type Admission =
  | { admitted: true; via: 'bootstrap' }
  | { admitted: true; via: 'invitation'; invitationId: string }
  | { admitted: false; reason: 'not-invited' | 'expired' };

export function decideAdmission(input: {
  email: string;
  now: Date;
  bootstrapAdminEmail?: string | undefined;
  /** Invitation en attente pour cette adresse, s'il y en a une. */
  invitation?: { id: string; expiresAt: Date } | undefined;
}): Admission {
  const key = emailMatchKey(input.email);
  if (input.bootstrapAdminEmail && key === emailMatchKey(input.bootstrapAdminEmail)) {
    return { admitted: true, via: 'bootstrap' };
  }
  if (!input.invitation) return { admitted: false, reason: 'not-invited' };
  if (input.invitation.expiresAt.getTime() <= input.now.getTime()) {
    return { admitted: false, reason: 'expired' };
  }
  return { admitted: true, via: 'invitation', invitationId: input.invitation.id };
}
