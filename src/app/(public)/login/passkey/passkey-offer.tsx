'use client';

import { useState } from 'react';
import { FaceIcon, Kicker, pillPrimary, pillSecondary, StepBadge } from '@/components/auth/auth-ui';
import { RevealTitle } from '@/components/auth/reveal-title';
import { authClient } from '@/lib/auth-client';

// Étape « passkey » de la maquette Connexion : juste après le lien magique, une passkey
// sur cet appareil évite l'email la prochaine fois. Refuser ou échouer ne bloque rien.
// L'arbre s'ouvre par un chargement complet : son entrée ne se joue qu'au premier
// document de l'onglet (TREE_ENTRY_SCRIPT), pas après une navigation côté client.

/** `firstName` peut être vide : un compte sans nom reçoit un simple « Bienvenue ». */
export function PasskeyOffer({ firstName }: { firstName: string }) {
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
    globalThis.location.replace('/tree');
  }

  return (
    <div className="flex flex-col items-center gap-[18px] text-center">
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
      <a
        href="/tree"
        // Remplace l'entrée : le bouton Retour depuis l'arbre ne repropose pas la passkey.
        onClick={(event) => {
          event.preventDefault();
          globalThis.location.replace('/tree');
        }}
        className={pillSecondary}
      >
        Plus tard
      </a>
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
