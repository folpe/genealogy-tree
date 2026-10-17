import type { Page } from '@playwright/test';
import { E2E_ADMIN_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { redrawn } from './folds';
import { signIn } from './outbox';

// Zéro croisement sur la lignée directe (décision de Folpe, 2026-10-17, comme
// MyHeritage) : déplier l'un replie l'autre, et le pli posé tout seul s'annonce. La
// famille Marchand n'a aucun cas de croisement : Hugo ajoute deux enfants à son
// arrière-grand-père Émile, l'admin donne une fille à l'un ; déplier ce côté de Luc
// croise alors la famille de Sophie. Sur téléphone seulement (`playwright.config.ts`) : la
// base est partagée, une fois suffit.

test.describe.configure({ mode: 'serial' });

const bubble = (page: Page, id: string) => page.locator(`[data-person="${id}"]`);
const named = (page: Page, name: RegExp) => page.getByRole('treeitem', { name });
const notice = (page: Page) => page.locator('[data-fold-notice]');

async function openAll(page: Page) {
  await page.goto('/tree?view=all');
  await expect(page.locator('[data-camera-layer]')).toHaveAttribute('data-camera-ready', 'true');
  await redrawn(page);
}

/** Menu de la bulle d'Émile, « + Enfant », un prénom : la fiche est créée, le dialogue fermé. */
async function addChildToEmile(page: Page, firstName: string) {
  await bubble(page, 'emile').focus();
  await page.keyboard.press('Shift+F10');
  await page
    .getByRole('menu', { name: /^Actions rapides, Émile/ })
    .getByRole('menuitem', { name: '+ Enfant' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Ajouter un enfant à Émile' });
  await dialog.getByLabel('Prénom').fill(firstName);
  await dialog.getByRole('button', { name: `Ajouter ${firstName}` }).click();
  const done = page.getByRole('dialog', { name: 'C’est ajouté' });
  await expect(done).toBeVisible();
  await done.getByRole('button', { name: 'Fermer' }).click();
}

test('un ajout dans l’arbre garde les plis du lecteur, la nouvelle bulle visible', async ({
  page,
}) => {
  await signIn(page, 'hugo@famille.test');
  await openAll(page);
  // Plis de départ : le frère ajouté à Émile ne part pas derrière le repère de Jeanne.
  await addChildToEmile(page, 'Robert');
  await expect(named(page, /^Robert Roux/)).toHaveCount(1);
  await redrawn(page);

  // Un collatéral déplié, puis un nouvel ajout : les plis de Hugo tiennent.
  await page.getByRole('button', { name: '+2 frères et sœurs de Paul Marchand' }).click();
  await expect(bubble(page, 'marie')).toHaveCount(1);
  await redrawn(page);
  await addChildToEmile(page, 'Simone');
  await expect(named(page, /^Simone Roux/)).toHaveCount(1);
  await redrawn(page);
  await expect(named(page, /^Robert Roux/)).toHaveCount(1);
  await expect(bubble(page, 'marie')).toHaveCount(1);
  await expect(bubble(page, 'claude')).toHaveCount(1);
  await expect(bubble(page, 'lea')).toHaveCount(0);
  // Et ils sont retenus tels quels sur l'appareil.
  await openAll(page);
  await expect(bubble(page, 'marie')).toHaveCount(1);
  await expect(named(page, /^Robert Roux/)).toHaveCount(1);
  await expect(named(page, /^Simone Roux/)).toHaveCount(1);
});

test('déplier l’oncle de Luc replie la famille de Sophie, et l’inverse', async ({
  page,
  browser,
}) => {
  const admin = await browser.newPage();
  await signIn(admin, E2E_ADMIN_EMAIL);
  await admin.goto('/people/emile');
  await admin.getByRole('link', { name: /^Robert Roux/ }).click();
  await admin.getByRole('button', { name: '+ Enfant' }).click();
  const dialog = admin.getByRole('dialog', { name: 'Ajouter un enfant à Robert' });
  await dialog.getByLabel('Prénom').fill('Céline');
  await dialog.getByRole('button', { name: 'Ajouter Céline' }).click();
  await expect(admin.getByRole('dialog', { name: 'C’est ajouté' })).toBeVisible();
  await admin.close();

  // Un appareil neuf : les plis de départ, Robert et Simone derrière le repère de Jeanne.
  await signIn(page, 'hugo@famille.test');
  await openAll(page);
  await expect(bubble(page, 'bernard')).toHaveCount(1);
  await expect(named(page, /^Robert Roux/)).toHaveCount(0);

  await page.getByRole('button', { name: '+2 frères et sœurs de Jeanne Marchand' }).click();
  await expect(named(page, /^Céline Roux/)).toHaveCount(1);
  await expect(bubble(page, 'bernard')).toHaveCount(0);
  await expect(bubble(page, 'odette')).toHaveCount(0);
  await expect(notice(page)).toHaveText('Famille de Sophie repliée pour garder l’arbre lisible');
  await expect(notice(page)).toHaveAttribute('role', 'status');
  await redrawn(page);

  await bubble(page, 'sophie').focus();
  await page.keyboard.press('Shift+F10');
  await page
    .getByRole('menu', { name: /^Actions rapides, Sophie/ })
    .getByRole('menuitem', { name: 'Afficher sa famille' })
    .click();
  await expect(bubble(page, 'bernard')).toHaveCount(1);
  await expect(named(page, /^Robert Roux/)).toHaveCount(0);
  await expect(named(page, /^Céline Roux/)).toHaveCount(0);
  await expect(notice(page)).toHaveText('Branche de Robert repliée pour garder l’arbre lisible');
  // Simone, sans enfant, ne gênait pas : elle reste ; Robert seul revient au repère.
  await expect(named(page, /^Simone Roux/)).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: '+1 frère ou sœur de Jeanne Marchand' }),
  ).toBeVisible();
});
