import type { CSSProperties, ReactNode } from 'react';
import { BrandGlyph } from '@/components/app/brand-glyph';

// Mise en scène de la maquette Connexion : à gauche un canevas à trame avec un petit arbre,
// à droite la carte des étapes. Sur téléphone, la carte seule, la marque en tête.
// Avant connexion, rien de la famille ne s'affiche : l'arbre du canevas est anonyme.

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper p-3 sm:p-6 lg:flex lg:h-dvh lg:gap-5 lg:overflow-hidden lg:p-8">
      <section
        aria-hidden="true"
        className="canvas-grid relative hidden min-w-0 flex-[1_1_560px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line p-10 lg:flex"
      >
        <BrandLockup />
        <FamilySketch />
        <div className="flex max-w-[460px] flex-col gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Arbre de famille
          </p>
          <p className="font-display text-[34px] leading-[1.15] tracking-[-0.01em]">
            Toutes les générations, une seule histoire.
          </p>
          <p className="text-[15px] leading-normal text-ink-2">
            Un espace privé : seuls les membres invités voient l’arbre.
          </p>
        </div>
      </section>
      <main className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-[520px] flex-col rounded-[var(--radius-card)] border border-line bg-card px-6 py-10 shadow-card sm:min-h-0 sm:px-[52px] sm:py-12 lg:mx-0 lg:flex-[1_1_420px] lg:overflow-y-auto">
        {/* Centré quand il tient, défilant dans la carte sinon (demande d'accès sur écran bas). */}
        <div className="my-auto flex flex-col">
          <BrandLockup className="mb-10 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}

function BrandLockup({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center gap-3 ${className}`}>
      <span className="grid size-10 place-items-center rounded-full bg-ink text-on-ink">
        <BrandGlyph size={22} className="brand-draw" />
      </span>
      <span className="font-display text-2xl font-medium tracking-[-0.01em]">Ances-Tree</span>
    </p>
  );
}

// Le petit arbre de la maquette, sur sa grille de 520 x 380 : deux aïeux, leurs enfants,
// toi en accent, une place encore inconnue en pointillés. Rangées : 0 en haut.
const SKETCH_W = 520;
const SKETCH_H = 380;
const BUBBLE = 64;

type SketchBubble = { x: number; y: number; row: number; kind: 'past' | 'living' | 'ghost' | 'me' };

const BUBBLES: SketchBubble[] = [
  { x: 200, y: 60, row: 0, kind: 'past' },
  { x: 320, y: 60, row: 0, kind: 'past' },
  { x: 120, y: 200, row: 1, kind: 'living' },
  { x: 300, y: 200, row: 1, kind: 'living' },
  { x: 420, y: 200, row: 1, kind: 'living' },
  { x: 160, y: 330, row: 2, kind: 'ghost' },
  { x: 300, y: 330, row: 2, kind: 'living' },
  { x: 420, y: 330, row: 2, kind: 'me' },
];

const LINKS = [
  { d: 'M200 60 L320 60', row: 0 },
  { d: 'M260 60 C260 150 120 130 120 200', row: 0 },
  { d: 'M260 60 C260 150 300 130 300 200', row: 0 },
  { d: 'M300 200 L420 200', row: 1 },
  { d: 'M360 200 C360 290 300 270 300 330', row: 1 },
  { d: 'M360 200 C360 290 420 270 420 330', row: 1 },
];

const BUBBLE_CLASS: Record<SketchBubble['kind'], string> = {
  past: 'border-4 border-card bg-bubble-past shadow-bubble',
  living: 'border-4 border-card bg-bubble shadow-bubble',
  ghost: 'border-2 border-dashed border-link bg-surface text-ink-3',
  me: 'border-4 border-card bg-bubble text-ink shadow-bubble-selected',
};

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const rowStyle = (row: number): CSSProperties & { '--row': number } => ({ '--row': row });

function FamilySketch() {
  return (
    <div className="relative aspect-[520/380] w-full max-w-[520px] self-center">
      <svg
        viewBox={`0 0 ${SKETCH_W} ${SKETCH_H}`}
        aria-hidden="true"
        fill="none"
        strokeLinecap="round"
        strokeWidth="2"
        className="absolute inset-0 size-full stroke-link"
      >
        {LINKS.map((link) => (
          <path
            key={link.d}
            d={link.d}
            pathLength={1}
            className="sketch-link"
            style={rowStyle(link.row)}
          />
        ))}
        <path
          d="M120 200 C120 290 160 270 160 330"
          strokeDasharray="2 7"
          className="sketch-ghost"
          style={rowStyle(1)}
        />
      </svg>
      {BUBBLES.map((bubble) => (
        <span
          key={`${bubble.x}-${bubble.y}`}
          className={`sketch-bubble absolute grid place-items-center rounded-full font-display text-xl ${BUBBLE_CLASS[bubble.kind]}`}
          style={{
            ...rowStyle(bubble.row),
            left: pct(bubble.x - BUBBLE / 2, SKETCH_W),
            top: pct(bubble.y - BUBBLE / 2, SKETCH_H),
            width: pct(BUBBLE, SKETCH_W),
            height: pct(BUBBLE, SKETCH_H),
          }}
        >
          {bubble.kind === 'ghost' ? '?' : bubble.kind === 'me' ? 'Toi' : undefined}
        </span>
      ))}
    </div>
  );
}
