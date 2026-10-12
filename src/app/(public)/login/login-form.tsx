'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';

// Étapes « email » et « envoyé » de la maquette Connexion. La mise en scène
// finale (canevas, transitions) arrive en phase 5.

type Step = { name: 'email' } | { name: 'sent'; email: string };

const button =
  'h-[50px] w-full rounded-full text-[15px] font-semibold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export function LoginForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: 'email' });
  const [email, setEmail] = useState(defaultEmail);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function sendLink(event?: FormEvent) {
    event?.preventDefault();
    setPending(true);
    setError(undefined);
    const { error: failure } = await authClient.signIn.magicLink({ email, callbackURL: '/tree' });
    setPending(false);
    if (failure) {
      setError('L’envoi n’a pas abouti. Réessaie dans une minute.');
      return;
    }
    setStep({ name: 'sent', email });
  }

  async function signInWithPasskey() {
    setError(undefined);
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      setError('Aucune passkey reconnue sur cet appareil. Reçois plutôt un lien par email.');
      return;
    }
    router.push('/tree');
  }

  if (step.name === 'sent') {
    return (
      <div className="mt-8">
        <h2 className="font-display text-2xl">Regarde tes emails</h2>
        <p className="mt-3 text-[15px] text-ink-2">
          On vient d’envoyer un lien à <strong className="text-ink">{step.email}</strong>. Il est
          valable 15 minutes et ne sert qu’une fois.
        </p>
        <p className="mt-3 text-sm text-ink-2">
          Rien reçu ? Pense à regarder dans les indésirables.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => sendLink()}
            disabled={pending}
            className={`${button} border border-line bg-card text-ink`}
          >
            Renvoyer le lien
          </button>
          <button
            type="button"
            onClick={() => setStep({ name: 'email' })}
            className="text-sm font-medium text-ink-2 underline underline-offset-4"
          >
            Changer d’email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <form onSubmit={sendLink} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium text-ink-2">
          Ton email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email webauthn"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[50px] rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />
        <button type="submit" disabled={pending} className={`${button} bg-ink text-on-ink`}>
          Recevoir mon lien
        </button>
      </form>
      <button
        type="button"
        onClick={signInWithPasskey}
        className={`${button} border border-line bg-card text-ink`}
      >
        Me connecter avec une passkey
      </button>
      {error ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : undefined}
    </div>
  );
}
