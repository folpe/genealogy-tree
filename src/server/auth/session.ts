import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from './auth.instance';

/** Session vérifiée côté serveur (le proxy ne regarde que la présence du cookie). */
export async function requireSession() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  return session;
}
