// tdd-cover: e2e src/server/members/members.service.integration.test.ts
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb } from '@/server/db/client';
import { getInvitationPreview } from '@/server/members/members.service';
import { LoginForm } from '../../login/login-form';

export const metadata: Metadata = { title: 'Invitation' };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationPreview(getDb(), token, new Date());

  return (
    <main className="canvas-grid flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-card p-8 shadow-card">
        <p className="font-display text-2xl font-medium">Ances-Tree</p>
        {invitation ? (
          <>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Invitation
            </p>
            <h1 className="mt-2 font-display text-[32px] leading-tight">
              Bonjour {invitation.firstName}
            </h1>
            <p className="mt-3 text-[15px] text-ink-2">
              {invitation.inviterName} t’invite dans l’arbre de la famille. Pas de mot de passe :
              reçois ton lien de connexion par email.
            </p>
            <LoginForm defaultEmail={invitation.email} />
          </>
        ) : (
          <>
            <h1 className="mt-8 font-display text-[32px] leading-tight">
              Ce lien n’est plus valable
            </h1>
            <p className="mt-3 text-[15px] text-ink-2">
              Il a peut-être déjà servi, ou expiré. Demande à la personne qui t’a invité de
              recommencer, ou fais une demande d’accès.
            </p>
            <Link
              href="/request-access"
              className="mt-6 inline-block text-[15px] font-semibold underline underline-offset-4"
            >
              Demander l’accès
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
