import { describe, expect, it } from 'vitest';
import { resolveAppUrl, resolvePasskeyRpID } from './env';

describe('resolveAppUrl', () => {
  it('prend l’URL explicite d’abord', () => {
    expect(
      resolveAppUrl({
        BETTER_AUTH_URL: 'https://famille.folpe.me',
        NEXT_PUBLIC_APP_URL: 'https://autre.exemple',
        VERCEL_BRANCH_URL: 'branche.vercel.app',
      }),
    ).toBe('https://famille.folpe.me');
  });

  it('en production, l’URL publique de l’app', () => {
    expect(resolveAppUrl({ NEXT_PUBLIC_APP_URL: 'https://famille.folpe.me' })).toBe(
      'https://famille.folpe.me',
    );
  });

  it('en preview, l’URL stable de la branche plutôt que celle du déploiement', () => {
    expect(
      resolveAppUrl({
        VERCEL_BRANCH_URL: 'ances-tree-git-feat-voidcorp.vercel.app',
        VERCEL_URL: 'ances-tree-abc123-voidcorp.vercel.app',
      }),
    ).toBe('https://ances-tree-git-feat-voidcorp.vercel.app');
    expect(resolveAppUrl({ VERCEL_URL: 'ances-tree-abc123-voidcorp.vercel.app' })).toBe(
      'https://ances-tree-abc123-voidcorp.vercel.app',
    );
  });

  it('en local, localhost', () => {
    expect(resolveAppUrl({})).toBe('http://localhost:3000');
  });
});

describe('resolvePasskeyRpID', () => {
  it('prend le domaine racine configuré, pour survivre à un changement de sous-domaine', () => {
    expect(resolvePasskeyRpID('https://famille.folpe.me', 'folpe.me')).toBe('folpe.me');
  });

  it('sinon, l’hôte de l’app (preview, local)', () => {
    expect(resolvePasskeyRpID('https://branche.vercel.app', undefined)).toBe('branche.vercel.app');
    expect(resolvePasskeyRpID('http://localhost:3000', undefined)).toBe('localhost');
  });
});
