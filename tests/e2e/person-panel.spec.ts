import type { Page, TestInfo } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Fiche en panneau (plan phase 5, lot 4) : un tap sur une bulle ouvre la fiche sans
// quitter l'arbre ; à droite sur grand écran, en feuille sur mobile. Elle vit dans
// l'URL : le retour du navigateur la ferme, un lien la rouvre.

const sheetOf = (page: Page, info: TestInfo, name: RegExp) =>
  page.getByRole(info.project.name === 'mobile' ? 'dialog' : 'complementary', { name });

test('un tap ouvre la fiche à côté de l’arbre ; on passe de fiche en fiche', async ({
  page,
}, info) => {
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  await page.getByRole('treeitem', { name: /^Luc Marchand/ }).click();
  await expect(page).toHaveURL(/[?&]fiche=luc/);
  const luc = sheetOf(page, info, /Luc Marchand/);
  await expect(luc).toContainText('Ton père');
  // L'arbre reste en place derrière (sur mobile, la feuille modale le masque aux
  // lecteurs d'écran : on le cherche dans la page, pas dans l'arbre d'accessibilité).
  await expect(page.locator('[role="treeitem"][aria-label$="c’est toi"]')).toHaveCount(1);

  await luc.getByRole('link', { name: 'Paul Marchand' }).click();
  await expect(page).toHaveURL(/[?&]fiche=paul/);
  await expect(sheetOf(page, info, /Paul Marchand/)).toContainText('Ton grand-père');

  await page.goBack();
  await expect(page).toHaveURL(/[?&]fiche=luc/);
  await sheetOf(page, info, /Luc Marchand/)
    .getByRole('button', { name: 'Fermer la fiche' })
    .click();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(sheetOf(page, info, /Luc Marchand/)).toHaveCount(0);
});

test('un lien vers une fiche ouvre l’arbre avec la fiche', async ({ page }, info) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/tree?fiche=paul');
  await expect(sheetOf(page, info, /Paul Marchand/)).toContainText('Ton grand-père');
  await expect(
    sheetOf(page, info, /Paul Marchand/).getByRole('link', { name: 'Fiche complète' }),
  ).toHaveAttribute('href', '/people/paul');
});
