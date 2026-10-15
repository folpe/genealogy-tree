import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import type { RedactedPerson } from '@/server/access/access.redact';
import type { TreeForViewer } from '@/server/family/family.service';
import type { FuzzyDate, Union } from '@/server/family/family.types';
import { formatFuzzyDate } from '@/server/family/fuzzy-date.helper';
import { relativesOf } from './fiche.helper';
import { EditableName, EditableRow } from './fiche-edit';
import { PhotoPicker } from './fiche-photo';
import { TrashButton } from './fiche-trash';
import { isDeceased, lifeYears, personInitials, personLabel } from './person.helper';
import { PersonBubble } from './person-bubble';

// Fiche d'une personne (maquette Arbre, panneau « Fiche »). Ne reçoit que l'arbre déjà
// filtré par la policy. En tête, la personne ; dessous, des lignes à filets : les faits,
// puis les proches en pastilles, qui ouvrent leur fiche sur place dans l'arbre.

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

function unionSummary(union: Union): string {
  const kind = UNION_KINDS[union.kind];
  if (!union.end) return union.start ? `${kind} depuis ${formatFuzzyDate(union.start)}` : kind;
  const start = union.start ? ` (${formatFuzzyDate(union.start)})` : '';
  const end = union.end.date ? ` (${formatFuzzyDate(union.end.date)})` : '';
  const how = { deces: 'veuvage', divorce: 'divorce', separation: 'séparation' }[union.end.reason];
  return `${kind}${start}, ${how}${end}`;
}

/**
 * Ouvre une autre fiche. Sur l'arbre, sur place (`onPick`) ; l'adresse reste celle de
 * la fiche, pour un nouvel onglet.
 */
type PickPerson = ((id: string) => void) | undefined;

/** Pastille d'un proche : sa bulle et son prénom ; son nom complet pour les lecteurs d'écran. */
function PersonChip({
  person,
  tree,
  onPick,
}: {
  person: RedactedPerson;
  tree: TreeForViewer;
  onPick: PickPerson;
}) {
  const me = person.id === tree.viewerPersonId;
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
      aria-label={me ? `${personLabel(person)}, toi` : personLabel(person)}
      {...(onClick ? { onClick } : {})}
      className="flex h-[38px] items-center gap-2 rounded-full bg-paper py-1 pr-3.5 pl-1 text-sm text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <PersonBubble
        initials={personInitials(person)}
        deceased={isDeceased(person)}
        photo={tree.photos[person.id]}
        size="chip"
        name=""
      />
      {me ? 'Toi' : person.firstName}
    </Link>
  );
}

