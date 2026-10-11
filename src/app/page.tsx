import { redirect } from 'next/navigation';

// L'arbre provisoire arrive au lot 5 ; d'ici là, tout mène à la connexion.
export default function Home() {
  redirect('/login');
}
