import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from './proxy';

// Le matcher est une frontière de sécurité : chaque motif est compilé et testé
// sur les chemins qui doivent, ou non, passer par le proxy.
function matches(path: string): boolean {
  return config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path));
}

describe('proxy matcher', () => {
  it.each(['/', '/login', '/tree', '/people/abc'])('passe par le proxy : %s', (path) => {
    expect(matches(path)).toBe(true);
  });

  it.each([
    '/api/auth/session',
    '/_next/static/chunk.js',
    '/_next/image',
    '/favicon.ico',
    '/robots.txt',
    '/favicon-96x96.png',
    '/site.webmanifest',
  ])('reste exclu : %s', (path) => {
    expect(matches(path)).toBe(false);
  });
});

describe('proxy', () => {
  const SESSION = 'better-auth.session_token=abc.def';
  const run = (path = '/login', cookie?: string) =>
    proxy(
      new NextRequest(`https://famille.folpe.me${path}`, {
        headers: cookie ? { cookie } : {},
      }),
    );

  it('pose une CSP avec un nonce, et le transmet au rendu', () => {
    const response = run();
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
    expect(response.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
  });

  it('tire un nonce différent à chaque requête', () => {
    const a = run().headers.get('Content-Security-Policy');
    const b = run().headers.get('Content-Security-Policy');
    expect(a).not.toBe(b);
  });

  it('expose le chemin demandé aux Server Components', () => {
    expect(run('/people/abc', SESSION).headers.get('x-middleware-request-x-pathname')).toBe(
      '/people/abc',
    );
  });

  it.each(['/tree', '/people/abc', '/'])('sans session, %s renvoie vers la connexion', (path) => {
    const response = run(path);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location') ?? '');
    expect(location.pathname).toBe('/login');
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
  });

  it.each(['/login', '/invite/jeton', '/request-access'])(
    '%s reste ouvert sans session',
    (path) => {
      expect(run(path).status).toBe(200);
    },
  );

  it('avec un cookie de session, laisse passer (la session est revérifiée côté serveur)', () => {
    expect(run('/tree', SESSION).status).toBe(200);
    expect(run('/tree', `__Secure-${SESSION}`).status).toBe(200);
  });
});
