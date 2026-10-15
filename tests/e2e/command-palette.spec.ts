import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Recherche ⌘K (plan phase 5, lot 5) : accents et noms de naissance, lien de parenté
// en accent, « Récemment consultés », ouverture de la fiche.

test('⌘K trouve par le nom de naissance, sans accents, et ouvre la fiche', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  // L'arbre chargé répond lui-même à la recherche ; avant, la recherche navigue.
  await expect(page.getByRole('tree')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  const input = dialog.getByRole('combobox');
  await input.fill('roux');
  const jeanne = dialog.getByRole('option', { name: /Jeanne Marchand/ });
  await expect(jeanne).toContainText('née Roux');
  await expect(jeanne).toContainText('ta grand-mère');
  await input.press('Enter');
  // Comme un tap sur sa bulle : la fiche s'ouvre dans l'arbre, la caméra va à elle.
  await expect(page).toHaveURL(/\/tree\?fiche=jeanne$/);
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Jeanne Marchand', exact: true }),
  ).toBeVisible();

  // Sur mobile, la feuille de la fiche est modale : on rouvre au raccourci.
  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog.getByRole('group', { name: 'Récemment consultés' })).toContainText('Jeanne');
  await input.fill('emile');
  await expect(dialog.getByRole('option', { name: /Émile Roux/ })).toBeVisible();
  await input.fill('zzzz');
  await expect(dialog).toContainText('Personne de ce nom');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('⌘K hors de l’arbre, puis retour de la fiche complète : centré sur la personne', async ({
  page,
}, info) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/ancestors');
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox').fill('isabelle');
  await expect(page.getByRole('option', { name: /Isabelle/ })).toBeVisible();
  await page.getByRole('combobox').press('Enter');
  // Isabelle n'est pas dans le sablier de Hugo : toute la famille, fiche ouverte.
  await expect(page).toHaveURL(/\/tree\?view=all&fiche=isabelle$/);
  await settled(page);
  const isabelle = page.locator('[data-person="isabelle"]');
  if (info.project.name !== 'mobile') await expect(isabelle).toBeInViewport();

  await page.getByRole('link', { name: 'Fiche complète' }).click();
  await expect(page).toHaveURL(/\/people\/isabelle$/);
  await page.getByRole('link', { name: 'Retour à l’arbre' }).click();
  // Retour : centré sur Isabelle, cerclée, fiche refermée pour voir la lignée.
  await expect(page).toHaveURL(/[?&]focus=isabelle/);
  await settled(page);
  await expect(isabelle).toBeInViewport();
  await expect(isabelle).toHaveAttribute('aria-selected', 'true');
});

test('⌘K vers une bulle hors de l’écran : la caméra y va d’abord, puis la fiche s’ouvre', async ({
  page,
}) => {
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  // De tout près : la bulle de Jeanne, deux générations plus haut, sort de l'écran.
  const zoomIn = page.getByRole('button', { name: 'Zoomer', exact: true });
  for (let i = 0; i < 6; i += 1) await zoomIn.click();
  await settled(page);
  const jeanne = page.locator('[data-person="jeanne"]');
  await expect(jeanne).not.toBeInViewport();

  // Au moment où l'URL ouvre la fiche, la bulle est-elle déjà à l'écran ?
  await page.evaluate(() => {
    const record = window as unknown as { openedInView?: boolean };
    const push = history.pushState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      if (String(args[2]).includes('fiche=jeanne') && record.openedInView === undefined) {
        const rect = document.querySelector('[data-person="jeanne"]')?.getBoundingClientRect();
        record.openedInView =
          rect !== undefined &&
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;
      }
      push(...args);
    };
  });
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByRole('dialog', { name: 'Trouver quelqu’un' }).getByRole('combobox');
  await input.fill('jeanne');
  await expect(page.getByRole('option', { name: /Jeanne Marchand/ })).toBeVisible();
  await input.press('Enter');
  // La fiche ne s'ouvre qu'une fois la bulle à l'écran : l'avatar peut en partir.
  await expect(page).toHaveURL(/[?&]fiche=jeanne/);
  const openedInView = await page.evaluate(
    () => (window as unknown as { openedInView?: boolean }).openedInView,
  );
  expect(openedInView).toBe(true);
});