/** Ligne à filet : un intitulé à gauche, sa valeur à droite. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-rule py-3.5">
      <dt className="shrink-0 pt-[9px] text-sm text-ink-2">{label}</dt>
      <dd className="flex min-w-0 flex-wrap justify-end gap-1.5 text-right text-[15px]">
        {children}
      </dd>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return undefined;
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-rule py-3.5">
      <dt className="shrink-0 text-sm text-ink-2">{label}</dt>
      <dd className="min-w-0 text-right text-[15px] [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function PeopleRow({
  label,
  people,
  tree,
  onPick,
}: {
  label: string;
  people: RedactedPerson[];
  tree: TreeForViewer;
  onPick: PickPerson;
}) {
  if (people.length === 0) return undefined;
  return (
    <Row label={label}>
      <ul aria-label={label} className="flex flex-wrap justify-end gap-1.5">
        {people.map((p) => (
          <li key={p.id}>
            <PersonChip person={p} tree={tree} onPick={onPick} />
          </li>
        ))}
      </ul>
    </Row>
  );
}

function UnionsRow({
  unions,
  tree,
  onPick,
}: {
  unions: ReturnType<typeof relativesOf>['unions'];
  tree: TreeForViewer;
  onPick: PickPerson;
}) {
  if (unions.length === 0) return undefined;
  return (
    <Row label={unions.length > 1 ? 'Unions' : 'Union'}>
      <ul aria-label="Unions" className="flex flex-col items-end gap-2">
        {unions.map(({ union, partner }) => (
          <li key={union.id} className="flex flex-col items-end gap-1">
            {partner ? (
              <PersonChip person={partner} tree={tree} onPick={onPick} />
            ) : (
              <span className="text-[15px]">Partenaire inconnu</span>
            )}
            <span className="text-[13px] text-ink-2">{unionSummary(union)}</span>
          </li>
        ))}
      </ul>
    </Row>
  );
}

function SheetHeader({
  tree,
  person,
  relation,
  heading,
  editable,
}: {
  tree: TreeForViewer;
  person: RedactedPerson;
  relation: string | undefined;
  heading: 'h1' | 'h2';
  /** Le nom se modifie en touchant le titre ; surnom et nom de naissance ont leur ligne. */
  editable: boolean;
}) {
  const Heading = heading;
  const bubble = (
    <PersonBubble
      initials={personInitials(person)}
      deceased={isDeceased(person)}
      photo={tree.photos[person.id]}
      size="sheet"
      name={personLabel(person)}
    />
  );
  const titleClass =
    'mt-3 font-display text-[30px] leading-[1.1] tracking-[-0.01em] [text-wrap:balance] md:text-[32px]';
  const feminine = person.gender === 'femme';
  const birthName =
    person.level !== 'minor' && person.birthName && person.birthName !== person.lastName
      ? `${feminine ? 'née' : 'né'} ${person.birthName}`
      : undefined;
  const sourced = person.level === 'full' && person.sourcedFields.length > 0;
  return (
    <header className="flex flex-col items-center gap-1.5 text-center">
      {editable && person.level === 'full' ? (
        <PhotoPicker personId={person.id}>{bubble}</PhotoPicker>
      ) : (
        bubble
      )}
      {editable && person.level === 'full' ? (
        <EditableName
          personId={person.id}
          firstName={person.firstName}
          lastName={person.lastName}
          heading={heading}
          className={titleClass}
        >
          {personLabel(person)}
        </EditableName>
      ) : (
        <Heading className={titleClass}>{personLabel(person)}</Heading>
      )}
      {relation ? (
        <p className="text-[15px] text-accent">
          {relation.charAt(0).toUpperCase() + relation.slice(1)}
        </p>
      ) : undefined}
      {!editable && person.level !== 'minor' && person.nickname ? (
        <p className="text-sm text-ink-2">Surnom : {person.nickname}</p>
      ) : undefined}
      {!editable && birthName ? <p className="text-sm text-ink-2">{birthName}</p> : undefined}
      {lifeYears(person) ? (
        <p className="text-sm text-ink-2 tabular-nums">{lifeYears(person)}</p>
      ) : undefined}
      {sourced ? (
        <span className="mt-1 inline-flex h-[26px] items-center gap-1.5 rounded-full border border-line px-2.5 text-xs text-ink-2">
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20 6L9 17l-5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sourcé
        </span>
      ) : undefined}
    </header>
  );
}

const GENDER_LABELS: Record<string, string> = {
  femme: 'Femme',
  homme: 'Homme',
  autre: 'Autre',
  inconnu: 'Non renseigné',
};

/** Les faits d'une fiche qu'on peut modifier : chaque ligne se touche pour se changer. */
function EditableFacts({ person }: { person: Extract<RedactedPerson, { level: 'full' }> }) {
  return (
    <>
      <EditableRow
        personId={person.id}
        field="birth"
        label="Naissance"
        display={lifeEvent(person.birth)}
        spec={{
          kind: 'event',
          death: false,
          deceased: false,
          date: person.birth?.date,
          place: person.birth?.place,
        }}
      />
      <EditableRow
        personId={person.id}
        field="death"
        label="Décès"
        // Vivante : « En vie », pas « à compléter », qui laisserait croire à un décès.
        display={person.death ? (lifeEvent(person.death) ?? 'Date inconnue') : 'En vie'}
        spec={{
          kind: 'event',
          death: true,
          deceased: person.death !== undefined,
          date: person.death?.date,
          place: person.death?.place,
        }}
      />
      <EditableRow
        personId={person.id}
        field="residence"
        label="Réside à"
        display={person.residence}
        spec={{ kind: 'text', value: person.residence, placeholder: 'Ville' }}
      />
      <EditableRow
        personId={person.id}
        field="birthName"
        label="Nom de naissance"
        display={person.birthName}
        spec={{ kind: 'text', value: person.birthName }}
      />
      <EditableRow
        personId={person.id}
        field="nickname"
        label="Surnom"
        display={person.nickname}
        spec={{ kind: 'text', value: person.nickname }}
      />
      <EditableRow
        personId={person.id}
        field="gender"
        label="Genre"
        display={GENDER_LABELS[person.gender]}
        spec={{ kind: 'gender', value: person.gender }}
      />
    </>
  );
}

