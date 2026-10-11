import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { contentSecurityPolicy } from './server/_shared/security-headers';

// Next 16 : `middleware.ts` devient `proxy.ts`, l'export `middleware` devient `proxy`.
// La session et la redirection des routes (app) arrivent avec l'auth (lot 4) ;
// la policy reste vérifiée dans chaque service, jamais seulement ici.
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, { isDev: process.env.NODE_ENV === 'development' });

  // Next lit la CSP de la requête pour poser le nonce sur ses propres scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  // Next n'expose pas le chemin aux Server Components : utile au retour après connexion.
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
