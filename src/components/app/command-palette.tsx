// tdd-cover: e2e tests/e2e/command-palette.spec.ts
'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Dialog } from 'radix-ui';
import { useCallback, useEffect, useState } from 'react';
import { searchDirectoryAction } from '@/actions/family.actions';
import type { SearchDirectory } from '@/server/family/family.service';
import { isDeceased, personInitials } from '../family/person.helper';
import { PersonBubble } from '../family/person-bubble';
import { type PaletteItem, paletteItems, pushRecent, recentItems } from './command-palette.helper';

// « Trouver quelqu'un » (plan phase 5, lot 5) : ⌘K ou Ctrl+K partout, ou le bouton de
// l'en-tête. L'annuaire (déjà filtré par la policy) se charge à la première ouverture,
// puis la recherche tourne dans le navigateur. Les récents restent sur l'appareil.

const RECENT_KEY = 'ances-tree:recent';

function readRecent(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    // Stockage refusé : on perd seulement la liste des récents.
  }
}

type Load =
  | { state: 'idle' | 'loading' | 'error' }
  | { state: 'ready'; directory: SearchDirectory };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [load, setLoad] = useState<Load>({ state: 'idle' });

  const fetchDirectory = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      setLoad({ state: 'ready', directory: await searchDirectoryAction() });
    } catch {
      setLoad({ state: 'error' });
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setOpen((wasOpen) => !wasOpen);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (open && (load.state === 'idle' || load.state === 'error')) void fetchDirectory();
  }, [open, load.state, fetchDirectory]);

  function choose(id: string) {
    writeRecent(pushRecent(readRecent(), id));
    setOpen(false);
    setQuery('');
    router.push(`/people/${id}`);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Trouver quelqu’un"
        aria-keyshortcuts="Meta+K Control+K"
        className="flex size-11 items-center justify-center gap-2.5 rounded-full border border-line bg-surface text-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:h-[46px] lg:w-auto lg:min-w-[220px] lg:justify-start lg:px-4"
      >
        <SearchIcon />
        <span className="hidden flex-1 text-left text-[15px] lg:inline">Trouver quelqu’un</span>
        <kbd className="hidden font-sans text-xs text-ink-2 lg:inline">⌘K</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content className="fixed inset-x-3 top-3 z-50 mx-auto max-w-xl overflow-hidden rounded-[var(--radius-card)] bg-card text-ink shadow-float focus-visible:outline-none md:top-[12vh]">
          <Dialog.Title className="sr-only">Trouver quelqu’un</Dialog.Title>
          <Dialog.Description className="sr-only">
            Un prénom, un nom ou un nom de naissance ; Entrée ouvre la fiche.
          </Dialog.Description>
          <Command shouldFilter={false} loop label="Trouver quelqu’un">
            <div className="flex items-center gap-3 border-b border-rule px-5">
              <SearchIcon />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Un prénom, un nom, « née Roux »…"
                className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-2"
              />
            </div>
            <Command.List className="max-h-[min(60dvh,440px)] overflow-y-auto p-2">
              <Results load={load} query={query} onChoose={choose} onRetry={fetchDirectory} />
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Results({
  load,
  query,
  onChoose,
  onRetry,
}: {
  load: Load;
  query: string;
  onChoose: (id: string) => void;
  onRetry: () => void;
}) {
  const note = 'px-3 py-6 text-center text-[15px] text-ink-2';
  if (load.state === 'error') {
    return (
      <div className={note}>
        La famille n’a pas pu être chargée.{' '}
        <button type="button" onClick={onRetry} className="min-h-11 underline underline-offset-2">
          Réessayer
        </button>
      </div>
    );
  }
  if (load.state !== 'ready')
    return <Command.Loading className={note}>Chargement…</Command.Loading>;
  if (query.trim() === '') {
    const recent = recentItems(load.directory, readRecent());
    if (recent.length === 0) {
      return <p className={note}>Tape un prénom, un nom ou un nom de naissance.</p>;
    }
    return (
      <Command.Group heading="Récemment consultés" className={GROUP}>
        {recent.map((item) => (
          <Result key={item.id} item={item} onChoose={onChoose} />
        ))}
      </Command.Group>
    );
  }
  const items = paletteItems(load.directory, query);
  if (items.length === 0) {
    return (
      <Command.Empty className={note}>
        Personne de ce nom. Essaie un nom de naissance.
      </Command.Empty>
    );
  }
  return items.map((item) => <Result key={item.id} item={item} onChoose={onChoose} />);
}

const GROUP =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ink-2 [&_[cmdk-group-heading]]:uppercase';

function Result({ item, onChoose }: { item: PaletteItem; onChoose: (id: string) => void }) {
  return (
    <Command.Item
      value={item.id}
      onSelect={onChoose}
      className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 data-[selected=true]:bg-canvas"
    >
      <PersonBubble
        initials={personInitials(item.person)}
        deceased={isDeceased(item.person)}
        photo={undefined}
        size="result"
        name=""
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-display text-[17px]">{item.name}</span>
        {item.detail ? (
          <span className="truncate text-sm text-ink-2">{item.detail}</span>
        ) : undefined}
      </span>
      {item.relation ? (
        <span className="shrink-0 text-right text-sm text-accent">{item.relation}</span>
      ) : undefined}
    </Command.Item>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
