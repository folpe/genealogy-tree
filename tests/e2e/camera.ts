import type { Page } from '@playwright/test';

// Lecture de la caméra du canevas sur la transformation de son calque.

export type Camera = { x: number; y: number; k: number };

export async function camera(page: Page): Promise<Camera> {
  const transform = await page.locator('[data-camera-layer]').evaluate((el) => el.style.transform);
  const match = /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(transform);
  if (!match) throw new Error(`Transformation illisible : ${transform}`);
  return { x: Number(match[1]), y: Number(match[2]), k: Number(match[3]) };
}

/** Attend que la caméra reste immobile dix frames de suite (fin d'inertie ou de vol). */
export async function settled(page: Page): Promise<Camera> {
  await page.locator('[data-camera-layer]').evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        let last = el.style.transform;
        let still = 0;
        const tick = () => {
          still = el.style.transform === last ? still + 1 : 0;
          last = el.style.transform;
          if (still >= 10) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  return camera(page);
}

/** Cran des boutons de zoom (`ZOOM_STEP` du canevas). */
const ZOOM_STEP = 1.4;

/** Pince le canevas en son centre, de `factor` (au-dessus de 1, les doigts s'écartent). */
async function pinch(page: Page, factor: number) {
  await page.locator('[aria-label="Canevas de l’arbre"]').evaluate((el, scale) => {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const from = 60;
    const touch = (id: number, x: number) => ({
      pointerId: id,
      pointerType: 'touch',
      bubbles: true,
      clientX: x,
      clientY: cy,
    });
    el.dispatchEvent(new PointerEvent('pointerdown', touch(1, cx - from)));
    el.dispatchEvent(new PointerEvent('pointerdown', touch(2, cx + from)));
    const moves = 10;
    let half = from;
    for (let i = 1; i <= moves; i += 1) {
      half = from * scale ** (i / moves);
      el.dispatchEvent(new PointerEvent('pointermove', touch(1, cx - half)));
      el.dispatchEvent(new PointerEvent('pointermove', touch(2, cx + half)));
    }
    el.dispatchEvent(new PointerEvent('pointerup', touch(1, cx - half)));
    el.dispatchEvent(new PointerEvent('pointerup', touch(2, cx + half)));
  }, factor);
}

/**
 * Zoome de `steps` crans (négatif : dézoome), comme le lecteur : aux boutons avec une
 * souris, en pinçant au doigt, où les boutons cèdent la place au geste.
 */
export async function zoom(page: Page, steps: number): Promise<Camera> {
  const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
  const name = steps > 0 ? 'Zoomer' : 'Dézoomer';
  for (let i = 0; i < Math.abs(steps); i += 1) {
    if (coarse) await pinch(page, steps > 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
    else await page.getByRole('button', { name, exact: true }).click();
    await settled(page);
  }
  return camera(page);
}
