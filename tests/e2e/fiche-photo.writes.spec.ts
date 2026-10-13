import { expect, test } from './fixtures';
import { signIn } from './outbox';

// Changer la photo d'une fiche. Le dépôt réel passe par Vercel Blob, absent en e2e :
// on vérifie le geste et le refus d'un fichier qui n'est pas une photo ; le service
// est couvert en intégration (person-photo.service.integration.test.ts).

test('un fichier qui n’est pas une photo est refusé, en le disant', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/anne');
  await page.getByLabel('Changer la photo').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('pas une photo'),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'photo' })).toBeVisible();
});

test('hors de sa lignée, pas de photo à changer', async ({ page }) => {
  await signIn(page, 'anne@famille.test');
  await page.goto('/people/bernard');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bernard');
  await expect(page.getByLabel('Changer la photo')).toHaveCount(0);
});
