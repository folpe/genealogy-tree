import type { Page } from '@playwright/test';
import { E2E_ADMIN_EMAIL, E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { countEmails, nextMagicLink } from './outbox';

// Connexion par magic link (plan phase 3, lot 4) et protection des pages.

async function askForLink(page: Page, email: string) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Ton email' }).fill(email);
  await page.getByRole('button', { name: 'Recevoir mon lien' }).click();
  await expect(page.getByRole('heading', { name: 'Regarde tes emails' })).toBeVisible();
}

test('la proposition de passkey demande une session', async ({ page }) => {
  await page.goto('/login/passkey');
  await expect(page).toHaveURL(/\/login$/);
});

test('la demande d’accès se fait depuis la connexion et y ramène', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Demander l’accès' }).click();
  await expect(page.getByRole('heading', { name: 'Rejoins la famille' })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à la connexion' }).click();
  await expect(page.getByRole('heading', { name: 'Entre dans l’arbre' })).toBeVisible();
});

test('une page protégée renvoie vers la connexion', async ({ page }) => {
  await page.goto('/tree');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Recevoir mon lien' })).toBeVisible();
});

test('une photo ne se sert pas sans session', async ({ request }) => {
  const response = await request.get('/media/inconnu/768', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()['location']).toMatch(/\/login$/);
});

test('une adresse inconnue voit la même confirmation, sans recevoir d’email', async ({
  page,
}, testInfo) => {
  const email = `inconnu-${testInfo.project.name}@famille.test`;
  await askForLink(page, email);
  await expect(page.getByText(email)).toBeVisible();
  // Laisse au serveur le temps d'écrire un éventuel email avant de vérifier.
  await page.waitForTimeout(1_000);
  expect(countEmails(email)).toBe(0);
});

test('le propriétaire entre par son lien, se voit proposer une passkey, puis arrive sur l’arbre', async ({
  page,
}) => {
  const before = countEmails(E2E_ADMIN_EMAIL);
  await askForLink(page, E2E_ADMIN_EMAIL);
  await page.goto(await nextMagicLink(E2E_ADMIN_EMAIL, before));

  await expect(page).toHaveURL(/\/login\/passkey$/);
  await expect(
    page.getByRole('heading', { name: 'La prochaine fois, un simple regard suffit' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Plus tard' }).click();

  await expect(page).toHaveURL(/\/tree$/);
  await expect(page.getByRole('heading', { name: 'L’arbre de la famille' })).toBeVisible();
  await expect(page.getByText('Henri', { exact: false }).first()).toBeVisible();
});

test('un lien ne sert qu’une fois', async ({ page, browser }) => {
  const before = countEmails(E2E_ISABELLE_EMAIL);
  await askForLink(page, E2E_ISABELLE_EMAIL);
  const link = await nextMagicLink(E2E_ISABELLE_EMAIL, before);
  await page.goto(link);
  await expect(page).toHaveURL(/\/login\/passkey$/);

  const other = await browser.newContext();
  const replay = await other.newPage();
  await replay.goto(link);
  await expect(replay).toHaveURL(/\/login\?error=/);
  await expect(replay.getByRole('main').getByRole('alert')).toHaveText(
    /Ce lien n’est plus valable/,
  );
  await other.close();
});
