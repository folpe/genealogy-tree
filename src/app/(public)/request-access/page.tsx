// tdd-cover: e2e src/components/members/members-forms.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { requestAccessAction } from '@/actions/members.actions';
import { RequestAccessForm } from '@/components/members/members-forms';

export const metadata: Metadata = { title: 'Demande d’accès' };

export default function RequestAccessPage() {
  return (
    <main className="canvas-grid flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-card p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Demande d’accès
        </p>
        <h1 className="mt-2 font-display text-[32px] leading-tight">Rejoins la famille</h1>
        <p className="mt-3 text-[15px] text-ink-2">
          Un administrateur vérifie ta demande et te relie à ta fiche. Le plus simple reste de
          demander à un proche déjà inscrit de t’inviter.
        </p>
        <RequestAccessForm action={requestAccessAction} />
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-ink-2 underline underline-offset-4"
        >
          Revenir à la connexion
        </Link>
      </div>
    </main>
  );
}
