import { E2E_ADMIN_EMAIL } from './e2e.constants';
import { expect, test } from './fixtures';
import { countEmails, signIn } from './outbox';

// Invitations en attente, page Membres : l'admin les voit, les renvoie avec un nouveau
// lien ou les annule. Le test annule à la fin : la base est partagée entre projets.

test('l’admin invite Maxime, renvoie le lien, puis annule l’invitation', async ({ page }, info) => {
  const email = `maxime-${info.project.name}@famille.test`;
  await signIn(page, E2E_ADMIN_EMAIL);
  await page.goto('/members');

  await page
    .getByRole('combobox', { name: 'Qui inviter ?' })
    .selectOption({ label: 'Maxime Marchand' });
  await page.getByRole('textbox', { name: 'Son email' }).fill(email);
  await page.getByRole('button', { name: 'Envoyer l’invitation' }).click();
  await expect(page.getByRole('status')).toHaveText(`Invitation envoyée à ${email}.`);
  await expect.poll(() => countEmails(email)).toBe(1);

  const pending = page.getByRole('region', { name: /^Invitations en attente/ });
  const item = pending.getByRole('listitem').filter({ hasText: email });
  await expect(item).toContainText('Maxime Marchand');
  await expect(item).toContainText(/Envoyée le .+, expire le .+/);

  const resend = item.getByRole('button', { name: 'Renvoyer l’invitation de Maxime Marchand' });
  const box = await resend.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await resend.click();
  await expect(item.getByRole('status')).toHaveText('Nouveau lien envoyé.');
  await expect.poll(() => countEmails(email)).toBe(2);

  await item.getByRole('button', { name: 'Annuler l’invitation de Maxime Marchand' }).click();
  await expect(pending.getByRole('listitem').filter({ hasText: email })).toHaveCount(0);
});

test('un membre sans rôle d’admin ne voit pas les invitations en attente', async ({ page }) => {
  await signIn(page, 'hugo@famille.test');
  await page.goto('/members');
  await expect(page.getByRole('heading', { name: 'Famille connectée' })).toBeVisible();
  await expect(page.getByRole('region', { name: /^Invitations en attente/ })).toHaveCount(0);
});
