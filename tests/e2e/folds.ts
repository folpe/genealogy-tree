import { expect, type Page } from '@playwright/test';
import { settled } from './camera';

// Plis de l'arbre (retour de Folpe, 2026-10-17) : Toute la famille s'ouvre lignées
// seules. Les parcours qui éprouvent le canevas sur l'arbre entier le déplient d'abord,
// comme le lecteur, par les réglages.

/** Le canevas a fini de se redessiner : plus de calcul en cours, caméra immobile. */
export async function redrawn(page: Page) {
  await expect(page.getByRole('region', { name: 'Canevas de l’arbre' })).not.toHaveAttribute(
    'aria-busy',
    'true',
  );
  return settled(page);
}

/** Réglages, puis « Lignées seules » ou « Tout afficher ». */
export async function askFolds(page: Page, label: 'Lignées seules' | 'Tout afficher') {
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await page.getByRole('button', { name: /^Réglages de l’arbre/ }).click();
  await page.getByRole('button', { name: label }).click();
  await expect(page.getByRole('button', { name: label })).toHaveCount(0);
}

/** « Tout afficher » : toute la famille dépliée, l'arbre redessiné. */
export async function showWholeFamily(page: Page) {
  await askFolds(page, 'Tout afficher');
  await expect(page.locator('[data-marker]')).toHaveCount(0);
  await redrawn(page);
}
