'use client';

import { useEffect } from 'react';

// Le clavier virtuel ne réduit pas l'écran de mise en page, ni sur Safari iOS ni sur
// Chrome Android : il recouvre seulement le bas de la vue visible. Un panneau posé en bas
// passe dessous, champ compris. On mesure la part couverte avec `visualViewport` et on
// l'expose en `--keyboard-inset`, que les panneaux du bas ajoutent à leur marge. La
// feuille vaul se replace seule (`repositionInputs`) ; il lui manque le champ ramené en vue.
// Elle ne doit pas lire `--keyboard-inset` : la compensation serait comptée deux fois.
// `interactive-widget=resizes-content` réglerait Chrome seul : Safari l'ignore, on garde
// un seul mécanisme pour les deux.

export type ViewportBox = {
  layoutHeight: number;
  visualHeight: number;
  visualTop: number;
  scale: number;
};

/**
 * Hauteur cachée sous le clavier, en px entiers ; zéro quand rien ne couvre le bas.
 * Zoomée à deux doigts (iOS l'autorise malgré `user-scalable=no`), la vue rétrécit
 * aussi : ce n'est pas le clavier, on ne compense rien.
 */
export function keyboardInset({ layoutHeight, visualHeight, visualTop, scale }: ViewportBox) {
  if (Math.abs(scale - 1) > 0.01) return 0;
  return Math.max(0, Math.round(layoutHeight - visualHeight - visualTop));
}

/** Les champs qui appellent le clavier : eux seuls sont ramenés en vue. */
const TYPING = 'input, textarea, select, [contenteditable]';

const VARIABLE = '--keyboard-inset';

/**
 * Tient `--keyboard-inset` à jour et garde le champ focalisé en vue quand le clavier
 * monte, y compris dans une zone qui défile (feuille de la fiche, page de fiche).
 */
function useKeyboardInset(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    let last = 0;
    let frame = 0;
    const measure = () => {
      const inset = keyboardInset({
        layoutHeight: window.innerHeight,
        visualHeight: viewport.height,
        visualTop: viewport.offsetTop,
        scale: viewport.scale,
      });
      root.style.setProperty(VARIABLE, `${inset}px`);
      // Le panneau vient de remonter : le champ en cours peut être sorti de sa zone.
      if (inset > last) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const active = document.activeElement;
          if (active?.matches(TYPING)) active.scrollIntoView({ block: 'nearest' });
        });
      }
      last = inset;
    };
    measure();
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
      cancelAnimationFrame(frame);
      root.style.removeProperty(VARIABLE);
    };
  }, []);
}

/** Monté une fois, au layout racine : rien à afficher, seulement la mesure. */
export function KeyboardInset() {
  useKeyboardInset();
  return undefined;
}
