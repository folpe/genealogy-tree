import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Ajout d'un proche (plan phase 6, lot 2, version minimale) : depuis une fiche de sa
// lignée, ou depuis une case vide de l'éventail. Hors de sa lignée, rien à ajouter.

test('Anne ajoute un enfant depuis sa fiche, puis l’ouvre', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne');
  await page.getByRole('button', { name: '+ Enfant' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ajouter un enfant à Anne' });
  await dialog.getByLabel('Prénom').fill('Nina');
  await dialog.getByLabel('Nom', { exact: true }).fill('Marchand');
  // Les pastilles de genre sont des libellés : on touche le libellé, comme au doigt.
  await dialog.getByText('Femme', { exact: true }).click();
  await expect(dialog.getByRole('radio', { name: 'Femme' })).toBeChecked();
  // Une date ancienne ou incertaine : la case, la précision, l'année, en lettres dessous.
  await dialog.getByLabel('Date approximative').check();
  await dialog.getByLabel('Naissance : précision').selectOption('vers');
  await dialog.getByLabel('Naissance : année').fill('1995');
  await expect(dialog.getByText('vers 1995', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Ajouter Nina' }).click();
  const done = page.getByRole('dialog', { name: 'C’est ajouté' });
  await expect(done.getByRole('status')).toHaveText('Fiche de Nina créée.');
  await done.getByRole('link', { name: 'Ouvrir sa fiche' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nina Marchand');
  await expect(page.getByRole('link', { name: /^Anne Marchand/ })).toBeVisible();
});

test('une date impossible est signalée pendant la saisie, puis refusée', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne?ajouter=conjoint');
  const dialog = page.getByRole('dialog', { name: 'Ajouter un conjoint à Anne' });
  await dialog.getByLabel('Prénom').fill('Paul');
  await dialog.getByLabel('Nom', { exact: true }).fill('Test');
  await dialog.getByLabel('Date approximative').check();
  await dialog.getByLabel('Naissance : précision').selectOption('entre');
  await dialog.getByLabel('Naissance : de').fill('1990');
  await dialog.getByLabel('Naissance : à').fill('1980');
  const why = 'La première année doit précéder la seconde';
  await expect(dialog.getByText(why)).toBeVisible();
  await dialog.getByRole('button', { name: 'Ajouter Paul' }).click();
  await expect(dialog.getByRole('alert')).toContainText(why);
});

test('depuis une case vide de l’éventail, le dialogue s’ouvre réglé', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/ancestors');
  await page
    .getByRole('button', { name: /^Ton arrière-grand-père, à découvrir : le père de Bernard/ })
    .click();
  await page
    .getByRole('complementary', { name: 'Ancêtre choisi' })
    .getByRole('link', { name: 'Ajouter' })
    .click();
  await expect(page).toHaveURL(/\/people\/bernard\?ajouter=pere$/);
  const dialog = page.getByRole('dialog', { name: 'Ajouter un parent à Bernard' });
  await expect(dialog.getByRole('radio', { name: 'Homme' })).toBeChecked();
  await expect(dialog.getByLabel('Nom', { exact: true })).toHaveValue('Blanc');
});

test('hors de sa lignée, la fiche ne propose pas d’ajout', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/bernard');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bernard');
  await expect(page.getByRole('button', { name: '+ Parent' })).toHaveCount(0);
});
