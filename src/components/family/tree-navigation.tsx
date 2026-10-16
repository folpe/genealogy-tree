// tdd-cover: e2e tests/e2e/tree-views.spec.ts
'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useTransition,
} from 'react';

// Changer de vue redemande l'arbre au serveur, et « Toute la famille » peut prendre du
// temps. Une même transition porte la navigation des réglages de l'arbre : les commandes
// prennent l'état demandé dès le tap (`optimistic`), le canevas montre qu'il se dessine
// tant que la transition dure (`pending`), et le nouvel arbre arrive d'un seul tenant.
// Sous une transition, Next garde l'ancien rendu au lieu de `loading.tsx` : sans elle,
// rien ne bougerait pendant l'attente.

type TreeNavigation = {
  pending: boolean;
  /** `optimistic` pose, dans la transition, l'état que les commandes montrent aussitôt. */
  navigate: (href: string, optimistic?: () => void) => void;
};

const TreeNavigationContext = createContext<TreeNavigation | undefined>(undefined);

export function TreeNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (href: string, optimistic?: () => void) => {
      startTransition(() => {
        optimistic?.();
        router.push(href);
      });
    },
    [router],
  );
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);
  return <TreeNavigationContext value={value}>{children}</TreeNavigationContext>;
}

/** L'arbre attend le serveur ; hors du fournisseur (tests du canevas), jamais. */
export function useTreePending(): boolean {
  return use(TreeNavigationContext)?.pending ?? false;
}

/**
 * Suit un lien des réglages dans la transition. Clic du milieu, touche de modification :
 * le navigateur garde la main (nouvel onglet, nouvelle fenêtre).
 */
export function useTreeLink() {
  const navigation = use(TreeNavigationContext);
  if (!navigation) throw new Error('useTreeLink hors de TreeNavigationProvider');
  const { navigate } = navigation;
  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string, optimistic?: () => void) => {
      const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
      if (event.defaultPrevented || event.button !== 0 || modified) return;
      event.preventDefault();
      navigate(href, optimistic);
    },
    [navigate],
  );
}

/** Navigation hors d'un lien (interrupteur) : même transition. */
export function useTreeNavigate() {
  const navigation = use(TreeNavigationContext);
  if (!navigation) throw new Error('useTreeNavigate hors de TreeNavigationProvider');
  return navigation.navigate;
}
