import type { Closure } from '@/lib/tree/tree.contest';

// Annonce d'un pli posé tout seul (zéro croisement, décision de Folpe du 2026-10-17) :
// une phrase courte, au prénom, dans la région d'état du canevas.

type Names = Record<string, { name: string; me?: boolean }>;

const list = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : (names[0] ?? '');

/** « Famille de Sophie repliée pour garder l'arbre lisible » ; vide sans pli. */
export function closureNotice(closed: readonly Closure[], people: Names): string {
  const nameOf = (id: string) => people[id]?.name ?? '';
  const families = closed.filter((c) => c.kind === 'family').map((c) => c.personId);
  const branches = closed.filter((c) => c.kind === 'branch').map((c) => c.personId);
  const parts: string[] = [];
  const mine = families.find((id) => people[id]?.me);
  const others = families.filter((id) => id !== mine).map(nameOf);
  if (mine) parts.push('ta famille');
  if (others.length > 0)
    parts.push(`${others.length > 1 ? 'familles' : 'famille'} de ${list(others)}`);
  if (branches.length > 0) {
    parts.push(`${branches.length > 1 ? 'branches' : 'branche'} de ${list(branches.map(nameOf))}`);
  }
  if (parts.length === 0) return '';
  const plural = parts.length > 1 || families.length > 1 || branches.length > 1;
  const text = `${list(parts)} ${plural ? 'repliées' : 'repliée'} pour garder l’arbre lisible`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
