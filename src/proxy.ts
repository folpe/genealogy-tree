import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { contentSecurityPolicy } from './server/_shared/security-headers';

// Next 16 : `middleware.ts` devient `proxy.ts`, l'export `middleware` devient `proxy`.
// Le proxy ne regarde que la présence d'un cookie de session, pour renvoyer tôt
// vers la connexion ; la session est revérifiée côté serveur (layout de l'app)
// et la policy dans chaque service.

const PUBLIC_PREFIXES = ['/login', '/invite/', '/request-access'];

const isPublic = (pathname: string) =>
  PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, { isDev: process.env.NODE_ENV === 'development' });

  const { pathname } = request.nextUrl;
  if (!isPublic(pathname) && !getSessionCookie(request)) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('Content-Security-Policy', csp);
    return response;
  }

  // Next lit la CSP de la requête pour poser le nonce sur ses propres scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  // Next n'expose pas le chemin aux Server Components : utile au retour après connexion.
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Fichiers statiques (icônes, manifest) exclus : tout chemin qui porte une extension.
  matcher: ['/((?!api/auth|_next/static|_next/image|.*\\.[a-z0-9]+$).*)'],
};
