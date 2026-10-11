// Accès sur invitation seulement (spec section 6.5) : un compte n'existe que pour
// l'admin d'amorçage ou pour une adresse qui détient une invitation en cours.
// La règle est vérifiée au moment où better-auth crée l'utilisateur, ce qui ferme
// toutes les portes d'un coup (lien magique, passkey, toute méthode ajoutée plus tard).

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
  const email = normalizeEmail(input.email);
  if (input.bootstrapAdminEmail && email === normalizeEmail(input.bootstrapAdminEmail)) {
    return { admitted: true, via: 'bootstrap' };
  }
  if (!input.invitation) return { admitted: false, reason: 'not-invited' };
  if (input.invitation.expiresAt.getTime() <= input.now.getTime()) {
    return { admitted: false, reason: 'expired' };
  }
  return { admitted: true, via: 'invitation', invitationId: input.invitation.id };
}
