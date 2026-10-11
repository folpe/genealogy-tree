import type { NextConfig } from 'next';
import { securityHeaders } from './src/server/_shared/security-headers';

const config: NextConfig = {
  typedRoutes: true,
  // TypeScript 7 n'a plus l'API JS que `next build` sonde pour vérifier les types.
  // La CI lance `tsc --noEmit` avant le build : on retire seulement le doublon.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders() }];
  },
};

export default config;
