import type { Page } from '@playwright/test';
import { E2E_ADMIN_EMAIL, E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { countEmails, nextMagicLink } from './outbox';

// Droits par proximité (spec section 6.4) vérifiés sur ce qui part réellement vers
// le navigateur : le HTML et le payload RSC qu'il embarque, pas seulement l'écran.
// Anne (née le 2 mai 1960) et Tom vivent à Bordeaux, hors du périmètre d'Isabelle.

async function signIn(page: Page, email: string) {
  const before = countEmails(email);
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Ton email' }).fill(email);
  await page.getByRole('button', { name: 'Recevoir mon lien' }).click();
  await page.goto(await nextMagicLink(email, before));
  await expect(page).toHaveURL(/\/tree$/);
}

/** Le document brut, tel que servi : HTML et payload RSC compris. */
async function served(page: Page, path: string): Promise<string> {
  const response = await page.request.get(path);
  expect(response.ok()).toBe(true);
  return response.text();
}

// Ce qu'un membre hors périmètre ne doit jamais recevoir d'Anne, vivante.
const ANNE_RESIDENCE = 'Bordeaux';
const ANNE_EXACT_BIRTH = /mai 1960|"month\\?":5,\\?"day\\?":2/;

test('hors périmètre : ni résidence ni date exacte d’un vivant, ni sur l’arbre ni sur sa fiche', async ({
  page,
}) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  for (const path of ['/tree', '/people/anne']) {
    const document = await served(page, path);
    expect(document).toContain('Anne');
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
