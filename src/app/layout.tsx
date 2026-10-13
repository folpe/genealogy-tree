import type { Metadata, Viewport } from 'next';
import { Figtree, Fraunces } from 'next/font/google';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-fraunces',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Ances-Tree', template: '%s - Ances-Tree' },
  description: 'L’arbre privé de la famille.',
  applicationName: 'Ances-Tree',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  // Safari sur iPhone : l'app ajoutée à l'écran d'accueil s'ouvre en plein écran.
  appleWebApp: { capable: true, title: 'Ances-Tree', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // ADR 07 : l'arbre gère lui-même le pincement.
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F2EA' },
    { media: '(prefers-color-scheme: dark)', color: '#1D1A2B' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Rendu à la requête : Next ne pose le nonce de la CSP que sur une page rendue
  // dynamiquement (voir docs/decisions-log, CSP à nonce sans cacheComponents).
  await connection();
  return (
    <html lang="fr" className={`${fraunces.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
