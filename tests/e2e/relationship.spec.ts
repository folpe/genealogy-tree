import type { TestInfo } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// « Notre lien » (plan phase 5, lot 6) : depuis la fiche, la phrase, les étapes et les
// ancêtres communs ; dans l'arbre, le chemin allumé et le reste estompé.

const onDesktop = (info: TestInfo) => info.project.name !== 'mobile';

test('Hugo voit son lien avec Isabelle, éclairé dans l’arbre', async ({ page }, info) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/tree?view=all&fiche=isabelle');
  await page.getByRole('button', { name: 'Notre lien' }).click();
  const card = page.getByRole('region', { name: 'Notre lien' });
  await expect(card).toContainText('Isabelle est la cousine germaine de ton père.');
  await expect(card.getByRole('listitem')).toHaveText(['Toi', 'Luc', 'Paul', 'Marie', 'Isabelle']);
  await expect(card).toContainText('Henri et Louise');
  await settled(page);

  const tree = page.locator('[role="tree"]');
  await expect(tree.locator('[data-on-path="true"]')).toHaveCount(5);
  await expect(tree.locator('[aria-label^="Sophie Marchand"]')).toHaveAttribute(
    'data-on-path',
    'false',
  );
  if (onDesktop(info)) {
    await expect(page.getByRole('treeitem', { name: /^Paul Marchand/ })).toBeInViewport();
  }

  await card.getByRole('button', { name: 'Fermer le lien' }).click();
  await expect(card).toHaveCount(0);
  await expect(tree.locator('[data-on-path]')).toHaveCount(0);
});
