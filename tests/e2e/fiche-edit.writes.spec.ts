import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Modification sur place (retour de Folpe) : on touche une ligne, elle devient un
// champ, Entrée enregistre, « Annuler » revient en arrière quelques secondes.

test('Anne corrige sa résidence sur place, puis annule', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne');
  await page.getByRole('button', { name: /^Réside à/ }).click();
  const input = page.getByRole('textbox', { name: 'Réside à' });
  await expect(input).toBeFocused();
  await input.fill('Pau');
  await input.press('Enter');
  await expect(page.getByRole('button', { name: /^Réside à : Pau/ })).toBeVisible();
  await page.getByRole('button', { name: 'Annuler la modification' }).click();
  await expect(page.getByRole('button', { name: /^Réside à : Bordeaux/ })).toBeVisible();
});

test('une note s’écrit sur plusieurs lignes et s’enregistre en touchant ailleurs', async ({
  page,
}, info) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/tom');
  await page.getByRole('button', { name: /^Note/ }).click();
  const note = page.getByRole('textbox', { name: 'Note' });
  await expect(note).toBeFocused();
  // La base est partagée entre projets : chaque projet écrit sa propre note.
  await note.fill(`Adopté par Anne.\nNote de ${info.project.name}.`);
  // Entrée va à la ligne sans enregistrer ; toucher le titre enregistre.
  await note.press('Enter');
  await expect(note).toBeVisible();
  await page.getByRole('heading', { level: 1 }).click({ position: { x: 1, y: 1 } });
  await expect(page.getByRole('button', { name: /^Note : Adopté par Anne\./ })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Note de ${info.project.name}.`)).toBeVisible();
});

test('le nom se corrige en touchant le titre ; Échap abandonne', async ({ page }, info) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/tom');
  const heading = page.getByRole('heading', { level: 1 });
  // La base est partagée entre projets : on part du prénom actuel, on écrit le sien.
  const before = (await heading.textContent()) ?? '';
  const renamed = `Tom-${info.project.name}`;
  await heading.getByRole('button').click();
  await page.getByRole('textbox', { name: 'Prénom' }).fill(renamed);
  await page.getByRole('textbox', { name: 'Prénom' }).press('Escape');
  await expect(heading).toHaveText(before);
  await heading.getByRole('button').click();
  await page.getByRole('textbox', { name: 'Prénom' }).fill(renamed);
  await page.getByRole('textbox', { name: 'Prénom' }).press('Enter');
  await expect(heading).toContainText(renamed);
});

test('un fait sourcé dit pourquoi il ne se change pas ; ailleurs, rien à toucher', async ({
  page,
}) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/henri');
  await page.getByRole('button', { name: /^Décès/ }).click();
  // Une année seule : la ligne s'ouvre en date approximative.
  await page.getByLabel('Date du décès : année').fill('1980');
  await page.getByLabel('Date du décès : année').press('Enter');
  // (Next a son propre annonceur de navigation, lui aussi en role="alert".)
  await expect(page.getByRole('alert').filter({ hasText: 'sourcé' })).toBeVisible();

  await page.goto('/people/bernard');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bernard');
  await expect(page.getByRole('button', { name: /^Naissance/ })).toHaveCount(0);
});

test('cocher « décédé » garde le formulaire ouvert, la date suit, puis on annule', async ({
  page,
}) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/tom');
  await page.getByRole('button', { name: /^Décès : En vie/ }).click();
  await page.getByText('Décédé ou décédée').click();
  // Toucher la case, à l'intérieur du formulaire, ne le ferme pas.
  // Le calendrier du téléphone ; la date s'affiche en lettres.
  const date = page.getByLabel('Date du décès', { exact: true });
  await expect(date).toBeVisible();
  await date.fill('2024-05-09');
  await expect(page.getByText('9 mai 2024', { exact: true })).toBeVisible();
  await date.press('Enter');
  await expect(page.getByRole('button', { name: /^Décès : 9 mai 2024/ })).toBeVisible();
  await page.getByRole('button', { name: 'Annuler la modification' }).click();
  await expect(page.getByRole('button', { name: /^Décès : En vie/ })).toBeVisible();
});

test('une date approximative se saisit avec sa précision et se relit sans perte', async ({
  page,
}) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/tom');
  await page.getByRole('button', { name: /^Décès : En vie/ }).click();
  await page.getByText('Date approximative').click();
  await page.getByLabel('Date du décès : précision').selectOption('vers');
  // Choisir la précision n'est pas encore une date : « décédé » reste décoché.
  await expect(page.getByLabel('Décédé ou décédée')).not.toBeChecked();
  // Saisir une année coche « décédé » : ce qu'on écrit se voit.
  await page.getByLabel('Date du décès : année').fill('2020');
  await expect(page.getByLabel('Décédé ou décédée')).toBeChecked();
  await page.getByLabel('Date du décès : année').press('Enter');
  await expect(page.getByRole('button', { name: /^Décès : vers 2020/ })).toBeVisible();
  // Rouverte, la ligne retrouve la case cochée et la précision.
  await page.getByRole('button', { name: /^Décès : vers 2020/ }).click();
  await expect(page.getByLabel('Date approximative')).toBeChecked();
  await expect(page.getByLabel('Date du décès : précision')).toHaveValue('vers');
  await page.getByLabel('Décédé ou décédée').uncheck();
  await page.getByLabel('Date du décès : année').press('Enter');
  await expect(page.getByRole('button', { name: /^Décès : En vie/ })).toBeVisible();
});

test('toucher ailleurs dans la page enregistre, comme quitter le champ', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne');
  await page.getByRole('button', { name: /^Réside à/ }).click();
  await page.getByRole('textbox', { name: 'Réside à' }).fill('Biarritz');
  await page.getByRole('heading', { level: 1 }).click();
  await expect(page.getByRole('button', { name: /^Réside à : Biarritz/ })).toBeVisible();
  await page.getByRole('button', { name: 'Annuler la modification' }).click();
  await expect(page.getByRole('button', { name: /^Réside à : Bordeaux/ })).toBeVisible();
});
