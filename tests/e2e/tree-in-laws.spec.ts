import { settled } from './camera';
import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Familles par zones (choix de Folpe, 2026-10-16) : dans Toute la famille, la famille
// d'origine d'un conjoint se replie derrière lui, « + sa famille » la déplie.

const HUGO = 'hugo@famille.test';

test('« + sa famille » déplie la famille d’un conjoint, « − sa famille » la replie', async ({
  page,
}) => {
  await signIn(page, HUGO);
  await page.goto('/tree?view=all');
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  const gaston = page.getByRole('treeitem', { name: /^Gaston Lefèvre/ });
  // Jacques est entré dans la famille par Marie : ses parents restent repliés derrière lui.
  await expect(gaston).toHaveCount(0);
  await page.getByRole('treeitem', { name: /^Jacques Lefèvre/ }).focus();
  await settled(page);

  const show = page.getByRole('link', {
    name: 'Montrer la famille de Jacques Lefèvre, 2 personnes',
  });
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await show.click();
  await expect(page).toHaveURL(/\/tree\?view=all&famille=jacques&focus=jacques$/);
  await expect(gaston).toHaveCount(1);
  await expect(page.getByRole('treeitem', { name: /^Yvonne Lefèvre/ })).toHaveCount(1);

  await settled(page);
  const hide = page.getByRole('link', { name: 'Replier la famille de Jacques Lefèvre' });
  await expect(hide).toHaveAttribute('aria-expanded', 'true');
  await hide.click();
  await expect(page).toHaveURL(/\/tree\?view=all&focus=jacques$/);
  await expect(gaston).toHaveCount(0);
});

test('une fiche demandée dans une famille repliée l’ouvre', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/tree?view=all&fiche=gaston');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Gaston Lefèvre', exact: true }),
  ).toBeVisible();
  // Sa bulle est dessinée (sur mobile, la feuille rend l'arbre inerte derrière elle).
  await expect(page.locator('[data-person="gaston"]')).toHaveCount(1);
});

test('les parents d’un conjoint sont la famille de sang de ses enfants', async ({ page }) => {
  // Pour Isabelle, fille de Jacques, Gaston est un grand-père : jamais replié.
  await signIn(page, E2E_ISABELLE_EMAIL);
  await page.goto('/tree?view=all');
  await expect(page.getByRole('treeitem', { name: /^Gaston Lefèvre/ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /famille de Jacques/ })).toHaveCount(0);
});
