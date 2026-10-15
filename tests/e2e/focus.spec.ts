import type { Page } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Critère d'acceptation de la phase 5 : focus visible partout. Au clavier, chaque arrêt
// de Tab doit se voir. Différentiel : on compare l'arrêt avec et sans le focus, sur
// l'élément, son parent (qui l'habille parfois) et ses descendants (qui portent parfois
// l'anneau) ; seul un contour ou une ombre que le focus fait apparaître compte. Un
// contour transparent ne compte pas.

const MAX_STOPS = 40;

type Walk = { stops: number; invisible: string[] };

/** Parcourt la page à Tab, jusqu'au retour sur un élément déjà vu. */
async function walkFocus(page: Page): Promise<Walk> {
  const invisible: string[] = [];
  let stops = 0;
  for (let i = 0; i < MAX_STOPS; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return 'none';
      // L'identité de l'élément, pas son libellé : deux boutons peuvent se ressembler.
      if (element.dataset['focusWalked'] === '1') return 'again';
      element.dataset['focusWalked'] = '1';
      const watched = [element, element.parentElement, ...element.querySelectorAll('*')].filter(
        (node): node is Element => node instanceof Element,
      );
      const look = (node: Element) => {
        const style = getComputedStyle(node);
        const transparent = /rgba\([^)]*,\s*0\)|transparent/.test(style.outlineColor);
        const outline =
          style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0 && !transparent
            ? `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`
            : '';
        return `${outline}|${style.boxShadow}`;
      };
      const focused = watched.map(look);
      element.blur();
      const resting = watched.map(look);
      element.focus({ preventScroll: true });
      const name = `${element.tagName.toLowerCase()} « ${(element.textContent ?? '').trim().slice(0, 40)} »`;
      return { name, visible: focused.some((value, index) => value !== resting[index]) };
    });
    if (stop === 'none') continue;
    if (stop === 'again') break;
    stops += 1;
    if (!stop.visible) invisible.push(stop.name);
  }
  return { stops, invisible };
}

test('connexion : chaque arrêt du clavier se voit', async ({ page }) => {
  await page.goto('/login');
  const walk = await walkFocus(page);
  // Champ, deux boutons, lien de demande d'accès au moins.
  expect(walk.stops).toBeGreaterThanOrEqual(4);
  expect(walk.invisible).toEqual([]);
});

test('arbre et fiche : chaque arrêt du clavier se voit', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Clavier : sur ordinateur.');
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  const tree = await walkFocus(page);
  // En-tête, vues, bulle active, commandes de la caméra.
  expect(tree.stops).toBeGreaterThanOrEqual(8);
  expect(tree.invisible).toEqual([]);
  await page.goto('/people/luc');
  // La fiche arrive en flux après son squelette (loading.tsx) : on l'attend.
  await expect(page.getByRole('heading', { level: 1, name: 'Luc Marchand' })).toBeVisible();
  const sheet = await walkFocus(page);
  // Lignes modifiables, proches, actions.
  expect(sheet.stops).toBeGreaterThanOrEqual(10);
  expect(sheet.invisible).toEqual([]);
});
