import { describe, expect, it } from 'vitest';
import { decideAdmission, normalizeEmail } from './admission';

const now = new Date('2026-10-11T12:00:00Z');
const later = new Date('2026-10-20T12:00:00Z');
const earlier = new Date('2026-10-01T12:00:00Z');

describe('normalizeEmail', () => {
  it('ignore casse et espaces : une seule porte par adresse', () => {
    expect(normalizeEmail('  Luc.Marchand@Exemple.FR ')).toBe('luc.marchand@exemple.fr');
  });
});

describe('decideAdmission', () => {
  it('admet l’admin d’amorçage sans invitation, quelle que soit la casse', () => {
    expect(
      decideAdmission({ email: 'Folpe@Exemple.fr', bootstrapAdminEmail: 'folpe@exemple.fr', now }),
    ).toEqual({ admitted: true, via: 'bootstrap' });
  });

  it('admet une adresse invitée tant que l’invitation court', () => {
    expect(
      decideAdmission({
        email: 'luc@exemple.fr',
        now,
        invitation: { id: 'inv-1', expiresAt: later },
      }),
    ).toEqual({ admitted: true, via: 'invitation', invitationId: 'inv-1' });
  });

  it('refuse une invitation expirée', () => {
    expect(
      decideAdmission({
        email: 'luc@exemple.fr',
        now,
        invitation: { id: 'inv-1', expiresAt: earlier },
      }),
    ).toEqual({ admitted: false, reason: 'expired' });
  });

  it('refuse l’échéance exacte', () => {
    expect(
      decideAdmission({ email: 'luc@exemple.fr', now, invitation: { id: 'i', expiresAt: now } }),
    ).toEqual({ admitted: false, reason: 'expired' });
  });

  it('refuse toute autre adresse', () => {
    expect(
      decideAdmission({
        email: 'inconnu@exemple.fr',
        bootstrapAdminEmail: 'folpe@exemple.fr',
        now,
      }),
    ).toEqual({ admitted: false, reason: 'not-invited' });
    expect(decideAdmission({ email: 'inconnu@exemple.fr', now })).toEqual({
      admitted: false,
      reason: 'not-invited',
    });
  });
});
