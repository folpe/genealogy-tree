import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Recherche ⌘K (plan phase 5, lot 5) : accents et noms de naissance, lien de parenté
// en accent, « Récemment consultés », ouverture de la fiche.

test('⌘K trouve par le nom de naissance, sans accents, et ouvre la fiche', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  // L'arbre chargé répond lui-même à la recherche ; avant, la recherche navigue.
  await expect(page.getByRole('tree')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  const input = dialog.getByRole('combobox');
  await input.fill('roux');
  const jeanne = dialog.getByRole('option', { name: /Jeanne Marchand/ });
  await expect(jeanne).toContainText('née Roux');
  await expect(jeanne).toContainText('ta grand-mère');
  await input.press('Enter');
  // Comme un tap sur sa bulle : la fiche s'ouvre dans l'arbre, la caméra va à elle.
  await expect(page).toHaveURL(/\/tree\?fiche=jeanne$/);
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Jeanne Marchand', exact: true }),
  ).toBeVisible();

  // Sur mobile, la feuille de la fiche est modale : on rouvre au raccourci.
  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog.getByRole('group', { name: 'Récemment consultés' })).toContainText('Jeanne');
  await input.fill('emile');
  await expect(dialog.getByRole('option', { name: /Émile Roux/ })).toBeVisible();
  await input.fill('zzzz');
  await expect(dialog).toContainText('Personne de ce nom');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('⌘K hors de l’arbre, puis retour de la fiche complète : centré sur la personne', async ({
  page,
}, info) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/ancestors');
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox').fill('isabelle');
  await expect(page.getByRole('option', { name: /Isabelle/ })).toBeVisible();
  await page.getByRole('combobox').press('Enter');
  // Isabelle n'est pas dans le sablier de Hugo : toute la famille, fiche ouverte.
  await expect(page).toHaveURL(/\/tree\?view=all&fiche=isabelle$/);
  await settled(page);
  const isabelle = page.locator('[role="treeitem"][aria-label^="Isabelle"]');
  if (info.project.name !== 'mobile') await expect(isabelle).toBeInViewport();

  await page.getByRole('link', { name: 'Fiche complète' }).click();
  await expect(page).toHaveURL(/\/people\/isabelle$/);
  await page.getByRole('link', { name: 'Retour à l’arbre' }).click();
  // Retour : centré sur Isabelle, cerclée, fiche refermée pour voir la lignée.
  await expect(page).toHaveURL(/[?&]focus=isabelle/);
  await settled(page);
  await expect(isabelle).toBeInViewport();
  await expect(isabelle).toHaveAttribute('aria-selected', 'true');
});
