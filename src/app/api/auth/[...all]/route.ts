import { getAuth } from '@/server/auth/auth.instance';

// Handlers paresseux : l'instance (et la validation de l'env) n'est créée qu'à la requête.
export function GET(request: Request) {
  return getAuth().handler(request);
}

export function POST(request: Request) {
  return getAuth().handler(request);
}
