import type { Locator, Page } from '@playwright/test';
import { camera, settled } from './camera';
import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Caméra du canevas (plan phase 4, lot 4), dans un vrai navigateur : glisser,
// pincer, zoomer, revenir à soi. On lit l'état sur la transformation du calque.

async function openTree(page: Page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await signIn(page, E2E_ISABELLE_EMAIL);
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  return page.getByRole('region', { name: 'Canevas de l’arbre' });
}

/** Glisser à la souris, d'un point du canevas à un autre (coordonnées du canevas). */
async function drag(page: Page, canvas: Locator, from: [number, number], to: [number, number]) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canevas introuvable');
  await page.mouse.move(box.x + from[0], box.y + from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + to[0], box.y + to[1], { steps: 10 });
  await page.mouse.up();
}

test('glisser déplace l’arbre, et un glissé sur une bulle n’ouvre pas sa fiche', async ({
  page,
}) => {
  const canvas = await openTree(page);
  const before = await camera(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  const box = await me.boundingBox();
  const origin = await canvas.boundingBox();
  if (!box || !origin) throw new Error('bulle introuvable');
  const start: [number, number] = [box.x - origin.x + 30, box.y - origin.y + 30];
  await drag(page, canvas, start, [start[0] - 120, start[1] - 80]);
  const after = await settled(page);
  expect(after.x).toBeLessThan(before.x - 60);
  expect(after.y).toBeLessThan(before.y - 40);
  await expect(page).toHaveURL(/\/tree$/);
});

test('zoomer et dézoomer avec les boutons, dans les limites', async ({ page }) => {
  await openTree(page);
  const before = await settled(page);
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
  await page.waitForTimeout(50);
  expect((await settled(page)).k).toBeGreaterThan(before.k);
  const zoomOut = page.getByRole('button', { name: 'Dézoomer', exact: true });
  for (let i = 0; i < 12; i += 1) {
    await zoomOut.click();
    await settled(page);
  }
  const far = await settled(page);
  expect(far.k).toBeLessThan(before.k);
  expect(far.k).toBeGreaterThan(0.05);
});

test('pincer à deux doigts zoome autour des doigts', async ({ page }) => {
  const canvas = await openTree(page);
  const before = await camera(page);
  await canvas.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const touch = (id: number, x: number) => ({
      pointerId: id,
      pointerType: 'touch',
      bubbles: true,
      clientX: x,
      clientY: cy,
    });
    el.dispatchEvent(new PointerEvent('pointerdown', touch(1, cx - 40)));
    el.dispatchEvent(new PointerEvent('pointerdown', touch(2, cx + 40)));
    for (let i = 1; i <= 10; i += 1) {
      el.dispatchEvent(new PointerEvent('pointermove', touch(1, cx - 40 - i * 8)));
      el.dispatchEvent(new PointerEvent('pointermove', touch(2, cx + 40 + i * 8)));
    }
    el.dispatchEvent(new PointerEvent('pointerup', touch(1, cx - 120)));
    el.dispatchEvent(new PointerEvent('pointerup', touch(2, cx + 120)));
  });
  const after = await settled(page);
  expect(after.k / before.k).toBeGreaterThan(1.5);
});

test('« Me retrouver » ramène ma bulle à l’écran', async ({ page }) => {
  const canvas = await openTree(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  for (let i = 0; i < 4; i += 1) await drag(page, canvas, [300, 300], [20, 20]);
  await settled(page);
  await expect(me).not.toBeInViewport();
  await page.getByRole('button', { name: 'Me retrouver' }).click();
  await settled(page);
  await expect(me).toBeInViewport();
});

test('au clavier, la caméra suit la bulle qui prend le focus', async ({ page }) => {
  await openTree(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  await me.focus();
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowUp');
  await page.keyboard.press('End');
  await settled(page);
  await expect(page.locator(':focus')).toBeInViewport();
});

test('sur grand écran, un clic sur la mini-carte y déplace la caméra', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'mini-carte réservée aux grands écrans');
  await openTree(page);
  const minimap = page.locator('[data-minimap]');
  await expect(minimap).toBeVisible();
  const before = await camera(page);
  const box = await minimap.boundingBox();
  if (!box) throw new Error('mini-carte introuvable');
  await page.mouse.click(box.x + box.width - 4, box.y + box.height - 4);
  const after = await settled(page);
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(100);
});
