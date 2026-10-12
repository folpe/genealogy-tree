import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Connexion' };

// Maquette Connexion : lien magique et passkey (better-auth). La mise en scène
// finale (canevas animé, étapes en URL) arrive en phase 5.
export default function LoginPage() {
  return (
    <main className="canvas-grid flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-card p-8 shadow-card">
        <p className="font-display text-2xl font-medium">Ances-Tree</p>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Bon retour
        </p>
        <h1 className="mt-2 font-display text-[32px] leading-tight">Entre dans l’arbre</h1>
        <p className="mt-3 text-[15px] text-ink-2">
          Pas de mot de passe. On t’envoie un lien de connexion par email.
        </p>

        <LoginForm />

        <p className="mt-8 border-t border-rule pt-6 text-sm text-ink-2">
          Un espace privé : seuls les membres invités voient l’arbre.
        </p>
      </div>
    </main>
  );
}
