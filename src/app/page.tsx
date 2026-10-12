import { redirect } from 'next/navigation';

// Sans session, le proxy renvoie vers la connexion avant d'arriver ici.
export default function Home() {
  redirect('/tree');
}
