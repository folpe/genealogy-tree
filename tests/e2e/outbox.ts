import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { E2E_SERVER_LOG } from './e2e.constants';

// Boîte d'envoi des tests : sans clé Resend, l'app écrit chaque email dans ses logs
// (`[email] à <adresse> : <sujet>` suivi du texte). On y relit le dernier lien reçu.

const LINK = /https?:\/\/\S+\/api\/auth\/magic-link\/verify\S+/;

function emailsTo(address: string): string[] {
  const log = readFileSync(E2E_SERVER_LOG, 'utf8');
  return log
    .split('[email] à ')
    .slice(1)
    .filter((block) => block.startsWith(`${address} :`));
}

/** Nombre d'emails déjà reçus par une adresse. */
export function countEmails(address: string): number {
  return emailsTo(address).length;
}

/** Attend un nouvel email pour l'adresse et rend son lien de connexion. */
export async function nextMagicLink(address: string, before: number): Promise<string> {
  await expect.poll(() => countEmails(address), { timeout: 10_000 }).toBeGreaterThan(before);
  const link = LINK.exec(emailsTo(address).at(-1) ?? '')?.[0];
  if (!link) throw new Error(`Email sans lien de connexion pour ${address}`);
  return link;
}

/** Connexion par lien magique, jusqu'à l'arbre. */
export async function signIn(page: Page, email: string) {
  const before = countEmails(email);
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Ton email' }).fill(email);
  await page.getByRole('button', { name: 'Recevoir mon lien' }).click();
  await page.goto(await nextMagicLink(email, before));
  await expect(page).toHaveURL(/\/tree$/);
}
