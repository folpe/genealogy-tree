import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Coque de l'app : manifeste installable, avatar et menu du compte.

test('le manifeste est relié et garde tout le site dans l’app installée', async ({
  page,
  request,
}) => {
  await page.goto('/login');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const manifest = await (await request.get(href ?? '')).json();
  expect(manifest).toMatchObject({ scope: '/', start_url: '/tree', display: 'standalone' });
});

test('le menu de l’avatar mène aux membres, puis déconnecte', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  const avatar = page.getByRole('button', { name: /^Mon compte, Isabelle/ });
  await avatar.click();
  await page.getByRole('menuitem', { name: 'Membres' }).click();
  await expect(page).toHaveURL(/\/members$/);

  await avatar.click();
  await page.getByRole('menuitem', { name: 'Me déconnecter' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/tree');
  await expect(page).toHaveURL(/\/login$/);
});
