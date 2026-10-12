// tdd-cover: e2e src/app/(app)/tree/welcome.test.tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getAuth } from '@/server/auth/auth.instance';
import { requireSession } from '@/server/auth/session';
import { Welcome } from './welcome';

export const metadata: Metadata = { title: 'Arbre' };

// Provisoire : l'arbre, lu à travers la policy, arrive au lot 5.
export default async function TreePage() {
  const { user } = await requireSession();
  const passkeys = await getAuth().api.listPasskeys({ headers: await headers() });

  return (
    <main className="canvas-grid flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-card p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Bienvenue</p>
        <h1 className="mt-2 font-display text-[32px] leading-tight">L’arbre s’ouvre bientôt</h1>
        <Welcome email={user.email} hasPasskey={passkeys.length > 0} />
        <Link
          href="/members"
          className="mt-6 inline-block text-[15px] font-semibold underline underline-offset-4"
        >
          Famille connectée : inviter un proche
        </Link>
      </div>
    </main>
  );
}
