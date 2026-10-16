import { describe, expect, it } from 'vitest';
import { decideAdmission, emailMatchKey, normalizeEmail } from './admission';

const now = new Date('2026-10-11T12:00:00Z');
const later = new Date('2026-10-20T12:00:00Z');
const earlier = new Date('2026-10-01T12:00:00Z');

describe('normalizeEmail', () => {
  it('ignore casse et espaces : une seule porte par adresse', () => {
    expect(normalizeEmail('  Luc.Marchand@Exemple.FR ')).toBe('luc.marchand@exemple.fr');
  });
});

describe('emailMatchKey', () => {
  it('Gmail ignore les points de la partie locale', () => {
    expect(emailMatchKey('a.b@gmail.com')).toBe(emailMatchKey('ab@gmail.com'));
    expect(emailMatchKey('a.b@gmail.com')).toBe('ab@gmail.com');
  });

  it('Gmail ignore le suffixe +…', () => {
    expect(emailMatchKey('ab+famille@gmail.com')).toBe('ab@gmail.com');
    expect(emailMatchKey('a.b+x.y@gmail.com')).toBe('ab@gmail.com');
  });

  it('googlemail.com est la même boîte que gmail.com', () => {
    expect(emailMatchKey('A.B@GoogleMail.com')).toBe('ab@gmail.com');
  });

  it('ignore casse et espaces', () => {
    expect(emailMatchKey('  A.B@Gmail.COM ')).toBe('ab@gmail.com');
    expect(emailMatchKey(' Luc@Exemple.FR ')).toBe('luc@exemple.fr');
  });

  it('ailleurs, les points et le suffixe comptent : deux adresses, deux comptes', () => {
    expect(emailMatchKey('a.b@exemple.fr')).toBe('a.b@exemple.fr');
    expect(emailMatchKey('a.b@exemple.fr')).not.toBe(emailMatchKey('ab@exemple.fr'));
    expect(emailMatchKey('ab+x@exemple.fr')).toBe('ab+x@exemple.fr');
    expect(emailMatchKey('a.b@gmail.com.exemple.fr')).toBe('a.b@gmail.com.exemple.fr');
  });

  it('une saisie sans arobase reste telle quelle, normalisée', () => {
    expect(emailMatchKey(' Pas.Une.Adresse ')).toBe('pas.une.adresse');
  });
});

describe('decideAdmission', () => {
  it('reconnaît l’admin d’amorçage sous une autre forme de son adresse Gmail', () => {
    expect(
      decideAdmission({ email: 'folpe+x@gmail.com', bootstrapAdminEmail: 'Fol.pe@gmail.com', now }),
    ).toEqual({ admitted: true, via: 'bootstrap' });
    expect(
      decideAdmission({ email: 'folpe@exemple.fr', bootstrapAdminEmail: 'fol.pe@exemple.fr', now }),
    ).toEqual({ admitted: false, reason: 'not-invited' });
  });

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
