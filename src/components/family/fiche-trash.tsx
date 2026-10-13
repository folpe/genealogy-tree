// tdd-cover: e2e tests/e2e/fiche-trash.writes.spec.ts
'use client';

import { useRouter } from 'next/navigation';
import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { restorePersonAction, trashPersonAction } from '@/actions/family.actions';

// Corbeille (choix de Folpe) : la fiche quitte l'arbre sans être effacée, après une
// confirmation qui dit qu'un admin peut la restaurer. L'admin restaure depuis sa page.

export function TrashButton({ personId, name }: { personId: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const confirm = () =>
    start(async () => {
      try {
        const result = await trashPersonAction(personId);
        if (!result.ok) return setError(result.error);
        router.push('/tree');
      } catch {
        setError('La fiche n’a pas pu aller à la corbeille. Réessaie dans un instant.');
      }
    });
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="mx-auto flex min-h-11 items-center text-sm text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        Mettre à la corbeille
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/30" />
        <AlertDialog.Content className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-[var(--radius-card)] bg-card p-6 shadow-float focus-visible:outline-none md:top-1/2 md:bottom-auto md:-translate-y-1/2">
          <AlertDialog.Title className="font-display text-2xl">
            Mettre {name} à la corbeille ?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-[15px] text-ink-2">
            Sa fiche quitte l’arbre, avec ses liens. Rien n’est effacé : un admin peut la restaurer.
          </AlertDialog.Description>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-accent">
              {error}
            </p>
          ) : undefined}
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel className="h-[50px] rounded-full border border-line px-6 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Garder la fiche
            </AlertDialog.Cancel>
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className="h-[50px] rounded-full bg-ink px-6 text-[15px] font-semibold text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
            >
              {pending ? 'Un instant…' : 'Mettre à la corbeille'}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function RestoreButton({ personId, name }: { personId: string; name: string }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        aria-label={`Restaurer ${name}`}
        onClick={() =>
          start(async () => {
            const result = await restorePersonAction(personId);
            if (!result.ok) setError(result.error);
          })
        }
        className="h-11 rounded-full border border-line px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
      >
        {pending ? 'Un instant…' : 'Restaurer'}
      </button>
      {error ? (
        <p role="alert" className="text-[13px] text-accent">
          {error}
        </p>
      ) : undefined}
    </div>
  );
}
