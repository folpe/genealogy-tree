import type { Locator, Page } from '@playwright/test';
import { camera, settled } from './camera';
import { E2E_ISABELLE_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Caméra du canevas (plan phase 4, lot 4), dans un vrai navigateur : glisser,
// pincer, zoomer, revenir à soi. On lit l'état sur la transformation du calque.

async function openTree(page: Page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await signIn(page, E2E_ISABELLE_EMAIL);
  // Mécanique du canevas, éprouvée sur l'arbre entier (la vue par défaut est la sienne).
  await page.goto('/tree?view=all');
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  return page.getByRole('region', { name: 'Canevas de l’arbre' });
}

/** Glisser à la souris, d'un point du canevas à un autre (coordonnées du canevas). */
async function drag(page: Page, canvas: Locator, from: [number, number], to: [number, number]) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canevas introuvable');
  await page.mouse.move(box.x + from[0], box.y + from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + to[0], box.y + to[1], { steps: 10 });
  await page.mouse.up();
}

test('glisser déplace l’arbre, et un glissé sur une bulle n’ouvre pas sa fiche', async ({
  page,
}) => {
  const canvas = await openTree(page);
  const before = await camera(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  const box = await me.boundingBox();
  const origin = await canvas.boundingBox();
  if (!box || !origin) throw new Error('bulle introuvable');
  const start: [number, number] = [box.x - origin.x + 30, box.y - origin.y + 30];
  await drag(page, canvas, start, [start[0] - 120, start[1] - 80]);
  const after = await settled(page);
  expect(after.x).toBeLessThan(before.x - 60);
  expect(after.y).toBeLessThan(before.y - 40);
  await expect(page).toHaveURL(/\/tree\?view=all$/);
});

test('zoomer et dézoomer avec les boutons, dans les limites', async ({ page }) => {
  await openTree(page);
  const before = await settled(page);
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
  await page.waitForTimeout(50);
  expect((await settled(page)).k).toBeGreaterThan(before.k);
  const zoomOut = page.getByRole('button', { name: 'Dézoomer', exact: true });
  for (let i = 0; i < 12; i += 1) {
    await zoomOut.click();
    await settled(page);
  }
  const far = await settled(page);
  expect(far.k).toBeLessThan(before.k);
  expect(far.k).toBeGreaterThan(0.05);
});

test('pincer à deux doigts zoome autour des doigts', async ({ page }) => {
  const canvas = await openTree(page);
  const before = await camera(page);
  await canvas.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const touch = (id: number, x: number) => ({
      pointerId: id,
      pointerType: 'touch',
      bubbles: true,
      clientX: x,
      clientY: cy,
    });
    el.dispatchEvent(new PointerEvent('pointerdown', touch(1, cx - 40)));
    el.dispatchEvent(new PointerEvent('pointerdown', touch(2, cx + 40)));
    for (let i = 1; i <= 10; i += 1) {
      el.dispatchEvent(new PointerEvent('pointermove', touch(1, cx - 40 - i * 8)));
      el.dispatchEvent(new PointerEvent('pointermove', touch(2, cx + 40 + i * 8)));
    }
    el.dispatchEvent(new PointerEvent('pointerup', touch(1, cx - 120)));
    el.dispatchEvent(new PointerEvent('pointerup', touch(2, cx + 120)));
  });
  const after = await settled(page);
  expect(after.k / before.k).toBeGreaterThan(1.5);
});

test('« Me retrouver » ramène ma bulle à l’écran', async ({ page }) => {
  const canvas = await openTree(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  for (let i = 0; i < 4; i += 1) await drag(page, canvas, [300, 300], [20, 20]);
  await settled(page);
  await expect(me).not.toBeInViewport();
  await page.getByRole('button', { name: 'Me retrouver' }).click();
  await settled(page);
  await expect(me).toBeInViewport();
});

test('au clavier, la caméra suit la bulle qui prend le focus', async ({ page }) => {
  await openTree(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  await me.focus();
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowUp');
  await page.keyboard.press('End');
  await settled(page);
  await expect(page.locator(':focus')).toBeInViewport();
});

test('au doigt, la caméra ne bouge pas sous la bulle touchée, même avec le mouvement réduit', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signIn(page, 'hugo@famille.test');
  await settled(page);
  // Luc est près du bord : au clavier, la caméra irait le chercher ; touché, il reste.
  await page.getByRole('treeitem', { name: /^Luc Marchand/ }).click();
  await expect(page).toHaveURL(/[?&]fiche=luc/);
});

test('sur grand écran, un clic sur la mini-carte y déplace la caméra', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'mini-carte réservée aux grands écrans');
  await openTree(page);
  const minimap = page.locator('[data-minimap]');
  await expect(minimap).toBeVisible();
  const before = await camera(page);
  const box = await minimap.boundingBox();
  if (!box) throw new Error('mini-carte introuvable');
  await page.mouse.click(box.x + box.width - 4, box.y + box.height - 4);
  const after = await settled(page);
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(100);
});

