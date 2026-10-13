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
    // Une photo réduite dans le navigateur pèse moins d'1 Mo. Un peu au-dessus du plafond
    // du service (4 Mo) : c'est lui qui refuse, avec son message.
    serverActions: { bodySizeLimit: '5mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders() }];
  },
};

export default config;
