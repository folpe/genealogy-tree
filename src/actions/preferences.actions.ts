'use server';

import { cookies } from 'next/headers';
import { parseTheme, THEME_COOKIE, THEME_MAX_AGE_S } from '@/lib/theme/theme';
import { requireSession } from '@/server/auth/session';

// Préférences d'affichage du lecteur. Le thème vit dans un cookie : le serveur le lit
// pour rendre la page directement dans le bon thème.

export async function setThemeAction(theme: unknown): Promise<void> {
  await requireSession();
  (await cookies()).set(THEME_COOKIE, parseTheme(theme), {
    maxAge: THEME_MAX_AGE_S,
    sameSite: 'lax',
    httpOnly: true,
    // Chromium et Firefox l'acceptent sur http://localhost ; un ancien Safari non : en
    // local, tester le thème dans Chrome.
    secure: true,
    path: '/',
  });
}
