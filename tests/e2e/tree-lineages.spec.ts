import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { askFolds, redrawn } from './folds';
import { signIn } from './outbox';

// Lignées seules (retour de Folpe, 2026-10-17), sur un petit téléphone comme sur
// ordinateur : Toute la famille s'ouvre sur les lignées directes, chaque fratrie repliée
// laisse un repère ; un pli redessine l'arbre serré, la bulle touchée reste en place.

const HUGO = 'hugo@famille.test';
const bubble = (page: Page, id: string) => page.locator(`[data-person="${id}"]`);

async function openLineages(page: Page, isMobile: boolean) {
  if (isMobile) await page.setViewportSize({ width: 360, height: 740 });
  await signIn(page, HUGO);
  await page.goto('/tree?view=all');
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await redrawn(page);
}

async function boxOf(target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Bulle absente de l’écran');
  return box;
}

/** La bulle n'a pas bougé à l'écran, au pixel près. */
async function stays(target: Locator, before: { x: number; y: number }) {
  const after = await boxOf(target);
  expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
}

test('les lignées dépliées, les fratries repliées derrière un repère', async ({
  page,
  isMobile,
}) => {
  await openLineages(page, isMobile);
  await expect(bubble(page, 'paul')).toHaveCount(1);
  await expect(bubble(page, 'bernard')).toHaveCount(1);
  await expect(bubble(page, 'marie')).toHaveCount(0);
  await expect(bubble(page, 'lea')).toHaveCount(0);
  const marker = page.getByRole('button', { name: '+2 frères et sœurs de Paul Marchand' });
  await expect(marker).toHaveAttribute('aria-expanded', 'false');
  await marker.scrollIntoViewIfNeeded();
  const box = await boxOf(marker);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('le repère déplie la fratrie ; la bulle voisine reste en place', async ({
  page,
  isMobile,
}) => {
  await openLineages(page, isMobile);
  const paul = bubble(page, 'paul');
  await paul.focus();
  await redrawn(page);
  const before = await boxOf(paul);
  await page.getByRole('button', { name: '+2 frères et sœurs de Paul Marchand' }).click();
  await expect(bubble(page, 'marie')).toHaveCount(1);
  await expect(bubble(page, 'claude')).toHaveCount(1);
  await redrawn(page);
  await stays(paul, before);
});

test('un collatéral se replie seul, avec sa famille, puis revient', async ({ page, isMobile }) => {
  await openLineages(page, isMobile);
  await page.getByRole('button', { name: '+2 frères et sœurs de Paul Marchand' }).click();
  const marie = bubble(page, 'marie');
  await expect(marie).toHaveCount(1);
  await redrawn(page);
  await marie.focus();
  await redrawn(page);
  const paul = bubble(page, 'paul');
  const before = await boxOf(paul);
  // Clic droit à la souris, appui long au doigt : le même menu.
  await marie.dispatchEvent('contextmenu', { bubbles: true });
  const menu = page.getByRole('menu', { name: /^Actions rapides, Marie/ });
  await menu.getByRole('menuitem', { name: 'Masquer cette branche' }).click();
  await expect(marie).toHaveCount(0);
  await expect(bubble(page, 'isabelle')).toHaveCount(0);
  await expect(bubble(page, 'claude')).toHaveCount(1);
  await redrawn(page);
  await stays(paul, before);
  await page.getByRole('button', { name: '+1 frère ou sœur de Paul Marchand' }).click();
  await expect(marie).toHaveCount(1);
  await expect(bubble(page, 'isabelle')).toHaveCount(1);
});

test('« Lignées seules » replie tout d’un coup, « Tout afficher » l’inverse', async ({
  page,
  isMobile,
}) => {
  await openLineages(page, isMobile);
  await askFolds(page, 'Tout afficher');
  await expect(bubble(page, 'isabelle')).toHaveCount(1);
  await expect(bubble(page, 'jade')).toHaveCount(1);
  await expect(page.locator('[data-marker]')).toHaveCount(0);
  await redrawn(page);
  await askFolds(page, 'Lignées seules');
  await expect(bubble(page, 'isabelle')).toHaveCount(0);
  await expect(bubble(page, 'jade')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '+2 frères et sœurs de Paul Marchand' }),
  ).toBeVisible();
});

test('les plis tiennent au retour d’une fiche', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLineages(page, isMobile);
  await page.getByRole('button', { name: '+2 frères et sœurs de Paul Marchand' }).click();
  await expect(bubble(page, 'marie')).toHaveCount(1);
  await redrawn(page);
  await page.goto('/people/marie');
  await page.getByRole('link', { name: 'Retour à l’arbre' }).click();
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await expect(bubble(page, 'marie')).toHaveCount(1);
  await expect(bubble(page, 'lea')).toHaveCount(0);
});
