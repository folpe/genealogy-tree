import type { Metadata, Viewport } from 'next';
import { Figtree, Fraunces } from 'next/font/google';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { KeyboardInset } from '@/components/app/keyboard-inset';
import { readThemeCookie, themeAttribute, themeColor } from '@/lib/theme/theme';
import './globals.css';
import { APP_NAME } from '@/lib/brand';

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
  title: { default: APP_NAME, template: `%s - ${APP_NAME}` },
  description: 'L’arbre privé de la famille.',
  applicationName: APP_NAME,
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  // Safari sur iPhone : l'app ajoutée à l'écran d'accueil s'ouvre en plein écran.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
};

const readTheme = async () => readThemeCookie(await cookies());

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
    // Le zoom du navigateur reste permis (WCAG 1.4.4, DECISIONS 17) : le canevas de
    // l'arbre le bloque lui-même (`touch-none`) et garde son propre pincement.
    // Les marges sûres d'iOS (encoche, barre d'accueil) deviennent lisibles en CSS.
    viewportFit: 'cover',
    themeColor: themeColor(await readTheme()),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Rendu à la requête : Next ne pose le nonce de la CSP que sur une page rendue
  // dynamiquement (voir docs/decisions-log, CSP à nonce sans cacheComponents).
  await connection();
  return (
    <html
      lang="fr"
      data-theme={themeAttribute(await readTheme())}
      className={`${fraunces.variable} ${figtree.variable}`}
      // Le script d'entrée de l'arbre peut y poser `data-tree-entry` avant l'hydratation.
      suppressHydrationWarning
    >
      <body>
        {children}
        <KeyboardInset />
      </body>
    </html>
  );
}
