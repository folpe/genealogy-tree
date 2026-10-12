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
