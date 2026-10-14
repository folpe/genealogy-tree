// tdd-cover: e2e src/components/family/family-views.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addRelativeAction } from '@/actions/family.actions';
import { claimPersonAction } from '@/actions/members.actions';
import { AddRelative } from '@/components/family/add-relative';
import {
  parseAddIntent,
  relativeAnchor,
  relativeOptions,
} from '@/components/family/add-relative.helper';
import { BackToTree } from '@/components/family/back-to-tree';
import { PersonSheet } from '@/components/family/family-views';
import { personLabel } from '@/components/family/person.helper';
import { FAN_GENERATIONS } from '@/components/fan/fan.helper';
import { ClaimPersonForm } from '@/components/members/members-forms';
import { fanHref } from '@/lib/fan/fan.params';
import { treeHref } from '@/lib/tree/tree.params';
import { requireSession } from '@/server/auth/session';
import { getFamilyDeps } from '@/server/family/family.instance';
import { getTreeForViewer } from '@/server/family/family.service';
import { getMembersDeps } from '@/server/members/members.instance';
import { getViewerAccount } from '@/server/members/members.service';

export const metadata: Metadata = { title: 'Fiche' };

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ user }, { id }, query] = await Promise.all([requireSession(), params, searchParams]);
  const [tree, account] = await Promise.all([
    getTreeForViewer(getFamilyDeps(), user.id),
    getViewerAccount(getMembersDeps(), user.id),
  ]);
  const person = tree.persons.find((p) => p.id === id);
  if (!person) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <nav className="text-sm font-medium text-ink-2">
        <BackToTree />
      </nav>
      <PersonSheet tree={tree} personId={id} relation={tree.relations[id]} />
      <AddRelative
        key={id}
        anchor={relativeAnchor(person)}
        options={relativeOptions(tree, id)}
        intent={parseAddIntent(query['ajouter'])}
        action={addRelativeAction}
      />
      {account.isAdmin && !account.personId ? (
        <ClaimPersonForm action={claimPersonAction} personId={id} label={personLabel(person)} />
      ) : undefined}
      <nav aria-label="Voir dans l’arbre" className="flex flex-wrap gap-2">
        <Link
          href={treeHref({ view: 'couple', p: id, past: false })}
          className="flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Sa famille
        </Link>
        <Link
          href={treeHref({ view: 'descendants', p: id, past: false })}
          className="flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Ses descendants
        </Link>
        <Link
          href={treeHref({ view: 'hourglass', p: id, past: false })}
          className="flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Son sablier
        </Link>
        <Link
          href={fanHref({ p: id, generations: FAN_GENERATIONS.initial })}
          className="flex h-11 items-center rounded-full bg-card px-4 text-sm font-medium shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Ses ancêtres
        </Link>
      </nav>
    </main>
  );
}
