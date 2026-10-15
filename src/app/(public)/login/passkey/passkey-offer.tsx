'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaceIcon, Kicker, pillPrimary, pillSecondary, StepBadge } from '@/components/auth/auth-ui';
import { RevealTitle } from '@/components/auth/reveal-title';
import { authClient } from '@/lib/auth-client';

// Étape « passkey » de la maquette Connexion : juste après le lien magique, une passkey
// sur cet appareil évite l'email la prochaine fois. Refuser ou échouer ne bloque rien.

/** `firstName` peut être vide : un compte sans nom reçoit un simple « Bienvenue ». */
export function PasskeyOffer({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function activate() {
    setPending(true);
    setError(undefined);
    const result = await authClient.passkey.addPasskey();
    setPending(false);
    if (result?.error) {
      setError('Pas activée cette fois. Tu pourras le faire depuis le menu de ton compte.');
      return;
    }
    router.replace('/tree');
  }

  return (
    <div className="step-in flex flex-col items-center gap-[18px] text-center">
      <StepBadge tone="neutral">
        <FaceIcon />
      </StepBadge>
      <Kicker>{firstName ? `Bienvenue ${firstName}` : 'Bienvenue'}</Kicker>
      <RevealTitle text="La prochaine fois, un simple regard suffit" />
      <p className="text-base leading-normal text-ink-2">
        Active Face ID ou Touch ID sur cet appareil : tu reviendras dans l’arbre sans attendre
        d’email.
      </p>
      <button type="button" onClick={activate} disabled={pending} className={`${pillPrimary} mt-2`}>
        Activer Face ID ou Touch ID
      </button>
      <Link href="/tree" replace className={pillSecondary}>
        Plus tard
      </Link>
      {error ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : undefined}
      <p className="text-[13px] text-ink-3">
        Tu pourras l’activer à tout moment depuis ton compte.
      </p>
    </div>
  );
}
