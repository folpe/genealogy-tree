// tdd-cover: e2e tests/e2e/auth.spec.ts
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { PasskeyOffer } from './passkey-offer';

export const metadata: Metadata = { title: 'Bienvenue' };

// Retour du lien magique. Une passkey déjà enregistrée, ou pas de session : rien à proposer.
export default async function PasskeyOfferPage() {
  const { user } = await requireSession();
  const passkeys = await getAuth().api.listPasskeys({ headers: await headers() });
  if (passkeys.length > 0) redirect('/tree');
  return (
    <AuthShell>
      <PasskeyOffer firstName={user.name.trim().split(/\s+/)[0] ?? ''} />
    </AuthShell>
  );
}
