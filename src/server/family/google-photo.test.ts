import { describe, expect, it } from 'vitest';
import { decideGooglePhotoImport, googlePhotoUrl } from './google-photo';

// Jeton de synthèse : seule la charge utile compte, la signature n'est pas lue.
const anIdToken = (claims: Record<string, unknown>) =>
  [
    Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url'),
    Buffer.from(JSON.stringify(claims)).toString('base64url'),
    'signature',
  ].join('.');

const PICTURE = 'https://lh3.googleusercontent.com/a/photo-de-test';

describe('googlePhotoUrl', () => {
  it('lit la revendication picture et demande la grande taille', () => {
    expect(googlePhotoUrl(anIdToken({ picture: `${PICTURE}=s96-c` }))).toBe(`${PICTURE}=s800-c`);
  });

  it('garde une URL sans suffixe de taille telle quelle', () => {
    expect(googlePhotoUrl(anIdToken({ picture: PICTURE }))).toBe(PICTURE);
  });

  it('refuse un autre hôte que googleusercontent.com', () => {
    expect(googlePhotoUrl(anIdToken({ picture: 'https://exemple.fr/photo.jpg' }))).toBeUndefined();
    expect(
      googlePhotoUrl(anIdToken({ picture: 'https://googleusercontent.com.exemple.fr/a' })),
    ).toBeUndefined();
    expect(
      googlePhotoUrl(anIdToken({ picture: 'https://fauxgoogleusercontent.com/a' })),
    ).toBeUndefined();
  });

  it('refuse un autre schéma que https', () => {
    expect(
      googlePhotoUrl(anIdToken({ picture: 'http://lh3.googleusercontent.com/a/x' })),
    ).toBeUndefined();
  });

  it('ne trouve rien sans picture, ou dans un jeton illisible', () => {
    expect(googlePhotoUrl(anIdToken({ sub: '42' }))).toBeUndefined();
    expect(googlePhotoUrl(anIdToken({ picture: 42 }))).toBeUndefined();
    expect(googlePhotoUrl(anIdToken({ picture: 'pas une url' }))).toBeUndefined();
    expect(googlePhotoUrl('pas-un-jeton')).toBeUndefined();
    expect(googlePhotoUrl('a.%%%.c')).toBeUndefined();
  });
});

describe('decideGooglePhotoImport', () => {
  const url = `${PICTURE}=s800-c`;

  it('importe sur la fiche du membre quand elle n’a pas de photo', () => {
    expect(
      decideGooglePhotoImport({ url, member: { personId: 'luc', personHasPhoto: false } }),
    ).toEqual({ import: true, personId: 'luc', url });
  });

  it('ne touche pas une fiche déjà photographiée', () => {
    expect(
      decideGooglePhotoImport({ url, member: { personId: 'luc', personHasPhoto: true } }),
    ).toEqual({ import: false, reason: 'already-has-photo' });
  });

  it('ne fait rien sans membre, sans fiche liée, ou sans photo Google', () => {
    expect(decideGooglePhotoImport({ url, member: undefined })).toEqual({
      import: false,
      reason: 'no-member',
    });
    expect(
      decideGooglePhotoImport({ url, member: { personId: undefined, personHasPhoto: false } }),
    ).toEqual({ import: false, reason: 'no-person' });
    expect(
      decideGooglePhotoImport({
        url: undefined,
        member: { personId: 'luc', personHasPhoto: false },
      }),
    ).toEqual({ import: false, reason: 'no-google-photo' });
  });
});
