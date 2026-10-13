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

test('les onglets mènent de l’arbre aux ancêtres et marquent la vue ouverte', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  const nav = page.getByRole('navigation', { name: 'Vues' });
  await expect(nav.getByRole('link', { name: 'Arbre' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'Ancêtres' }).click();
  await expect(page).toHaveURL(/\/ancestors$/);
  await expect(nav.getByRole('link', { name: 'Ancêtres' })).toHaveAttribute('aria-current', 'page');
});

test('le thème choisi s’applique tout de suite et tient au rechargement', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme');
  await page.getByRole('button', { name: /^Mon compte/ }).click();
  const saved = page.waitForResponse((r) => r.request().method() === 'POST');
  await page.getByRole('menuitemradio', { name: 'Sombre' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await saved;
  // Rendu serveur : la page arrive déjà sombre, sans passage par le clair.
  const response = await page.reload();
  expect(await response?.text()).toMatch(/<html[^>]*data-theme="dark"/);
  await page.getByRole('button', { name: /^Mon compte/ }).click();
  await page.getByRole('menuitemradio', { name: 'Comme l’appareil' }).click();
  await expect(html).not.toHaveAttribute('data-theme');
});

test('l’arbre tient dans l’écran : rien ne défile, le canevas prend la place', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await expect(page.getByRole('tree')).toBeVisible();
  const { scroll, viewport, canvas } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
    canvas:
      document.querySelector('[data-camera-layer]')?.parentElement?.getBoundingClientRect()
        .height ?? 0,
  }));
  expect(scroll).toBeLessThanOrEqual(viewport);
  // Le canevas occupe l'essentiel de l'écran, sur téléphone comme sur ordinateur.
  expect(canvas).toBeGreaterThan(viewport * 0.5);
});
