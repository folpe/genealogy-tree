import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Connexion' };

// Étape « email » de la maquette Connexion. L'envoi du lien et la passkey
// arrivent avec better-auth (phase 3, lot 4) ; la mise en scène finale en phase 5.
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

        <form className="mt-8 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium text-ink-2">
            Ton email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-[50px] rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ink"
          />
          <button
            type="submit"
            disabled
            aria-describedby="login-status"
            className="h-[50px] rounded-full bg-ink text-[15px] font-semibold text-on-ink disabled:opacity-60"
          >
            Recevoir mon lien
          </button>
          <p id="login-status" className="text-sm text-ink-2">
            Les comptes ouvrent très bientôt.
          </p>
        </form>

        <p className="mt-8 border-t border-rule pt-6 text-sm text-ink-2">
          Un espace privé : seuls les membres invités voient l’arbre.
        </p>
      </div>
    </main>
  );
}
