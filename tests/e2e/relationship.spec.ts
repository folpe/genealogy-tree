import type { Locator, TestInfo } from '@playwright/test';
import { settled } from './camera';
import { expect, test } from './fixtures';
import { signIn } from './outbox';

// « Notre lien » (plan phase 5, lot 6) : depuis la fiche, la phrase, les étapes et les
// ancêtres communs ; dans l'arbre, le chemin allumé et le reste estompé.

const onDesktop = (info: TestInfo) => info.project.name !== 'mobile';

test('Hugo voit son lien avec Isabelle, éclairé dans l’arbre', async ({ page }, info) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/tree?view=all&fiche=isabelle');
  await page.getByRole('button', { name: 'Notre lien' }).click();
  const card = page.getByRole('region', { name: 'Notre lien' });
  await expect(card).toContainText('Isabelle est la cousine germaine de ton père.');
  await expect(card.getByRole('listitem')).toHaveText(['Toi', 'Luc', 'Paul', 'Marie', 'Isabelle']);
  await expect(card).toContainText('Henri et Louise');
  await settled(page);

  const tree = page.locator('[role="tree"]');
  // Le chemin, plus Henri et Louise, ancêtres communs au sommet.
  await expect(tree.locator('[data-on-path="true"]')).toHaveCount(7);
  await expect(tree.locator('[data-person="henri"]')).toHaveAttribute('data-on-path', 'true');
  await expect(tree.locator('[data-person="sophie"]')).toHaveAttribute('data-on-path', 'false');
  if (onDesktop(info)) {
    await expect(page.getByRole('treeitem', { name: /^Paul Marchand/ })).toBeInViewport();
  }

  await card.getByRole('button', { name: 'Fermer le lien' }).click();
  await expect(card).toHaveCount(0);
  await expect(tree.locator('[data-on-path]')).toHaveCount(0);
});

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function boxOf(target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Élément absent de l’écran');
  return box;
}

// Plan phase 5, lot 7 : un lien long, sur un petit téléphone comme sur ordinateur, se
// voit en entier, ancêtres communs compris : rien sous la carte, rien sous les boutons.
for (const width of [360, undefined]) {
  test(`un lien long se voit en entier${width ? ` à ${width} px` : ''}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(width !== undefined && !isMobile, 'largeur de téléphone');
    if (width) await page.setViewportSize({ width, height: 740 });
    await signIn(page, 'hugo@famille.test');
    await page.goto('/tree?view=all&fiche=isabelle');
    await page.getByRole('button', { name: 'Notre lien' }).click();
    const card = page.getByRole('region', { name: 'Notre lien' });
    await expect(card).toContainText('Henri et Louise');
    await settled(page);
    // « Toi » est sur le chemin : « Me retrouver » laisse la place.
    await expect(page.getByRole('button', { name: 'Me retrouver' })).toHaveCount(0);

    const canvas = await boxOf(page.locator('[aria-label="Canevas de l’arbre"]'));
    const cardBox = await boxOf(card);
    const zoomButtons = [
      page.getByRole('button', { name: 'Zoomer', exact: true }),
      page.getByRole('button', { name: 'Dézoomer', exact: true }),
    ];
    // Au doigt, pas de boutons de zoom (le pincement suffit) : rien ne couvre le chemin.
    const buttons = [];
    for (const button of zoomButtons) {
      if (isMobile) await expect(button).toBeHidden();
      else buttons.push(await boxOf(button));
    }
    const tree = page.locator('[role="tree"]');
    // Le chemin allumé, ancêtres communs compris.
    const framed = await tree.locator('[data-on-path="true"]').all();
    expect(framed).toHaveLength(7);
    for (const bubble of framed) {
      const box = await boxOf(bubble);
      const name = await bubble.getAttribute('data-person');
      expect(box.y, `${name} sous la carte`).toBeGreaterThanOrEqual(cardBox.y + cardBox.height);
      expect(box.y + box.height, `${name} dans le canevas`).toBeLessThanOrEqual(
        canvas.y + canvas.height,
      );
      expect(box.x, `${name} dans le canevas`).toBeGreaterThanOrEqual(canvas.x);
      expect(box.x + box.width, `${name} dans le canevas`).toBeLessThanOrEqual(
        canvas.x + canvas.width,
      );
      for (const button of buttons) expect(overlaps(box, button), `${name} libre`).toBe(false);
    }

    // Le lien fermé, la vue rejoint en douceur les bornes sans carte (le haut du placement
    // au plus au centre du canevas) : le geste suivant ne la fait pas sauter.
    await card.getByRole('button', { name: 'Fermer le lien' }).click();
    const after = await settled(page);
    expect(after.y).toBeLessThanOrEqual(0.5);
    expect(after.x).toBeLessThanOrEqual(0.5);
  });
}

// Plan phase 5, lot 3 : le chemin se trace de Toi vers la cible (DrawSVG), puis rend au
// trait son style ; avec le mouvement réduit, il est posé d'un coup.
const drawing = () =>
  [...document.querySelectorAll<SVGPathElement>('[data-link]')].some(
    (path) => path.style.strokeDashoffset !== '',
  );

test('le chemin se trace, puis rend leur style aux traits', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/tree?view=all&fiche=isabelle');
  await page.getByRole('button', { name: 'Notre lien' }).click();
  await page.waitForFunction(drawing);
  await expect.poll(() => page.evaluate(drawing)).toBe(false);
  await expect(page.locator('[role="tree"] [data-on-path="true"]')).toHaveCount(7);
});

test('avec le mouvement réduit, le chemin est posé d’un coup', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signIn(page, 'hugo@famille.test');
  await page.goto('/tree?view=all&fiche=isabelle');
  await page.getByRole('button', { name: 'Notre lien' }).click();
  const card = page.locator('[data-link-card]');
  await expect(card.getByRole('listitem')).toHaveCount(5);
  expect(await page.evaluate(drawing)).toBe(false);
  await expect(card.getByRole('listitem').last()).toHaveCSS('opacity', '1');
});
