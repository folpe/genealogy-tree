import { randomInt } from 'node:crypto';
import { test as base } from '@playwright/test';

// Chaque test se présente avec sa propre adresse, comme derrière le proxy de Vercel
// qui renseigne `x-forwarded-for`. Sans elle, tous les tests partageraient la même
// limite de demandes de lien (5 par minute) et se gêneraient d'un projet à l'autre.
export const test = base.extend({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright exige la déstructuration en premier argument.
  extraHTTPHeaders: async ({}, use) => {
    await use({ 'x-forwarded-for': `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}` });
  },
});

export { expect } from '@playwright/test';
