// tdd-cover: e2e src/components/members/members-forms.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { decideAccessRequestAction } from '@/actions/members.actions';
import { AccessRequestCard } from '@/components/members/members-forms';
import { isAppError } from '@/server/_shared/errors';
import { requireSession } from '@/server/auth/session';
import { getMembersDeps } from '@/server/members/members.instance';
import { listAccessRequests } from '@/server/members/members.service';

export const metadata: Metadata = { title: 'Demandes d’accès' };

async function loadForAdmin(userId: string) {
  try {
    return await listAccessRequests(getMembersDeps(), userId);
  } catch (error) {
    // Un non-admin ne doit même pas apprendre que la page existe.
    if (isAppError(error) && error.status === 403) notFound();
    throw error;
  }
}

export default async function AdminPage() {
  const { user } = await requireSession();
  const { requests, unlinkedPersons } = await loadForAdmin(user.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-[32px] leading-tight">Demandes d’accès</h1>
        <nav className="flex gap-4 text-sm font-medium text-ink-2">
          <Link href="/tree">Arbre</Link>
          <Link href="/members">Membres</Link>
        </nav>
      </header>
      {requests.length === 0 ? (
        <p className="text-[15px] text-ink-2">Aucune demande en attente.</p>
      ) : (
        requests.map((request) => (
          <AccessRequestCard
            key={request.id}
            action={decideAccessRequestAction}
            request={request}
            persons={unlinkedPersons}
          />
        ))
      )}
    </main>
  );
}
