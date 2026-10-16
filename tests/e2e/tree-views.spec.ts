import type { Page } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Vues de l'arbre (plan phase 4, lot 6) : toute la famille, descendants, sablier,
// unions passées. Tout passe par l'URL, rendue par le serveur. La personne au centre
// et les unions passées sont dans les réglages (feuille au doigt, popover à la souris).

const HUGO = 'hugo@famille.test';

const settingsButton = (page: Page) => page.getByRole('button', { name: /^Réglages de l’arbre/ });

/** Ouvre les réglages de l'arbre : feuille sur le téléphone, popover sur ordinateur. */
async function openSettings(page: Page) {
  await settingsButton(page).click();
  const panel = page.getByRole('dialog', { name: 'Réglages de l’arbre' });
  await expect(panel).toBeVisible();
  return panel;
}

test('Hugo s’ouvre sur son sablier ; toute la famille et le retour du navigateur', async ({
  page,
}) => {
  await signIn(page, HUGO);
  const tom = page.getByRole('treeitem', { name: /^Tom/ });
  // Par défaut, sa famille : Hugo n'est pas en couple, c'est son sablier.
  await expect(page.getByRole('link', { name: 'Sablier' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Notre famille' })).toHaveCount(0);
  // Centré sur lui-même, unions passées masquées : rien ne s'écarte du départ.
  await expect(settingsButton(page)).toHaveAccessibleName('Réglages de l’arbre');
  const panel = await openSettings(page);
  await expect(panel.getByText('Centré sur')).toContainText('Hugo Marchand');
  await expect(panel.getByRole('link', { name: 'Revenir à moi' })).toHaveCount(0);
  // Échap ferme les réglages et rend le focus au bouton.
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(settingsButton(page)).toBeFocused();
  await expect(tom).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: /^Henri Marchand/ })).toHaveCount(1);

  await page.getByRole('link', { name: 'Toute la famille' }).click();
  await expect(page).toHaveURL(/\/tree\?view=all$/);
  await expect(tom).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(tom).toHaveCount(0);
});

test('Luc, en couple, s’ouvre sur notre famille : les deux lignées', async ({ page }) => {
  await signIn(page, 'luc@famille.test');
  await expect(page.getByRole('link', { name: 'Notre famille' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('treeitem', { name: /^Bernard/ })).toHaveCount(1);
  await expect(page.getByRole('treeitem', { name: /^Paul Marchand/ })).toHaveCount(1);
  await expect(page.getByRole('treeitem', { name: /^Tom/ })).toHaveCount(0);
});

test('depuis une fiche, ses descendants ; puis revenir à moi', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/people/luc');
  await page.getByRole('link', { name: 'Ses descendants' }).click();
  await expect(page).toHaveURL(/\/tree\?p=luc&view=descendants$/);
  // Un autre centre que soi : la pastille d'accent le dit sur le bouton.
  await expect(settingsButton(page)).toHaveAccessibleName('Réglages de l’arbre, modifiés');
  // La caméra part de Luc, pas d'une position retenue dans une autre vue.
  await settled(page);
  await expect(page.getByRole('treeitem', { name: /^Luc Marchand/ })).toBeInViewport();
  await expect(page.getByRole('treeitem', { name: /^Henri Marchand/ })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: /c’est toi$/ })).toHaveCount(1);

  const panel = await openSettings(page);
  await expect(panel.getByText('Centré sur')).toContainText('Luc Marchand');
  await panel.getByRole('link', { name: 'Revenir à moi' }).click();
  // Les réglages se ferment : on voit l'arbre se redessiner autour de soi.
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/tree\?view=descendants$/);
  await expect(settingsButton(page)).toHaveAccessibleName('Réglages de l’arbre');
  await expect(page.getByRole('treeitem', { name: /c’est toi$/ })).toBeInViewport();
  await expect((await openSettings(page)).getByText('Centré sur')).toContainText('Hugo Marchand');
});

test('l’interrupteur montre puis masque les unions passées', async ({ page }) => {
  await signIn(page, HUGO);
  await page.goto('/tree?view=all');
  const claire = page.getByRole('treeitem', { name: /^Claire/ });
  await expect(claire).toHaveCount(0);
  const panel = await openSettings(page);
  // Toute la famille n'a pas de personne au centre.
  await expect(panel.getByText('Centré sur')).toHaveCount(0);
  const past = panel.getByRole('switch', { name: 'Unions passées' });
  await expect(past).toHaveAttribute('aria-checked', 'false');

  await past.click();
  await expect(page).toHaveURL(/\/tree\?view=all&past=1$/);
  await expect(past).toHaveAttribute('aria-checked', 'true');
  // La feuille du téléphone est modale : l'arbre se lit une fois les réglages fermés.
  await page.keyboard.press('Escape');
  await expect(claire).toHaveCount(1);
  await expect(settingsButton(page)).toHaveAccessibleName('Réglages de l’arbre, modifiés');

  await (await openSettings(page)).getByRole('switch', { name: 'Unions passées' }).click();
  await expect(page).toHaveURL(/\/tree\?view=all$/);
  await page.keyboard.press('Escape');
  await expect(claire).toHaveCount(0);
});

test('Toute la famille : le tap répond aussitôt, l’arbre se dessine, puis pousse', async ({
  page,
}) => {
  await signIn(page, HUGO);
  // Serveur lent : la vue demandée met une seconde à venir.
  await page.route('**/*', async (route) => {
    const headers = route.request().headers();
    const navigation = headers['rsc'] === '1' && !headers['next-router-prefetch'];
    if (navigation) await new Promise((done) => setTimeout(done, 1000));
    await route.continue();
  });
  // L'entrée du premier affichage finie, on guette les bulles qui s'ouvrent ensuite.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.locator('[data-person][style*="opacity"]').count()).toBe(0);
  await page.evaluate(() => {
    const grew = new Set<string>();
    Reflect.set(window, 'grew', grew);
    new MutationObserver((records) => {
      for (const { target } of records) {
        if (!(target instanceof HTMLElement) || !target.dataset['person']) continue;
        if (Number(target.style.opacity || '1') < 1) grew.add(target.dataset['person']);
      }
    }).observe(document.body, { subtree: true, attributeFilter: ['style'] });
  });
  const all = page.getByRole('link', { name: 'Toute la famille' });
  await all.click();
  // Avant le serveur : la vue se montre choisie, le canevas dit qu'il dessine.
  await expect(all).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/\/tree$/);
  await expect(page.getByRole('status').filter({ hasText: 'L’arbre se dessine' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Canevas de l’arbre' })).toHaveAttribute(
    'aria-busy',
    'true',
  );

  // Le nouvel arbre arrive et pousse : ses bulles s'ouvrent, puis tout est là.
  await expect(page).toHaveURL(/\/tree\?view=all$/);
  await expect(page.getByRole('status').filter({ hasText: 'L’arbre se dessine' })).toHaveCount(0);
  const tom = page.locator('[data-person="tom"]');
  await expect(tom).toHaveCount(1);
  const grew = () => page.evaluate(() => Array.from<string>(Reflect.get(window, 'grew')));
  await expect.poll(grew).toContain('tom');
  await expect.poll(() => tom.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  await expect(page.getByRole('region', { name: 'Canevas de l’arbre' })).not.toHaveAttribute(
    'aria-busy',
  );
});
