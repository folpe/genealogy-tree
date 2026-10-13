import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Recherche ⌘K (plan phase 5, lot 5) : accents et noms de naissance, lien de parenté
// en accent, « Récemment consultés », ouverture de la fiche.

test('⌘K trouve par le nom de naissance, sans accents, et ouvre la fiche', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  const input = dialog.getByRole('combobox');
  await input.fill('roux');
  const jeanne = dialog.getByRole('option', { name: /Jeanne Marchand/ });
  await expect(jeanne).toContainText('née Roux');
  await expect(jeanne).toContainText('ta grand-mère');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/people\/jeanne$/);
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Trouver quelqu’un' }).click();
  await expect(dialog.getByRole('group', { name: 'Récemment consultés' })).toContainText('Jeanne');
  await input.fill('emile');
  await expect(dialog.getByRole('option', { name: /Émile Roux/ })).toBeVisible();
  await input.fill('zzzz');
  await expect(dialog).toContainText('Personne de ce nom');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
