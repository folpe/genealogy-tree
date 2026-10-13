import type { NextConfig } from 'next';
import { securityHeaders } from './src/server/_shared/security-headers';

const config: NextConfig = {
  typedRoutes: true,
  // TypeScript 7 n'a plus l'API JS que `next build` sonde pour vérifier les types.
  // La CI lance `tsc --noEmit` avant le build : on retire seulement le doublon.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Une photo réduite dans le navigateur pèse moins d'1 Mo ; marge sous les 4,5 Mo
    // qu'accepte une fonction Vercel.
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders() }];
  },
};

export default config;
