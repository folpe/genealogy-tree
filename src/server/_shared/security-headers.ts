// En-têtes de sécurité de l'app. Les en-têtes fixes sont posés par next.config,
// la CSP par le proxy, car son nonce change à chaque requête.

export type SecurityHeader = { key: string; value: string };

export function securityHeaders(): SecurityHeader[] {
  return [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    // App privée : rien ne doit apparaître dans un moteur de recherche.
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ];
}

const BLOB_ORIGIN = 'https://*.public.blob.vercel-storage.com';

export function contentSecurityPolicy(nonce: string, { isDev }: { isDev: boolean }): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Les attributs style (animations, positions calculées) restent autorisés.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${BLOB_ORIGIN}`,
    "font-src 'self'",
    "connect-src 'self'",
    // Worker de placement de l'arbre. Sans cette directive, les workers retombent sur
    // script-src, dont l'effet de 'strict-dynamic' sur un worker varie selon le
    // navigateur (Chromium l'accepte, Safari non vérifié) : on le dit explicitement.
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}