export function PersonSheet({
  tree,
  personId,
  heading = 'h1',
  bare = false,
  relation,
  onPick,
}: {
  tree: TreeForViewer;
  personId: string;
  /** `h2` dans le panneau de l'arbre, sous le titre de la page. */
  heading?: 'h1' | 'h2';
  /** Sans carte : le panneau qui la contient en est déjà une. */
  bare?: boolean;
  /** Lien avec le lecteur (« ton père »), sous le nom. */
  relation?: string | undefined;
  /** Ouvre une autre fiche sur place (panneau de l'arbre). */
  onPick?: (id: string) => void;
}) {
  const person = tree.persons.find((p) => p.id === personId);
  if (!person) return undefined;
  const r = relativesOf(tree, personId);
  const shows = person.level === 'full' || person.level === 'family';
  const editable = tree.editableIds.includes(person.id) && person.level === 'full';
  const notice = NOTICES[person.level];
  return (
    <article
      className={`flex flex-col gap-6 ${bare ? '' : 'rounded-[var(--radius-card)] bg-card p-6 shadow-card md:p-8'}`}
    >
      <SheetHeader
        tree={tree}
        person={person}
        relation={relation}
        heading={heading}
        editable={editable}
      />
      <dl className="flex flex-col [&>div:first-child]:border-t-0">
        {editable && person.level === 'full' ? (
          <EditableFacts person={person} />
        ) : (
          <>
            <FactRow label="Naissance" value={shows ? lifeEvent(person.birth) : undefined} />
            <FactRow
              label="Décès"
              value={
                shows && person.death ? (lifeEvent(person.death) ?? 'Date inconnue') : undefined
              }
            />
            <FactRow
              label="Réside à"
              value={person.level === 'full' ? person.residence : undefined}
            />
          </>
        )}
        <PeopleRow label="Parents" people={r.parents} tree={tree} onPick={onPick} />
        <PeopleRow label="Frères et sœurs" people={r.siblings} tree={tree} onPick={onPick} />
        <PeopleRow
          label="Demi-frères et sœurs"
          people={r.halfSiblings}
          tree={tree}
          onPick={onPick}
        />
        <UnionsRow unions={r.unions} tree={tree} onPick={onPick} />
        <PeopleRow label="Enfants" people={r.children} tree={tree} onPick={onPick} />
        <PeopleRow label="A aussi été élevé par" people={r.raisedBy} tree={tree} onPick={onPick} />
        <PeopleRow label="A élevé" people={r.raised} tree={tree} onPick={onPick} />
        {person.level !== 'full' ? undefined : editable ? (
          <EditableRow
            personId={person.id}
            field="notes"
            label="Note"
            display={person.notes}
            spec={{ kind: 'note', value: person.notes }}
          />
        ) : person.notes ? (
          // Maquette Arbre : la note ferme la fiche, sous un filet, en texte secondaire.
          <div className="border-t border-rule py-3.5">
            <dt className="sr-only">Note</dt>
            <dd className="text-sm leading-relaxed whitespace-pre-line text-ink-2">
              {person.notes}
            </dd>
          </div>
        ) : undefined}
      </dl>
      {tree.trashableIds.includes(person.id) ? (
        <TrashButton personId={person.id} name={personLabel(person)} />
      ) : undefined}
      {notice ? (
        <p className="rounded-2xl bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          {notice}
        </p>
      ) : undefined}
    </article>
  );
}
