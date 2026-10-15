import type { Page } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Critère d'acceptation de la phase 5 : focus visible partout. Au clavier, chaque arrêt
// de Tab doit se voir : un contour, ou un anneau (box-shadow) posé par le focus.

const MAX_STOPS = 40;

/** Parcourt la page à Tab et rend les arrêts dont le focus ne se voit pas. */
async function invisibleFocusStops(page: Page): Promise<string[]> {
  const invisible: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < MAX_STOPS; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return undefined;
      const style = getComputedStyle(element);
      const outlined = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
      const ringed = style.boxShadow !== 'none' && element.matches(':focus-visible');
      // Une case à cocher, un lien de bulle : le contour peut être porté par le parent
      // qui l'habille (has-[:focus-visible]) ou par un enfant (group-focus-visible).
      const parent = element.parentElement ? getComputedStyle(element.parentElement) : undefined;
      const parentOutlined =
        parent !== undefined &&
        parent.outlineStyle !== 'none' &&
        Number.parseFloat(parent.outlineWidth) > 0;
      const childOutlined = [...element.querySelectorAll<HTMLElement>('*')].some((child) => {
        const s = getComputedStyle(child);
        return s.outlineStyle !== 'none' && Number.parseFloat(s.outlineWidth) > 0;
      });
      const name = `${element.tagName.toLowerCase()} « ${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 40)} »`;
      return { name, visible: outlined || ringed || parentOutlined || childOutlined };
    });
    if (!stop) continue;
    if (seen.has(stop.name)) break;
    seen.add(stop.name);
    if (!stop.visible) invisible.push(stop.name);
  }
  return invisible;
}

test('connexion : chaque arrêt du clavier se voit', async ({ page }) => {
  await page.goto('/login');
  expect(await invisibleFocusStops(page)).toEqual([]);
});

test('arbre et fiche : chaque arrêt du clavier se voit', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Clavier : sur ordinateur.');
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  expect(await invisibleFocusStops(page)).toEqual([]);
  await page.goto('/people/luc');
  expect(await invisibleFocusStops(page)).toEqual([]);
});
