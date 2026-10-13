import type { MetadataRoute } from 'next';

// Manifeste de l'app installée (Next le sert à /manifest.webmanifest et le relie
// dans chaque page). La portée couvre tout le site : ouvrir une fiche, la page
// Membres ou un lien de l'app reste dans l'app, sans barre de navigateur.

const PAPER = '#F6F2EA';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Ances-Tree',
    short_name: 'Ances-Tree',
    description: 'L’arbre privé de la famille.',
    lang: 'fr',
    start_url: '/tree',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: PAPER,
    theme_color: PAPER,
    icons: [
      { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
