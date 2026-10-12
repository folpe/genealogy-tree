import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptExport, encryptExport } from './export-crypto';

const key = randomBytes(32).toString('hex');

describe('chiffrement de l’export Notion', () => {
  it('rend le contenu d’origine avec la bonne clé', () => {
    const clear = Buffer.from('{"pages":[]}');
    expect(decryptExport(encryptExport(clear, key), key)).toEqual(clear);
  });

  it('ne laisse rien de lisible dans le fichier chiffré', () => {
    const sealed = encryptExport(Buffer.from('Henri Marchand, Rodez'), key);
    expect(sealed.toString('latin1')).not.toContain('Marchand');
  });

  it('ne produit jamais deux fois le même chiffré', () => {
    const clear = Buffer.from('identique');
    expect(encryptExport(clear, key).equals(encryptExport(clear, key))).toBe(false);
  });

  it('refuse une mauvaise clé ou un fichier altéré', () => {
    const sealed = encryptExport(Buffer.from('secret'), key);
    expect(() => decryptExport(sealed, randomBytes(32).toString('hex'))).toThrow();
    const tampered = Buffer.from(sealed);
    tampered[tampered.length - 1] = (tampered.at(-1) ?? 0) ^ 1;
    expect(() => decryptExport(tampered, key)).toThrow();
  });

  it('refuse une clé qui n’a pas 256 bits', () => {
    expect(() => encryptExport(Buffer.from('x'), 'abcd')).toThrow(/256 bits/);
  });

  it('refuse un fichier qui n’est pas un export chiffré', () => {
    expect(() => decryptExport(Buffer.from('{"pages":[]}'), key)).toThrow(/export chiffré/);
  });
});