test('une seconde recherche pendant le vol l’emporte : la première fiche ne s’ouvre jamais', async ({
  page,
}) => {
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  const zoomIn = page.getByRole('button', { name: 'Zoomer', exact: true });
  for (let i = 0; i < 6; i += 1) await zoomIn.click();
  await settled(page);
  await page.evaluate(() => {
    const record = window as unknown as { pushed: string[] };
    record.pushed = [];
    const push = history.pushState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      record.pushed.push(String(args[2]));
      push(...args);
    };
  });
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  const search = async (query: string, name: RegExp) => {
    await page.keyboard.press('ControlOrMeta+k');
    await dialog.getByRole('combobox').fill(query);
    await expect(dialog.getByRole('option', { name })).toBeVisible();
    await dialog.getByRole('combobox').press('Enter');
  };
  // Le directory est chargé une fois : la seconde recherche part pendant le vol.
  await search('jeanne', /Jeanne Marchand/);
  await search('sophie', /Sophie Marchand/);
  await expect(page).toHaveURL(/[?&]fiche=sophie/);
  await settled(page);
  const pushed = await page.evaluate(() => (window as unknown as { pushed: string[] }).pushed);
  expect(pushed.some((url) => url.includes('fiche=jeanne'))).toBe(false);
  await expect(page).toHaveURL(/[?&]fiche=sophie/);
});

test('quitter l’arbre pendant le vol abandonne la fiche cherchée', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  const zoomIn = page.getByRole('button', { name: 'Zoomer', exact: true });
  for (let i = 0; i < 6; i += 1) await zoomIn.click();
  await settled(page);
  await page.evaluate(() => {
    const record = window as unknown as { pushed: string[] };
    record.pushed = [];
    const push = history.pushState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      record.pushed.push(String(args[2]));
      push(...args);
    };
  });
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  await page.keyboard.press('ControlOrMeta+k');
  await dialog.getByRole('combobox').fill('jeanne');
  await expect(dialog.getByRole('option', { name: /Jeanne Marchand/ })).toBeVisible();
  await dialog.getByRole('combobox').press('Enter');
  await page
    .getByRole('navigation', { name: 'Vues' })
    .getByRole('link', { name: 'Ancêtres' })
    .click();
  await expect(page).toHaveURL(/\/ancestors/);
  await page.waitForTimeout(1500);
  const pushed = await page.evaluate(() => (window as unknown as { pushed: string[] }).pushed);
  expect(pushed.some((url) => url.includes('fiche=jeanne'))).toBe(false);
  await expect(page).toHaveURL(/\/ancestors$/);
});

test('une recherche vers une bulle visible, pendant un vol, l’arrête net et proprement', async ({
  page,
}) => {
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  const zoomIn = page.getByRole('button', { name: 'Zoomer', exact: true });
  for (let i = 0; i < 6; i += 1) await zoomIn.click();
  await settled(page);
  const dialog = page.getByRole('dialog', { name: 'Trouver quelqu’un' });
  const search = async (query: string, name: RegExp) => {
    await page.keyboard.press('ControlOrMeta+k');
    await dialog.getByRole('combobox').fill(query);
    await expect(dialog.getByRole('option', { name })).toBeVisible();
    await dialog.getByRole('combobox').press('Enter');
  };
  await search('jeanne', /Jeanne Marchand/);
  // Le vol vers Jeanne part de Hugo : sa bulle est encore à l'écran.
  await search('hugo', /Hugo Marchand/);
  await expect(page).toHaveURL(/[?&]fiche=hugo/);
  // Le mouvement coupé est conclu : le calque ne reste pas figé pour la composition.
  await expect(page.locator('[data-camera-layer]')).toHaveCSS('will-change', 'auto');
  await expect(page).toHaveURL(/[?&]fiche=hugo/);
});
