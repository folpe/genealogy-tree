'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTreeHref } from '../family/back-to-tree';

// Onglets des vues (DESIGN.md, `NavPills`) : Arbre et Ancêtres pour l'instant ; Frise,
// Carte et Récits les rejoindront avec leurs écrans (phases 7 et 8).

const pill =
  'flex h-[38px] items-center rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:px-[18px]';

export function NavPills() {
  const pathname = usePathname();
  const treeHref = useTreeHref();
  const views = [
    { label: 'Arbre', href: treeHref, base: '/tree' },
    { label: 'Ancêtres', href: '/ancestors', base: '/ancestors' },
  ];
  return (
    <nav aria-label="Vues" className="flex gap-0.5 rounded-full border border-line bg-surface p-1">
      {views.map(({ label, href, base }) => {
        const current = pathname === base || pathname.startsWith(`${base}/`);
        return (
          <Link
            key={base}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={`${pill} ${current ? 'bg-ink font-semibold text-on-ink' : 'text-ink-2'}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
