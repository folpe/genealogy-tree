import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

function directives(policy: string): Map<string, string> {
  return new Map(
    policy
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name = '', ...values] = d.split(/\s+/);
        return [name, values.join(' ')];
      }),
  );
}

describe('securityHeaders', () => {
  it('pose HSTS, anti-framing, nosniff, referrer et permissions', () => {
    const byKey = new Map(securityHeaders().map((h) => [h.key, h.value]));
    expect(byKey.get('Strict-Transport-Security')).toContain('max-age=63072000');
    expect(byKey.get('X-Frame-Options')).toBe('DENY');
    expect(byKey.get('X-Content-Type-Options')).toBe('nosniff');
    expect(byKey.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(byKey.get('Permissions-Policy')).toContain('geolocation=()');
  });

  it('demande aux robots de ne rien indexer', () => {
    const byKey = new Map(securityHeaders().map((h) => [h.key, h.value]));
    expect(byKey.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });
});

describe('contentSecurityPolicy', () => {
  it('n’autorise que les scripts portant le nonce de la requête', () => {
    const csp = directives(contentSecurityPolicy('abc123', { isDev: false }));
    expect(csp.get('script-src')).toBe("'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp.get('default-src')).toBe("'self'");
  });

  it('interdit l’affichage dans une iframe, les plugins et les formulaires externes', () => {
    const csp = directives(contentSecurityPolicy('n', { isDev: false }));
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(csp.get('object-src')).toBe("'none'");
    expect(csp.get('form-action')).toBe("'self'");
    expect(csp.get('base-uri')).toBe("'self'");
    expect(csp.has('upgrade-insecure-requests')).toBe(true);
  });

  it('autorise les images du stockage Blob et les data URL des aperçus flous', () => {
    const csp = directives(contentSecurityPolicy('n', { isDev: false }));
    expect(csp.get('img-src')).toBe("'self' blob: data: https://*.public.blob.vercel-storage.com");
  });

  it('n’ouvre unsafe-eval qu’en développement', () => {
    expect(contentSecurityPolicy('n', { isDev: true })).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy('n', { isDev: false })).not.toContain("'unsafe-eval'");
  });
});
