// tdd-cover: e2e tests/e2e/app-shell.spec.ts
'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';

// Zone de page de l'écran d'app : elle seule défile, et seulement si la page est longue.
// Le défilement n'étant plus celui de la fenêtre, le navigateur ne le remet plus en
// haut : une nouvelle page repart du haut. Sur téléphone, son bas laisse la place à la
// barre d'onglets : rien ne passe dessous.

export function PageZone({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const zone = useRef<HTMLDivElement>(null); // allow-null: contrat des refs de React
  const shown = useRef(pathname);
  useEffect(() => {
    if (shown.current === pathname) return;
    shown.current = pathname;
    zone.current?.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div
      ref={zone}
      data-page-zone
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[var(--tab-bar-space)] md:pb-0"
    >
      {children}
    </div>
  );
}
