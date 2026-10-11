const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Le seed écrit des données fictives : il ne vise qu'une base locale ou une branche
 * Neon listée dans `SEED_ALLOWED_HOSTS` (dev, preview). Liste blanche plutôt que liste
 * noire : la branche de production n'a pas à être connue pour être protégée.
 */
export function assertSeedTarget(databaseUrl: string, allowedHosts: string): void {
  let host: string;
  try {
    host = new URL(databaseUrl).hostname.replace(/^\[|\]$/g, '');
  } catch {
    throw new Error('DATABASE_URL illisible');
  }
  const allowed = allowedHosts
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  if (LOCAL_HOSTS.has(host) || allowed.includes(host)) return;
  throw new Error(
    `Seed refusé sur ${host} : ajoute l'hôte à SEED_ALLOWED_HOSTS s'il s'agit d'une branche de dev ou de preview.`,
  );
}
