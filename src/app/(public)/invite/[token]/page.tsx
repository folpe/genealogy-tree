// tdd-cover: e2e src/server/members/members.service.integration.test.ts
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { Kicker, pillPrimary } from '@/components/auth/auth-ui';
import { RevealTitle } from '@/components/auth/reveal-title';
import { getDb } from '@/server/db/client';
import { getInvitationPreview } from '@/server/members/members.service';
import { LoginForm } from '../../login/login-form';

export const metadata: Metadata = { title: 'Invitation' };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationPreview(getDb(), token, new Date());

  return (
    <AuthShell>
      {invitation ? (
        <LoginForm
          defaultEmail={invitation.email}
          intro={{
            kicker: 'Invitation',
            title: `Bonjour ${invitation.firstName}`,
            lead: `${invitation.inviterName} t’invite dans l’arbre de la famille. Pas de mot de passe : reçois ton lien de connexion par email.`,
          }}
        />
      ) : (
        <div className="step-in flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2.5">
            <Kicker>Invitation</Kicker>
            <RevealTitle text="Ce lien n’est plus valable" />
            <p className="text-base leading-normal text-ink-2">
              Il a peut-être déjà servi, ou expiré. Demande à la personne qui t’a invité de
              recommencer, ou fais une demande d’accès.
            </p>
          </div>
          <Link href="/request-access" className={pillPrimary}>
            Demander l’accès
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
