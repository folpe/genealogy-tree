import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Critère d'acceptation de la phase 5 : contraste AA sur tout le texte, noms et rôles
// justes, dans les deux thèmes, sur les écrans de la phase (connexion, arbre et fiche,
// recherche). axe-core juge le rendu réel, là où globals.test.ts juge les tokens.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page) {
  // Les entrées animées finies : axe mesure les couleurs telles qu'on les lit.
  await page.waitForTimeout(1200);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    targets: v.nodes.slice(0, 5).map((n) => `${n.target.join(' ')} : ${n.failureSummary ?? ''}`),
  }));
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`thème ${scheme === 'light' ? 'clair' : 'sombre'}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    test('connexion et demande d’accès', async ({ page }) => {
      await page.goto('/login');
      expect(await audit(page)).toEqual([]);
      await page.goto('/request-access');
      expect(await audit(page)).toEqual([]);
    });

    test('arbre, fiche ouverte et recherche', async ({ page }, info) => {
      await signIn(page, 'hugo@famille.test');
      await settled(page);
      expect(await audit(page)).toEqual([]);
      await page.getByRole('treeitem', { name: /^Luc Marchand/ }).click();
      await expect(
        page.getByRole(info.project.name === 'mobile' ? 'dialog' : 'complementary', {
          name: /Luc Marchand/,
        }),
      ).toBeVisible();
      expect(await audit(page)).toEqual([]);
      await page.goto('/people/maxime');
      expect(await audit(page)).toEqual([]);
      await page.goto('/tree');
      await settled(page);
      await page.keyboard.press('ControlOrMeta+k');
      await page.getByRole('combobox').fill('marchand');
      await expect(page.getByRole('option').first()).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });
  });
}
