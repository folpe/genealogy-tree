import Link from 'next/link';
import type { RedactedPerson } from '@/server/access/access.redact';
import type { TreeForViewer } from '@/server/family/family.service';
import type { FuzzyDate, Union } from '@/server/family/family.types';
import { formatFuzzyDate } from '@/server/family/fuzzy-date.helper';
import type { PersonPhoto } from '@/server/media/media.url';

// Rendu provisoire de l'arbre (phase 3, lot 5) : une liste par génération et une
// fiche. Ne reçoit que l'arbre déjà filtré par la policy ; le rendu graphique de
// la maquette Arbre arrive en phase 4.

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

function personLabel(person: RedactedPerson): string {
  if (person.level === 'minor') return `${person.firstName} ${person.initials.slice(1)}.`;
  return `${person.firstName} ${person.lastName}`;
}

function initials(person: RedactedPerson): string {
  if (person.level === 'minor') return person.initials;
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

const BUBBLES = {
  chip: { box: 'size-[30px] border-2 text-[11px]', sizes: '30px' },
  sheet: { box: 'size-[120px] border-[5px] text-[42px]', sizes: '120px' },
} as const;

/**
 * Bulle de la maquette (DESIGN.md) : la photo si le service en a signé une, sinon
 * les initiales. L'aperçu flou occupe la bulle pendant le chargement. `name` vide :
 * la photo est décorative, le nom suit déjà dans le même lien.
 */
function PersonBubble({
  person,
  photo,
  size,
  name,
}: {
  person: RedactedPerson;
  photo: PersonPhoto | undefined;
  size: keyof typeof BUBBLES;
  name: string;
}) {
  const { box, sizes } = BUBBLES[size];
  const past = (person.level === 'full' || person.level === 'family') && person.death;
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border-card bg-cover bg-center font-display shadow-bubble ${box} ${past ? 'bg-bubble-past' : 'bg-bubble'}`}
      style={photo?.blurDataUrl ? { backgroundImage: `url("${photo.blurDataUrl}")` } : undefined}
    >
      {photo ? (
        // biome-ignore lint/performance/noImgElement: dérivées déjà produites et signées par le serveur ; l'optimiseur de Next les retéléchargerait.
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={sizes}
          width={photo.width}
          height={photo.height}
          alt={name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials(person)}</span>
      )}
    </span>
  );
}

const yearOf = (date: FuzzyDate) => (date.precision === 'entre' ? date.from : date.year);

function lifeYears(person: RedactedPerson): string | undefined {
  if (person.level === 'minor' || person.level === 'structure') return undefined;
  const birth = person.birth?.date ? String(yearOf(person.birth.date)) : undefined;
  if (!person.death) return birth;
  const death = person.death.date ? String(yearOf(person.death.date)) : '?';
  return `${birth ?? '?'} - ${death}`;
}

function lifeEvent(
  event: { date?: FuzzyDate | undefined; place?: string | undefined } | undefined,
) {
  if (!event) return undefined;
  const parts = [event.date && formatFuzzyDate(event.date), event.place].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function GenerationList({ tree }: { tree: TreeForViewer }) {
  if (tree.persons.length === 0) {
    return (
      <p className="text-[15px] text-ink-2">
        L’arbre est encore vide : les fiches de la famille arrivent avec la reprise des données.
      </p>
    );
  }
  const rows: RedactedPerson[][] = [];
  for (const person of tree.persons) {
    const level = tree.generations[person.id] ?? 0;
    rows[level] = [...(rows[level] ?? []), person];
  }

  return (
    <div className="flex flex-col gap-6">
      {rows.map((row, i) => (
        <section
          // biome-ignore lint/suspicious/noArrayIndexKey: une génération est désignée par son rang.
          key={i}
          aria-labelledby={`generation-${i}`}
          className="rounded-[var(--radius-panel)] border border-line bg-card p-4"
        >
          <h2
            id={`generation-${i}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-accent"
          >
            Génération {i + 1}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {row.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/people/${person.id}`}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-line py-1 pr-4 pl-1.5 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <PersonBubble
                    person={person}
                    photo={tree.photos[person.id]}
                    size="chip"
                    name=""
                  />
                  <span className="font-medium">{personLabel(person)}</span>
                  {lifeYears(person) ? (
                    <span className="text-sm text-ink-2"> {lifeYears(person)}</span>
                  ) : undefined}
                  {person.id === tree.viewerPersonId ? (
                    <span className="text-xs font-semibold text-accent"> c’est toi</span>
                  ) : undefined}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PersonLinks({ label, persons }: { label: string; persons: RedactedPerson[] }) {
  if (persons.length === 0) return undefined;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">{label}</h2>
      <ul aria-label={label} className="mt-2 flex flex-col gap-1">
        {persons.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`} className="text-[15px] underline underline-offset-4">
              {personLabel(p)}
            </Link>
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

export function PersonSheet({ tree, personId }: { tree: TreeForViewer; personId: string }) {
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
    <article className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-card p-6 shadow-card md:p-8">
      <header className="flex flex-col items-start gap-4">
        <PersonBubble
          person={person}
          photo={tree.photos[personId]}
          size="sheet"
          name={personLabel(person)}
        />
        <div>
          <h1 className="font-display text-[32px] leading-tight">{personLabel(person)}</h1>
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
      <PersonLinks label="Parents" persons={parents} />
      {unions.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">Unions</h2>
          <ul aria-label="Unions" className="mt-2 flex flex-col gap-1 text-[15px]">
            {unions.map((u) => {
              const partnerId = u.partnerIds.find((id) => id !== personId);
              const partner = partnerId ? byId.get(partnerId) : undefined;
              return (
                <li key={u.id}>
                  {partner ? (
                    <Link href={`/people/${partner.id}`} className="underline underline-offset-4">
                      {personLabel(partner)}
                    </Link>
                  ) : (
                    'Partenaire inconnu'
                  )}
                  <span className="text-ink-2"> : {unionSummary(u)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : undefined}
      <PersonLinks label="Enfants" persons={children} />
    </article>
  );
}
