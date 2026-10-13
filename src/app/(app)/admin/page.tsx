// tdd-cover: e2e src/components/members/members-forms.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { decideAccessRequestAction } from '@/actions/members.actions';
import { RestoreButton } from '@/components/family/fiche-trash';
import { AccessRequestCard } from '@/components/members/members-forms';
import { isAppError } from '@/server/_shared/errors';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { listTrash } from '@/server/family/person-trash.service';
import { getMembersDeps } from '@/server/members/members.instance';
import { listAccessRequests } from '@/server/members/members.service';

export const metadata: Metadata = { title: 'Administration' };

async function loadForAdmin(userId: string) {
  try {
    const [access, trash] = await Promise.all([
      listAccessRequests(getMembersDeps(), userId),
      listTrash({ ...getFamilyDeps(), now: () => new Date() }, userId),
    ]);
    return { ...access, trash };
  } catch (error) {
    // Un non-admin ne doit même pas apprendre que la page existe.
    if (isAppError(error) && error.status === 403) notFound();
    throw error;
  }
}

export default async function AdminPage() {
  const { user } = await requireSession();
  const { requests, unlinkedPersons, trash } = await loadForAdmin(user.id);

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
      <section aria-label="Corbeille" className="flex flex-col gap-3 border-t border-rule pt-6">
        <h2 className="font-display text-2xl">Corbeille</h2>
        {trash.length === 0 ? (
          <p className="text-[15px] text-ink-2">Aucune fiche à la corbeille.</p>
        ) : (
          <ul className="flex flex-col">
            {trash.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 border-t border-rule py-3 first:border-t-0"
              >
                <span className="flex flex-col">
                  <span className="text-[15px]">{item.name}</span>
                  <span className="text-[13px] text-ink-2">
                    {[
                      item.deletedAt?.toLocaleDateString('fr-FR', { dateStyle: 'long' }),
                      item.deletedByName ? `par ${item.deletedByName}` : undefined,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </span>
                <RestoreButton personId={item.id} name={item.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
