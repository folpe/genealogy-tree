import Link from 'next/link';
import type { MouseEvent } from 'react';
import type { RedactedPerson } from '@/server/access/access.redact';
import type { TreeForViewer } from '@/server/family/family.service';
import type { FuzzyDate, Union } from '@/server/family/family.types';
import { formatFuzzyDate } from '@/server/family/fuzzy-date.helper';
import { isDeceased, personInitials, personLabel } from './person.helper';
import { PersonBubble } from './person-bubble';

// Fiche d'une personne (phase 3, lot 5). Ne reçoit que l'arbre déjà filtré par la
// policy ; le panneau et la feuille mobile de la maquette arrivent en phase 5.

const FILIATIONS = new Set(['biologique', 'adoptive', 'inconnue']);

const UNION_KINDS: Record<Union['kind'], string> = {
  mariage: 'Mariage',
  pacs: 'Pacs',
  union_libre: 'Union libre',
  inconnu: 'Union',
};

const NOTICES: Partial<Record<RedactedPerson['level'], string>> = {
  family:
    'Personne vivante hors de ta branche directe : seules l’année et la ville de naissance ' +
    'sont visibles.',
  structure: 'Fiche restreinte à son cercle proche : seuls le nom et les liens sont visibles.',
  minor:
    'Fiche d’une personne mineure : hors de son cercle proche, seuls son prénom et son ' +
    'initiale sont visibles.',
};

function lifeEvent(
  event: { date?: FuzzyDate | undefined; place?: string | undefined } | undefined,
) {
  if (!event) return undefined;
  const parts = [event.date && formatFuzzyDate(event.date), event.place].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * Lien vers une autre fiche. Sur l'arbre, la fiche s'ouvre dans le panneau
 * (`onPick`) ; l'adresse reste celle de la fiche, pour un nouvel onglet.
 */
type PickPerson = ((id: string) => void) | undefined;

function PersonLink({ person, onPick }: { person: RedactedPerson; onPick: PickPerson }) {
  // Rendue côté serveur (page de la fiche), elle ne passe aucun gestionnaire à Link.
  const onClick = onPick
    ? (event: MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        onPick(person.id);
      }
    : undefined;
  return (
    <Link
      href={`/people/${person.id}`}
      {...(onClick ? { onClick } : {})}
      className="text-[15px] underline underline-offset-4"
    >
      {personLabel(person)}
    </Link>
  );
}

function PersonLinks({
  label,
  persons,
  onPick,
}: {
  label: string;
  persons: RedactedPerson[];
  onPick: PickPerson;
}) {
  if (persons.length === 0) return undefined;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">{label}</h2>
      <ul aria-label={label} className="mt-2 flex flex-col gap-1">
        {persons.map((p) => (
          <li key={p.id}>
            <PersonLink person={p} onPick={onPick} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function unionSummary(union: Union): string {
  const kind = UNION_KINDS[union.kind];
  if (!union.end) return union.start ? `${kind} depuis ${formatFuzzyDate(union.start)}` : kind;
  const start = union.start ? ` (${formatFuzzyDate(union.start)})` : '';
  const end = union.end.date ? ` (${formatFuzzyDate(union.end.date)})` : '';
  const how = { deces: 'veuvage', divorce: 'divorce', separation: 'séparation' }[union.end.reason];
  return `${kind}${start}, ${how}${end}`;
}

export function PersonSheet({
  tree,
  personId,
  heading = 'h1',
  bare = false,
  onPick,
}: {
  tree: TreeForViewer;
  personId: string;
  /** `h2` dans le panneau de l'arbre, sous le titre de la page. */
  heading?: 'h1' | 'h2';
  /** Sans carte : le panneau qui la contient en est déjà une. */
  bare?: boolean;
  /** Ouvre une autre fiche sur place (panneau de l'arbre). */
  onPick?: (id: string) => void;
}) {
  const Heading = heading;
  const byId = new Map(tree.persons.map((p) => [p.id, p]));
  const person = byId.get(personId);
  if (!person) return undefined;
  const pick = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const filiations = tree.parentChildren.filter((l) => FILIATIONS.has(l.kind));
  const parents = pick(filiations.filter((l) => l.childId === personId).map((l) => l.parentId));
  const children = pick(filiations.filter((l) => l.parentId === personId).map((l) => l.childId));
  const unions = tree.unions.filter((u) => u.partnerIds.includes(personId));

  const facts: [string, string | undefined][] =
    person.level === 'full' || person.level === 'family'
      ? [
          ['Naissance', lifeEvent(person.birth)],
          ['Décès', person.death ? (lifeEvent(person.death) ?? 'Date inconnue') : undefined],
          ['Réside à', person.level === 'full' ? person.residence : undefined],
        ]
      : [];
  const notice = NOTICES[person.level];

  return (
    <article
      className={`flex flex-col gap-6 ${bare ? '' : 'rounded-[var(--radius-card)] bg-card p-6 shadow-card md:p-8'}`}
    >
      <header className="flex flex-col items-start gap-4">
        <PersonBubble
          initials={personInitials(person)}
          deceased={isDeceased(person)}
          photo={tree.photos[personId]}
          size="sheet"
          name={personLabel(person)}
        />
        <div>
          <Heading className="font-display text-[32px] leading-tight">
            {personLabel(person)}
          </Heading>
          {person.level !== 'minor' && person.nickname ? (
            <p className="text-[15px] text-ink-2">Surnom : {person.nickname}</p>
          ) : undefined}
          {person.level !== 'minor' && person.birthName ? (
            <p className="text-[15px] text-ink-2">Nom de naissance : {person.birthName}</p>
          ) : undefined}
          {notice ? <p className="mt-3 text-sm text-ink-2">{notice}</p> : undefined}
        </div>
      </header>
      {facts.some(([, value]) => value) ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
          {facts.map(([label, value]) =>
            value ? (
              <div key={label} className="contents">
                <dt className="text-ink-2">{label}</dt>
                <dd>{value}</dd>
              </div>
            ) : undefined,
          )}
        </dl>
      ) : undefined}
      <PersonLinks label="Parents" persons={parents} onPick={onPick} />
      {unions.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">Unions</h2>
          <ul aria-label="Unions" className="mt-2 flex flex-col gap-1 text-[15px]">
            {unions.map((u) => {
              const partnerId = u.partnerIds.find((id) => id !== personId);
              const partner = partnerId ? byId.get(partnerId) : undefined;
              return (
                <li key={u.id}>
                  {partner ? <PersonLink person={partner} onPick={onPick} /> : 'Partenaire inconnu'}
                  <span className="text-ink-2"> : {unionSummary(u)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : undefined}
      <PersonLinks label="Enfants" persons={children} onPick={onPick} />
    </article>
  );
}
