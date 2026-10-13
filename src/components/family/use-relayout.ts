// tdd-cover: e2e tests/e2e/tree-fold.spec.ts
'use client';

import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import type { CameraController } from '@/motion/camera';
import { animateRelayout, type Relayout } from '@/motion/relayout';
import type { TreeDrawing, TreeNode } from './tree-drawing';

// Passage d'un dessin au suivant. Après un pliage, rien ne bouge (même placement) :
// les bulles cachées s'effacent en fantômes, celles qui reviennent apparaissent.
// Après un nouveau rendu serveur (données ou vue changées), la caméra prend les
// nouvelles bornes et chaque bulle glisse de son ancienne place à la nouvelle.

export function useRelayout({
  drawing,
  camera,
  elements,
  links,
  ghosts,
}: {
  drawing: TreeDrawing;
  camera: CameraController | undefined;
  elements: RefObject<Map<string, HTMLElement>>;
  links: RefObject<Element | null>; // allow-null: contrat des refs de React
  ghosts: RefObject<HTMLElement | null>; // allow-null: contrat des refs de React
}): TreeNode[] {
  const previous = useRef(drawing);
  const motion = useRef<Omit<Relayout, 'leaving' | 'links'>>(undefined);
  const [leaving, setLeaving] = useState<TreeNode[]>([]);
  /** Arrête la transition en cours en la posant à sa fin : un pliage peut en couper un autre. */
  const finish = useRef<() => void>(undefined);
  const generation = useRef(0);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = drawing;
    if (before === drawing) return;
    finish.current?.();
    generation.current += 1;
    const now = new Map(drawing.nodes.map((n) => [n.id, n]));
    const was = new Map(before.nodes.map((n) => [n.id, n]));
    if (camera && (drawing.width !== before.width || drawing.height !== before.height)) {
      camera.setContent({ width: drawing.width, height: drawing.height });
      camera.jump(camera.get());
    }
    const moved: Relayout['moved'] = [];
    const entered: HTMLElement[] = [];
    for (const [id, element] of elements.current) {
      const target = now.get(id);
      const origin = was.get(id);
      if (!target) continue;
      if (!origin) entered.push(element);
      else moved.push({ element, dx: origin.x - target.x, dy: origin.y - target.y });
    }
    motion.current = { moved, entered };
    setLeaving(before.nodes.filter((n) => !now.has(n.id)));
  }, [drawing, camera, elements]);

  // Une fois les fantômes rendus : la transition, puis leur retrait.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `leaving` déclenche la transition, une fois les fantômes à l'écran.
  useLayoutEffect(() => {
    const pending = motion.current;
    if (!pending) return;
    motion.current = undefined;
    const current = generation.current;
    const leavingElements = [...(ghosts.current?.children ?? [])].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    finish.current = animateRelayout(
      { ...pending, leaving: leavingElements, links: links.current ?? undefined },
      () => {
        // Une transition coupée par un pliage suivant ne retire pas ses fantômes.
        if (generation.current === current) setLeaving([]);
      },
    );
  }, [leaving, ghosts, links]);
  useLayoutEffect(() => () => finish.current?.(), []);

  return leaving;
}
