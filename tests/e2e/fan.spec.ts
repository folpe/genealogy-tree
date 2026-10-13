import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Ancêtres en éventail (maquette 03) : quatre générations derrière le lecteur, les
// cases vides qui attendent quelqu'un, le panneau « Tes racines ».

const HUGO = 'hugo@famille.test';

test('Hugo voit ses ancêtres en éventail et ses racines', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/ancestors');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Quatre générations derrière toi',
  );
  await expect(page.getByText('10 ancêtres connus sur 30')).toBeVisible();
  await expect(page.getByText('Henri, né en 1902')).toBeVisible();

  await page.getByRole('button', { name: 'Ton grand-père, Paul Marchand' }).click();
  const panel = page.getByRole('complementary', { name: 'Ancêtre choisi' });
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Paul Marchand');
  await expect(panel.getByText('Branche paternelle')).toBeVisible();
  await panel.getByRole('link', { name: 'Voir la fiche' }).click();
  await expect(page).toHaveURL(/\/people\/paul$/);
});

test('une case vide dit qui manque, et l’éventail se recentre sur un ancêtre', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/ancestors');
  await page
    .getByRole('button', { name: /^Ton arrière-grand-père, à découvrir/ })
    .first()
    .click();
  const panel = page.getByRole('complementary', { name: 'Ancêtre choisi' });
  await expect(panel).toContainText('À découvrir');
  await expect(panel).toContainText('Le père de Bernard');

  await page.getByRole('button', { name: 'Ton père, Luc Marchand' }).click();
  await panel.getByRole('link', { name: 'Ses ancêtres' }).click();
  await expect(page).toHaveURL(/\/ancestors\?p=luc$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Quatre générations derrière Luc',
  );
  await page.getByRole('link', { name: 'Une génération de plus' }).click();
  await expect(page).toHaveURL(/\/ancestors\?p=luc&g=5$/);
});

test('depuis une fiche, ses ancêtres', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/people/sophie');
  await page.getByRole('link', { name: 'Ses ancêtres' }).click();
  await expect(page).toHaveURL(/\/ancestors\?p=sophie$/);
  await expect(
    page.getByRole('button', { name: 'Le père de Sophie, Bernard Blanc' }),
  ).toBeVisible();
});
