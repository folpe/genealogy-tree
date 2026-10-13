import { settled } from './camera';
import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// L'arbre dessiné (plan phase 4, lot 3), dans un vrai navigateur : placement calculé
// au rendu serveur, bulles atteignables au clavier, chacune menant à sa fiche.

test('l’arbre s’ouvre sur ma bulle, et les flèches suivent les liens', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  const tree = page.getByRole('tree', { name: 'Arbre de la famille' });
  await expect(tree).toBeVisible();
  const me = tree.getByRole('treeitem', { name: /c’est toi$/ });
  await expect(me).toBeInViewport();
  await expect(me).toHaveAttribute('tabindex', '0');

  await me.focus();
  await page.keyboard.press('ArrowUp');
  const parent = page.locator(':focus');
  await expect(parent).toHaveAttribute('role', 'treeitem');
  await expect(parent).not.toHaveAccessibleName(/c’est toi$/);
  await expect(parent).toHaveAttribute('tabindex', '0');

  // Entrée ouvre la fiche à côté de l'arbre (phase 5, lot 4).
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/[?&]fiche=[\w-]+/);
});

test('un clic sur une bulle ouvre sa fiche', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  const henri = page.getByRole('treeitem', { name: /^Henri Marchand/ });
  // Henri est loin de ma bulle : on dézoome jusqu'à le voir, comme on le ferait.
  const zoomOut = page.getByRole('button', { name: 'Dézoomer', exact: true });
  for (let i = 0; i < 6; i += 1) {
    await zoomOut.click();
    await settled(page);
  }
  await expect(henri).toBeInViewport();
  // Une navigation dans l'app, pas un rechargement : la page garde son état.
  await page.evaluate(() => Reflect.set(window, 'stayedInApp', true));
  await henri.click();
  await expect(page).toHaveURL(/[?&]fiche=henri/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Henri Marchand', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'stayedInApp'))).toBe(true);
});

test('les liens sont tracés sous les bulles', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  await expect(page.getByRole('tree')).toBeVisible();
  const paths = page.locator('svg[aria-hidden="true"] path');
  expect(await paths.count()).toBeGreaterThan(10);
});

test('la fiche complète montre aussitôt qu’elle arrive, et le retour montre l’arbre en chargement', async ({
  page,
}) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  // Réseau lent : chaque navigation (pas les préchargements) attend une seconde.
  await page.route('**/*', async (route) => {
    const headers = route.request().headers();
    const navigation = headers['rsc'] === '1' && !headers['next-router-prefetch'];
    if (navigation) await new Promise((done) => setTimeout(done, 1000));
    await route.continue();
  });
  // Le tap ouvre la fiche sur place, sans attendre le réseau.
  await page.getByRole('treeitem', { name: /c’est toi$/ }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Isabelle/ })).toBeVisible();
  await page.getByRole('link', { name: 'Fiche complète' }).click();
  await expect(page).toHaveURL(/\/people\/isabelle$/);

  await page.getByRole('link', { name: 'Retour à l’arbre' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'L’arbre se dessine' })).toBeVisible();
  await expect(page.getByRole('tree')).toBeVisible();
});

test('au retour d’une fiche, l’arbre revient là où on l’avait laissé, plis compris', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await page.getByRole('treeitem', { name: /^Luc Marchand/ }).focus();
  await page.keyboard.press('-');
  await expect(page.getByRole('treeitem', { name: /^Hugo Marchand/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
  await settled(page);
  // Retour sur Luc (la caméra peut le recadrer), puis Entrée ouvre sa fiche.
  await page.getByRole('treeitem', { name: /^Luc Marchand/ }).focus();
  const left = await settled(page);
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Fiche complète' }).click();
  await expect(page).toHaveURL(/\/people\/luc$/);
  await page.getByRole('link', { name: 'Retour à l’arbre' }).click();
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await expect(page.getByRole('treeitem', { name: /^Hugo Marchand/ })).toHaveCount(0);
  const back = await settled(page);
  expect(back.k).toBeCloseTo(left.k, 3);
  expect(Math.abs(back.x - left.x)).toBeLessThan(2);
  expect(Math.abs(back.y - left.y)).toBeLessThan(2);
});

test('un pli fait sans bouger l’arbre tient sur deux allers-retours vers une fiche', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  const luc = page.getByRole('treeitem', { name: /^Luc Marchand/ });
  await luc.focus();
  await settled(page);
  await page.keyboard.press('-');
  await expect(page.getByRole('treeitem', { name: /^Hugo Marchand/ })).toHaveCount(0);

  for (let round = 0; round < 2; round += 1) {
    await luc.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('link', { name: 'Fiche complète' }).click();
    await expect(page).toHaveURL(/\/people\/luc$/);
    await page.getByRole('link', { name: 'Retour à l’arbre' }).click();
    await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
    await expect(luc).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('treeitem', { name: /^Hugo Marchand/ })).toHaveCount(0);
  }
});