test('après un glissé au doigt, le premier tap sur une bulle ouvre sa fiche', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'tap tactile');
  const canvas = await openTree(page);
  // Glissé tactile, une frame par mouvement : un doigt qui bouge n'émet pas de click.
  await canvas.evaluate(async (el) => {
    const box = el.getBoundingClientRect();
    const touch = (x: number) => ({
      pointerId: 7,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      clientX: box.left + x,
      clientY: box.top + box.height - 60,
    });
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    el.dispatchEvent(new PointerEvent('pointerdown', touch(200)));
    for (let i = 1; i <= 10; i += 1) {
      await frame();
      el.dispatchEvent(new PointerEvent('pointermove', touch(200 - i * 3)));
    }
    el.dispatchEvent(new PointerEvent('pointerup', touch(170)));
  });
  await settled(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  await me.tap();
  await expect(page).toHaveURL(/[?&]fiche=[\w-]+/);
});

test('glisser depuis une bulle ne lance pas le glisser-déposer du navigateur', async ({ page }) => {
  await openTree(page);
  const prevented = await page
    .getByRole('treeitem', { name: /c’est toi$/ })
    .evaluate(
      (el) => !el.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true })),
    );
  expect(prevented).toBe(true);
});

test('zoom sémantique : de près, le nom complet ; le texte reste net', async ({ page }) => {
  const canvas = await openTree(page);
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  await expect(canvas).toHaveAttribute('data-detail', 'mid');
  await expect(me.getByText('Toi', { exact: true })).toBeVisible();
  const zoomIn = page.getByRole('button', { name: 'Zoomer', exact: true });
  for (let i = 0; i < 3; i += 1) {
    await zoomIn.click();
    await settled(page);
  }
  await expect(canvas).toHaveAttribute('data-detail', 'near');
  // Le nom complet affiché ; le nom de la bulle, pour la lecture, est à part.
  await expect(
    me.getByText('Isabelle Lefèvre', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(me.getByText('Toi', { exact: true })).toBeHidden();
  // Calque figé à son échelle de départ pendant le geste seulement, sinon le texte est flou.
  await expect(page.locator('[data-camera-layer]')).toHaveCSS('will-change', 'auto');
});

test('zoom sémantique : de loin, des pastilles sans texte', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'l’arbre de test tient en entier sur grand écran');
  const canvas = await openTree(page);
  const zoomOut = page.getByRole('button', { name: 'Dézoomer', exact: true });
  for (let i = 0; i < 4; i += 1) {
    await zoomOut.click();
    await settled(page);
  }
  await expect(canvas).toHaveAttribute('data-detail', 'far');
  const henri = page.getByRole('treeitem', { name: /^Henri Marchand/ });
  await expect(henri).toBeVisible();
  await expect(henri.getByText('Henri', { exact: true })).toBeHidden();
});

test('mouvements réduits : « Me retrouver » saute sans animer', async ({ page }) => {
  const canvas = await openTree(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const me = page.getByRole('treeitem', { name: /c’est toi$/ });
  for (let i = 0; i < 4; i += 1) await drag(page, canvas, [300, 300], [20, 20]);
  await settled(page);
  const layer = page.locator('[data-camera-layer]');
  await page.getByRole('button', { name: 'Me retrouver' }).click();
  // Pas de vol : dès la frame suivante, la caméra est à sa place finale.
  const next = await layer.evaluate(
    (el) => new Promise<string>((done) => requestAnimationFrame(() => done(el.style.transform))),
  );
  await settled(page);
  expect(next).toBe(await layer.evaluate((el) => el.style.transform));
  await expect(me).toBeInViewport();
});

test('un tap pendant un vol arrête la caméra et finit le mouvement', async ({ page }) => {
  const canvas = await openTree(page);
  const layer = page.locator('[data-camera-layer]');
  for (let i = 0; i < 4; i += 1) await drag(page, canvas, [300, 300], [20, 20]);
  await settled(page);
  await page.getByRole('button', { name: 'Me retrouver' }).click();
  // En plein vol, un tap sur le fond du canevas, loin de toute bulle et des boutons.
  await page.waitForTimeout(120);
  // Le point vide est choisi et touché dans le même instant, depuis la page : en plein
  // vol, une bulle passerait sous le point entre la mesure et un clic envoyé ensuite.
  const stopped = await canvas.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const cameraLayer = el.querySelector<HTMLElement>('[data-camera-layer]');
    for (let y = 16; y < box.height / 2; y += 16) {
      for (let x = 16; x < box.width / 2; x += 16) {
        const clientX = box.left + x;
        const clientY = box.top + y;
        const hit = document.elementFromPoint(clientX, clientY);
        // L'en-tête et les vues flottent sur l'arbre plein écran du téléphone.
        if (!hit || !el.contains(hit) || hit.closest('a, button')) continue;
        const touch = { bubbles: true, clientX, clientY, pointerId: 7, pointerType: 'touch' };
        hit.dispatchEvent(new PointerEvent('pointerdown', { ...touch, isPrimary: true }));
        hit.dispatchEvent(new PointerEvent('pointerup', { ...touch, isPrimary: true }));
        hit.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY }));
        // La caméra telle que le tap l'a arrêtée, à la frame suivante.
        return new Promise<string>((done) =>
          requestAnimationFrame(() => done(cameraLayer?.style.transform ?? '')),
        );
      }
    }
    throw new Error('aucun point vide dans le canevas');
  });
  await expect(page).toHaveURL(/\/tree\?view=all$/);
  await settled(page);
  await expect(layer).toHaveCSS('will-change', 'auto');
  // Arrêtée net : elle n'a pas fini son vol jusqu'à « moi », elle est restée où le tap l'a prise.
  expect(await layer.evaluate((el) => el.style.transform)).toBe(stopped);
});
