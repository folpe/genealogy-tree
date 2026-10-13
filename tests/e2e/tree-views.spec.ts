import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Vues de l'arbre (plan phase 4, lot 6) : toute la famille, descendants, sablier,
// unions passées. Tout passe par l'URL, rendue par le serveur.

const HUGO = 'hugo@famille.test';

test('le sablier ne garde que la lignée, et le retour du navigateur revient à la famille', async ({
  page,
}) => {
  await signIn(page, HUGO);
  const tom = page.getByRole('treeitem', { name: /^Tom/ });
  await expect(tom).toHaveCount(1);

  await page.getByRole('link', { name: 'Sablier' }).click();
  await expect(page).toHaveURL(/\/tree\?view=hourglass$/);
  await expect(page.getByRole('link', { name: 'Sablier' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Centré sur')).toContainText('Hugo Marchand');
  await expect(tom).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: /^Henri Marchand/ })).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(tom).toHaveCount(1);
});

test('depuis une fiche, ses descendants ; puis revenir à moi', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/people/luc');
  await page.getByRole('link', { name: 'Ses descendants' }).click();
  await expect(page).toHaveURL(/\/tree\?p=luc&view=descendants$/);
  await expect(page.getByText('Centré sur')).toContainText('Luc Marchand');
  // La caméra part de Luc, pas d'une position retenue dans une autre vue.
  await settled(page);
  await expect(page.getByRole('treeitem', { name: /^Luc Marchand/ })).toBeInViewport();
  await expect(page.getByRole('treeitem', { name: /^Henri Marchand/ })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: /c’est toi$/ })).toHaveCount(1);

  await page.getByRole('link', { name: 'Revenir à moi' }).click();
  await expect(page).toHaveURL(/\/tree\?view=descendants$/);
  await expect(page.getByText('Centré sur')).toContainText('Hugo Marchand');
});

test('l’interrupteur montre puis masque les unions passées', async ({ page }) => {
  await signIn(page, HUGO);
  const claire = page.getByRole('treeitem', { name: /^Claire/ });
  await expect(claire).toHaveCount(0);
  const past = page.getByRole('switch', { name: 'Unions passées' });
  await expect(past).toHaveAttribute('aria-checked', 'false');

  await past.click();
  await expect(page).toHaveURL(/\/tree\?past=1$/);
  await expect(claire).toHaveCount(1);
  await expect(past).toHaveAttribute('aria-checked', 'true');

  await past.click();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(claire).toHaveCount(0);
});
