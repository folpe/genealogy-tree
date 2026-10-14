import type { Locator, Page, TestInfo } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Actions rapides d'une bulle (plan phase 5, lot 7) : appui long au doigt, clic droit
// à la souris, Maj + F10 au clavier. Les ajouts suivent la policy ; rien n'est écrit
// tant que le dialogue n'est pas envoyé.

/**
 * Par `data-person` : le menu est modal, l'arbre derrière lui sort de l'arbre
 * d'accessibilité, un locator par rôle ne le retrouverait plus.
 */
const bubble = (page: Page, id: string) => page.locator(`[data-person="${id}"]`);

async function openTree(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await settled(page);
}

/** Le geste de l'appareil : appui long au doigt sur mobile, clic droit sur ordinateur. */
async function askQuick(target: Locator, info: TestInfo) {
  if (info.project.name !== 'mobile') {
    await target.click({ button: 'right' });
    return;
  }
  const box = await target.boundingBox();
  if (!box) throw new Error('Bulle hors de l’écran');
  const at = { clientX: box.x + box.width / 2, clientY: box.y + 30 };
  const finger = { ...at, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
  await target.dispatchEvent('pointerdown', finger);
  await expect(target.page().getByRole('menu')).toBeVisible();
  await target.dispatchEvent('pointerup', finger);
  // Le doigt levé émet un clic : il ne doit pas ouvrir la fiche.
  await target.dispatchEvent('click', at);
}

test('dans sa lignée : le geste propose les ajouts, puis ouvre le dialogue réglé', async ({
  page,
}, info) => {
  await signIn(page, 'hugo@famille.test');
  await openTree(page, '/tree');
  await askQuick(bubble(page, 'luc'), info);
  const menu = page.getByRole('menu', { name: 'Actions rapides, Luc Marchand' });
  await expect(menu.getByRole('menuitem')).toHaveText([
    '+ Enfant',
    '+ Conjoint',
    'Ouvrir la fiche',
    'Centrer l’arbre ici',
    'Ses ancêtres',
  ]);
  await expect(page).not.toHaveURL(/fiche=/);
  await menu.getByRole('menuitem', { name: '+ Conjoint' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ajouter un conjoint à Luc' });
  await expect(dialog.getByLabel('Prénom')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/fiche=/);
});

test('hors de sa lignée : pas d’ajout, les chemins de la fiche restent', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await openTree(page, '/tree?view=all');
  // Bernard n'est pas forcément à l'écran : l'événement suffit à demander le menu.
  await bubble(page, 'bernard').dispatchEvent('contextmenu', { bubbles: true });
  const menu = page.getByRole('menu', { name: /^Actions rapides, Bernard/ });
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Ouvrir la fiche',
    'Centrer l’arbre ici',
    'Ses ancêtres',
  ]);
  await menu.getByRole('menuitem', { name: 'Ouvrir la fiche' }).click();
  await expect(page).toHaveURL(/[?&]fiche=bernard/);
});

test('au clavier : Maj + F10 sur la bulle, Échap rend le focus à la bulle', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'mobile', 'Clavier : sur ordinateur.');
  await signIn(page, 'hugo@famille.test');
  await openTree(page, '/tree');
  const me = page.locator('[role="treeitem"][aria-label$="c’est toi"]');
  await me.focus();
  await expect(me).toHaveAttribute('aria-keyshortcuts', 'Shift+F10');
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu', { name: /^Actions rapides, Hugo/ });
  await expect(menu).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: '+ Enfant' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(me).toBeFocused();
});
