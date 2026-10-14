'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTreeHref } from '../family/back-to-tree';

// Onglets des vues (DESIGN.md, `NavPills`) : Arbre et Ancêtres pour l'instant ; Frise,
// Carte et Récits les rejoindront avec leurs écrans (phases 7 et 8). Sur ordinateur,
// dans l'en-tête : pilule de 38 px comme la maquette, zone de toucher de 44. Sur
// téléphone (maquette Mobile), en bas, sous le pouce : pilule flottante, onglets de
// 46 px qui se partagent la largeur.

export type NavPlacement = 'header' | 'bar';

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

const STYLES: Record<NavPlacement, { nav: string; pill: string }> = {
  header: {
    nav: 'flex gap-0.5 rounded-full border border-line bg-surface p-1',
    pill: `relative flex h-[38px] items-center rounded-full px-4 text-sm font-medium after:absolute after:inset-x-0 after:-inset-y-[3px] md:px-[18px] ${focus}`,
  },
  bar: {
    nav: 'flex w-full rounded-full border border-line bg-card p-1.5 shadow-float',
    pill: `flex h-[46px] flex-1 items-center justify-center rounded-full text-[13px] font-medium ${focus}`,
  },
};

export function NavPills({ placement }: { placement: NavPlacement }) {
  const pathname = usePathname();
  const treeHref = useTreeHref();
  const style = STYLES[placement];
  const views = [
    { label: 'Arbre', href: treeHref, base: '/tree' },
    { label: 'Ancêtres', href: '/ancestors', base: '/ancestors' },
  ];
  return (
    <nav aria-label="Vues" data-placement={placement} className={style.nav}>
      {views.map(({ label, href, base }) => {
        const current = pathname === base || pathname.startsWith(`${base}/`);
        return (
          <Link
            key={base}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={`${style.pill} ${current ? 'bg-ink font-semibold text-on-ink' : 'text-ink-2'}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
