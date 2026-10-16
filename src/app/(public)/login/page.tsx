import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { googleSignInEnabled } from '@/env';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Connexion' };

/** Refus du crochet d'admission à la création du compte : better-auth le nomme ainsi. */
const GOOGLE_NOT_INVITED = 'unable_to_create_user';
/** Retour de Google quand on y renonce. */
const GOOGLE_CANCELLED = 'access_denied';

/** Message d'un retour en erreur : lien magique par défaut, Google si `via=google`. */
function noticeFor(error: string | string[] | undefined, via: string | string[] | undefined) {
  if (!error) return undefined;
  if (via !== 'google') {
    return 'Ce lien n’est plus valable : il a déjà servi, ou il a expiré. Demande-en un nouveau.';
  }
  if (error === GOOGLE_NOT_INVITED) {
    return 'Cette adresse Google n’a pas reçu d’invitation. Connecte-toi avec l’adresse de ton invitation, ou demande l’accès.';
  }
  if (error === GOOGLE_CANCELLED) return 'Connexion avec Google annulée.';
  return 'La connexion avec Google n’a pas abouti. Réessaie, ou reçois plutôt un lien.';
}

// Maquette Connexion : lien magique, puis passkey proposée (/login/passkey) ; Google
// en plus s'il est configuré. Un lien expiré ou déjà servi revient ici avec
// `?error=…` (better-auth), un échec Google avec `?via=google&error=…`.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; via?: string | string[] }>;
}) {
  const { error, via } = await searchParams;
  return (
    <AuthShell>
      <LoginForm
        notice={noticeFor(error, via)}
        google={googleSignInEnabled()}
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
