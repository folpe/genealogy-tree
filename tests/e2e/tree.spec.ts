import { settled } from './camera';
import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// L'arbre dessiné (plan phase 4, lot 3), dans un vrai navigateur : placement calculé
// au rendu serveur, bulles atteignables au clavier, chacune menant à sa fiche.

test('l’arbre s’ouvre sur ma bulle, et les flèches suivent les liens', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
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

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/people\/[\w-]+$/);
});

test('un clic sur une bulle ouvre sa fiche', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  const henri = page.getByRole('treeitem', { name: /^Henri Marchand/ });
  // Henri est loin de ma bulle : on dézoome jusqu'à le voir, comme on le ferait.
  const zoomOut = page.getByRole('button', { name: 'Dézoomer', exact: true });
  for (let i = 0; i < 6; i += 1) {
    await zoomOut.click();
    await settled(page);
  }
  await expect(henri).toBeInViewport();
  await henri.click();
  await expect(page).toHaveURL(/\/people\/henri$/);
  await expect(page.getByRole('heading', { name: 'Henri Marchand' })).toBeVisible();
});

test('les liens sont tracés sous les bulles', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  await expect(page.getByRole('tree')).toBeVisible();
  const paths = page.locator('svg[aria-hidden="true"] path');
  expect(await paths.count()).toBeGreaterThan(10);
});
