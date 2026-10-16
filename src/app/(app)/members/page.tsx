// tdd-cover: e2e src/components/members/members-forms.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { invitationAction, inviteAction, setAdminAction } from '@/actions/members.actions';
import { AdminToggle, InviteForm, PendingInvitation } from '@/components/members/members-forms';
import { requireSession } from '@/server/auth/session';
import { getMembersDeps } from '@/server/members/members.instance';
import { listMembers, listPendingInvitations } from '@/server/members/members.service';

export const metadata: Metadata = { title: 'Famille connectée' };

export default async function MembersPage() {
  const { user } = await requireSession();
  const deps = getMembersDeps();
  const { viewer, members, invitable } = await listMembers(deps, user.id);
  const invitations = viewer.isAdmin ? await listPendingInvitations(deps, user.id) : [];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-4 md:p-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-[32px] leading-tight">Famille connectée</h1>
        <nav className="flex gap-4 text-sm font-medium text-ink-2">
          <Link href="/tree">Arbre</Link>
          {viewer.isAdmin ? <Link href="/admin">Demandes d’accès</Link> : undefined}
        </nav>
      </header>

      <section className="rounded-[var(--radius-panel)] border border-line bg-card p-6">
        <h2 className="font-display text-2xl">Inviter un proche</h2>
        <p className="mt-2 mb-4 text-[15px] text-ink-2">
          Tu peux inviter ton cercle proche et tes descendants. Ils recevront un lien par email.
        </p>
        <InviteForm action={inviteAction} invitable={invitable} />
      </section>

      {viewer.isAdmin ? (
        <section aria-labelledby="pending-invitations">
          <h2 id="pending-invitations" className="font-display text-2xl">
            Invitations en attente ({invitations.length})
          </h2>
          {invitations.length === 0 ? (
            <p className="mt-2 text-[15px] text-ink-2">Aucune invitation n’attend de réponse.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rule rounded-[var(--radius-panel)] border border-line bg-card">
              {invitations.map((invitation) => (
                // Une invitation en attente par fiche ; la clé survit au renvoi (nouvel
                // identifiant), et le message « Nouveau lien envoyé » avec elle.
                <li key={invitation.personId}>
                  <PendingInvitation action={invitationAction} invitation={invitation} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : undefined}

      <section>
        <h2 className="font-display text-2xl">Déjà dans l’arbre ({members.length})</h2>
        <ul className="mt-4 divide-y divide-rule rounded-[var(--radius-panel)] border border-line bg-card">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 p-4">
              <span className="text-[15px]">
                {m.label}
                {m.isOwner ? (
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    Propriétaire
                  </span>
                ) : m.isAdmin ? (
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    Admin
                  </span>
                ) : undefined}
              </span>
              {viewer.isAdmin && !m.isOwner ? (
                <AdminToggle
                  action={setAdminAction}
                  membershipId={m.id}
                  isAdmin={m.isAdmin}
                  label={m.label}
                />
              ) : undefined}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
