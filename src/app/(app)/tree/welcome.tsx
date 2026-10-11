'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

// Accueil provisoire de l'espace connecté : l'arbre arrive au lot 5. Reprend
// l'étape « passkey » de la maquette Connexion.

const button =
  'h-[50px] w-full rounded-full text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export function Welcome({ email, hasPasskey }: { email: string; hasPasskey: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | undefined>();

  async function activatePasskey() {
    const result = await authClient.passkey.addPasskey();
    setStatus(
      result?.error
        ? 'Pas de souci, tu pourras l’activer plus tard depuis ton profil.'
        : 'C’est fait. La prochaine fois, un simple regard suffit.',
    );
  }

  async function signOut() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-[15px] text-ink-2">
        Connecté avec <strong className="text-ink">{email}</strong>.
      </p>
      {hasPasskey ? undefined : (
        <>
          <p className="mt-4 text-[15px] text-ink-2">
            Active Face ID ou Touch ID sur cet appareil : tu reviendras dans l’arbre sans attendre
            d’email.
          </p>
          <button
            type="button"
            onClick={activatePasskey}
            className={`${button} bg-ink text-on-ink`}
          >
            Activer Face ID / Touch ID
          </button>
        </>
      )}
      <p role="status" className="text-sm text-ink-2">
        {status}
      </p>
      <button
        type="button"
        onClick={signOut}
        className={`${button} border border-line bg-card text-ink`}
      >
        Me déconnecter
      </button>
    </div>
  );
}
