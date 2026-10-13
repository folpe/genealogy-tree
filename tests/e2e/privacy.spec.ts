import type { Page } from '@playwright/test';
import { E2E_ADMIN_EMAIL, E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Droits par proximité (spec section 6.4) vérifiés sur ce qui part réellement vers
// le navigateur : le HTML et le payload RSC qu'il embarque, pas seulement l'écran.
// Anne (née le 2 mai 1960) et Tom vivent à Bordeaux, hors du périmètre d'Isabelle.

/** Le document brut, tel que servi : HTML et payload RSC compris. */
async function served(page: Page, path: string): Promise<string> {
  const response = await page.request.get(path);
  expect(response.ok()).toBe(true);
  return response.text();
}

// Ce qu'un membre hors périmètre ne doit jamais recevoir d'Anne, vivante.
const ANNE_RESIDENCE = 'Bordeaux';
const ANNE_EXACT_BIRTH = /mai 1960|1960-05-02|"month\\?":5,\\?"day\\?":2/;

test('hors périmètre : ni résidence ni date exacte d’un vivant, ni sur l’arbre ni sur sa fiche', async ({
  page,
}) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  // L'arbre graphique reçoit ses bulles côté navigateur : son payload est contrôlé
  // comme la fiche.
  // L'arbre entier dessine Anne ; la vue par défaut d'Isabelle ne la dessine peut-être
  // pas, mais ne doit pas plus laisser passer ses données.
  for (const path of ['/tree', '/tree?view=all', '/people/anne']) {
    const document = await served(page, path);
    if (path !== '/tree') expect(document).toContain('Anne');
    expect(document).not.toContain(ANNE_RESIDENCE);
    expect(document).not.toMatch(ANNE_EXACT_BIRTH);
  }
});

test('témoin : le propriétaire, qui voit tout, reçoit bien ces données sur la fiche', async ({
  page,
}) => {
  await signIn(page, E2E_ADMIN_EMAIL);
  const document = await served(page, '/people/anne');
  expect(document).toContain(ANNE_RESIDENCE);
  expect(document).toMatch(ANNE_EXACT_BIRTH);
});
