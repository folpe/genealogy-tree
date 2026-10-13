import { settled } from './camera';
import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Plier et déplier une branche (plan phase 4, lot 5) : le placement est recalculé
// par le worker, dans le vrai navigateur, sous la CSP de production.

test('« - » replie une branche par le worker, « + » la rouvre, la bulle reste en place', async ({
  page,
}) => {
  const refused: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy|worker/i.test(message.text())) refused.push(message.text());
  });
  await signIn(page, E2E_ISABELLE_EMAIL);
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  const items = page.getByRole('treeitem');
  const before = await items.count();
  const luc = page.getByRole('treeitem', { name: /^Luc Marchand/ });
  await luc.focus();
  await settled(page);
  const anchored = await luc.boundingBox();

  await page.keyboard.press('-');
  await expect(luc).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('treeitem', { name: /^Hugo Marchand/ })).toHaveCount(0);
  expect(await items.count()).toBeLessThan(before);
  await expect(
    page.getByRole('button', {
      name: /^Déplier la branche de Luc Marchand et Sophie Marchand, \d+ personnes$/,
    }),
  ).toBeAttached();
  // La caméra suit le nouveau placement : Luc n'a pas bougé à l'écran.
  await settled(page);
  const after = await luc.boundingBox();
  expect(Math.abs((after?.x ?? 0) - (anchored?.x ?? 0))).toBeLessThan(2);
  expect(Math.abs((after?.y ?? 0) - (anchored?.y ?? 0))).toBeLessThan(2);

  await page.keyboard.press('+');
  await expect(luc).toHaveAttribute('aria-expanded', 'true');
  await expect(items).toHaveCount(before);
  expect(refused).toEqual([]);
});

test('la poignée sous une bulle plie sa branche au doigt ou à la souris', async ({ page }) => {
  await signIn(page, E2E_ISABELLE_EMAIL);
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  const toggle = page.getByRole('button', {
    name: 'Replier la branche de Luc Marchand et Sophie Marchand',
  });
  await page.getByRole('treeitem', { name: /^Luc Marchand/ }).focus();
  await settled(page);
  await toggle.click();
  // Les enfants du couple partent ; Maxime, fils de Luc seul, reste avec sa propre branche.
  await expect(page.getByRole('treeitem', { name: /^Hugo Marchand/ })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: /^Maxime Marchand/ })).toHaveCount(1);
  await expect(page).toHaveURL(/\/tree$/);
});
