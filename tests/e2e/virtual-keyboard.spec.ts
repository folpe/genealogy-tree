import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Clavier virtuel (plan phase 5, lot 7) : un champ en cours de saisie reste au-dessus du
// clavier, dans le dialogue d'ajout, la feuille de la fiche et la recherche. Chromium
// émulé n'affiche pas de clavier : on reproduit ce qu'il fait à la vue visible, qui
// rétrécit par le bas sans toucher à la mise en page.

const KEYBOARD_PX = 320;

test.skip(({ isMobile }) => !isMobile, 'le clavier virtuel ne concerne que le téléphone');

async function showKeyboard(page: Page, keyboardPx = KEYBOARD_PX) {
  await page.evaluate((keyboard) => {
    const viewport = window.visualViewport;
    if (!viewport) throw new Error('visualViewport absent');
    Object.defineProperty(viewport, 'height', {
      configurable: true,
      get: () => window.innerHeight - keyboard,
    });
    viewport.dispatchEvent(new Event('resize'));
  }, keyboardPx);
}

async function hideKeyboard(page: Page) {
  await page.evaluate(() => {
    const viewport = window.visualViewport;
    if (!viewport) throw new Error('visualViewport absent');
    Reflect.deleteProperty(viewport, 'height');
    viewport.dispatchEvent(new Event('resize'));
  });
}

/** Le bas de l'élément, en px depuis le haut de l'écran. */
async function bottomOf(target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Élément hors de l’écran');
  return box.y + box.height;
}

/** Le haut du clavier, en px depuis le haut de l'écran ; on tolère le sous-pixel. */
const keyboardTop = (page: Page, keyboardPx = KEYBOARD_PX) =>
  page.evaluate((k) => window.innerHeight - k, keyboardPx);

test('le dialogue d’ajout remonte au-dessus du clavier, puis redescend', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne?ajouter=conjoint');
  const dialog = page.getByRole('dialog', { name: 'Ajouter un conjoint à Anne' });
  const firstName = dialog.getByLabel('Prénom');
  await firstName.focus();
  const screenBottom = await page.evaluate(() => window.innerHeight);
  await expect.poll(() => bottomOf(dialog)).toBeCloseTo(screenBottom, 0);

  await showKeyboard(page);
  const top = await keyboardTop(page);
  await expect.poll(() => bottomOf(dialog)).toBeCloseTo(top, 0);
  await expect.poll(() => bottomOf(firstName)).toBeLessThanOrEqual(top + 1);

  // Un champ plus bas dans le formulaire est ramené dans la zone visible du dialogue.
  const place = dialog.getByLabel('Lieu de naissance');
  await hideKeyboard(page);
  await place.focus();
  await showKeyboard(page);
  await expect.poll(() => bottomOf(place)).toBeLessThanOrEqual(top + 1);
  await expect(place).toBeInViewport();

  await hideKeyboard(page);
  await expect.poll(() => bottomOf(dialog)).toBeCloseTo(screenBottom, 0);
});

test('la modification sur place dans la feuille reste au-dessus du clavier', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/tree?fiche=anne');
  const sheet = page.getByRole('dialog', { name: /Anne Marchand/ });
  await sheet.getByRole('button', { name: /^Réside à/ }).click();
  const input = sheet.getByRole('textbox', { name: 'Réside à' });
  await expect(input).toBeFocused();
  await showKeyboard(page);
  const top = await keyboardTop(page);
  await expect.poll(() => bottomOf(sheet)).toBeCloseTo(top, 0);
  await expect.poll(() => bottomOf(input)).toBeLessThanOrEqual(top + 1);
});

test('sur la page de la fiche, le champ modifié remonte au-dessus du clavier', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne');
  await page.getByRole('button', { name: /^Réside à/ }).click();
  const input = page.getByRole('textbox', { name: 'Réside à' });
  await expect(input).toBeFocused();
  await showKeyboard(page);
  const top = await keyboardTop(page);
  await expect.poll(() => bottomOf(input)).toBeLessThanOrEqual(top + 1);
});

test('la recherche raccourcit sa liste au-dessus du clavier', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await expect(page.getByRole('tree')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  await dialog.getByRole('combobox').fill('a');
  await expect(dialog.getByRole('option').first()).toBeVisible();
  // Un grand clavier, barre de suggestions comprise : la liste ne tient plus en entier.
  const tall = 560;
  await showKeyboard(page, tall);
  const top = await keyboardTop(page, tall);
  await expect.poll(() => bottomOf(dialog)).toBeLessThanOrEqual(top + 1);
  await expect(dialog.getByRole('combobox')).toBeInViewport();
});
