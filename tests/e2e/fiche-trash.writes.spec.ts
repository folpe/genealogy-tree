import { E2E_ADMIN_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Corbeille (choix de Folpe) : la fiche quitte l'arbre sans être effacée ; un admin la
// restaure, liens compris. Le test restaure à la fin : la base est partagée.

test('Anne met Tom à la corbeille, l’admin le restaure', async ({ browser }) => {
  const anne = await browser.newPage();
  await signIn(anne, 'anne@famille.test');
  await anne.goto('/people/tom');
  await anne.getByRole('button', { name: 'Mettre à la corbeille' }).click();
  const confirm = anne.getByRole('alertdialog', { name: /corbeille/ });
  await expect(confirm).toContainText('un admin peut la restaurer');
  await confirm.getByRole('button', { name: 'Mettre à la corbeille' }).click();
  await expect(anne).toHaveURL(/\/tree/);
  await anne.goto('/tree?view=all');
  await expect(anne.locator('[role="treeitem"][aria-label^="Tom"]')).toHaveCount(0);

  const admin = await browser.newPage();
  await signIn(admin, E2E_ADMIN_EMAIL);
  await admin.goto('/admin');
  const trash = admin.getByRole('region', { name: 'Corbeille' });
  await expect(trash).toContainText('Tom');
  await trash.getByRole('button', { name: /^Restaurer Tom/ }).click();
  await expect(trash).not.toContainText('Tom');

  await anne.goto('/tree?view=all');
  await expect(anne.locator('[role="treeitem"][aria-label^="Tom"]')).toHaveCount(1);
});

test('une fiche avec des enfants ne propose pas la corbeille à un membre', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/people/paul');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Paul');
  await expect(page.getByRole('button', { name: 'Mettre à la corbeille' })).toHaveCount(0);
});
