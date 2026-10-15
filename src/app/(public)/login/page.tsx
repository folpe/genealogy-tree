import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Connexion' };

// Maquette Connexion : lien magique, puis passkey proposée (/login/passkey).
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm
        footer={
          <div className="flex flex-col gap-2 text-center text-sm text-ink-2">
            <p>
              Pas encore invité ?{' '}
              <Link
                href="/request-access"
                className="font-semibold text-accent underline underline-offset-4 hover:text-accent-strong"
              >
                Demander l’accès
              </Link>
            </p>
            {/* Sur grand écran, le canevas le dit déjà. */}
            <p className="lg:hidden">Un espace privé : seuls les membres invités voient l’arbre.</p>
          </div>
        }
      />
    </AuthShell>
  );
}
