'use client';

import Link from 'next/link';
import { type KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TreeLink } from '@/lib/tree/tree.routes';
import type { TreeDrawing, TreeNode } from './family-tree.helper';
import { PersonBubble } from './person-bubble';

// Canevas de l'arbre (plan phase 4, lot 3). Le placement arrive tout calculé du
// serveur : ce composant ne fait que dessiner et gérer le clavier. Les liens sont un
// SVG sous les bulles ; les bulles sont des liens HTML (photo en srcset, focus natif,
// ouverture dans un nouvel onglet), comme dans la maquette Arbre. La caméra (lot 4)
// transformera le calque intérieur ; d'ici là, le canevas défile.

/** Marge autour du placement, pour que les bulles du bord ne touchent pas le cadre. */
const PADDING = 48;
const BUBBLE_RADIUS = 38;
const NODE_HALF_WIDTH = 60;

const MOVES: Record<string, (node: TreeNode, row: TreeNode[]) => string | undefined> = {
  ArrowLeft: (node) => node.left,
  ArrowRight: (node) => node.right,
  ArrowUp: (node) => node.up,
  ArrowDown: (node) => node.down,
  Home: (_, row) => row[0]?.id,
  End: (_, row) => row.at(-1)?.id,
};

const TreeLinks = memo(function TreeLinks({
  links,
  width,
  height,
}: {
  links: TreeLink[];
  width: number;
  height: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      className="pointer-events-none absolute overflow-visible"
      style={{ left: PADDING, top: PADDING }}
    >
      {links.map((link) => (
        <path
          key={link.id}
          d={link.d}
          className={`fill-none stroke-link [stroke-linecap:round] ${
            link.kind === 'raised' ? '[stroke-dasharray:4_6] [stroke-width:1.5]' : 'stroke-2'
          }`}
        />
      ))}
    </svg>
  );
});

const TreeItem = memo(function TreeItem({
  node,
  active,
  register,
  onFocus,
  onKeyDown,
}: {
  node: TreeNode;
  active: boolean;
  register: (id: string, element: HTMLAnchorElement | undefined) => void;
  onFocus: (id: string) => void;
  onKeyDown: (id: string, event: KeyboardEvent<HTMLAnchorElement>) => void;
}) {
  const tone = node.me ? 'text-accent' : node.deceased ? 'text-ink-2' : 'text-ink';
  return (
    <Link
      href={`/people/${node.id}`}
      prefetch={false}
      ref={(element) => register(node.id, element ?? undefined)}
      role="treeitem"
      aria-level={node.row + 1}
      aria-label={node.label}
      tabIndex={active ? 0 : -1}
      onFocus={() => onFocus(node.id)}
      onKeyDown={(event) => onKeyDown(node.id, event)}
      className="group absolute flex w-[120px] flex-col items-center outline-none"
      style={{ left: node.x - NODE_HALF_WIDTH + PADDING, top: node.y - BUBBLE_RADIUS + PADDING }}
    >
      <span className="rounded-full outline-offset-2 group-hover:motion-safe:scale-[1.03] group-focus-visible:outline-2 group-focus-visible:outline-ink motion-safe:transition-transform">
        <PersonBubble
          initials={node.initials}
          deceased={node.deceased}
          photo={node.photo}
          size="tree"
          name=""
        />
      </span>
      <span className={`mt-1.5 max-w-full truncate font-display text-[17px] ${tone}`}>
        {node.name}
      </span>
      {node.years ? (
        <span className="text-xs text-ink-2 tabular-nums">{node.years}</span>
      ) : undefined}
    </Link>
  );
});

export function FamilyTree({
  drawing,
  focusId,
}: {
  drawing: TreeDrawing;
  /** Bulle de départ : celle du lecteur. */
  focusId: string | undefined;
}) {
  const { nodes, links, unknownPartners, width, height } = drawing;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const rows = useMemo(() => {
    const grouped = new Map<number, TreeNode[]>();
    for (const node of nodes) grouped.set(node.row, [...(grouped.get(node.row) ?? []), node]);
    return grouped;
  }, [nodes]);
  const start = focusId && byId.has(focusId) ? focusId : nodes[0]?.id;
  const [activeId, setActiveId] = useState(start);
  const canvas = useRef<HTMLDivElement>(null); // allow-null: contrat des refs de React
  const elements = useRef(new Map<string, HTMLAnchorElement>());

  // À l'ouverture, la bulle de départ au centre du canevas.
  useEffect(() => {
    const node = start ? byId.get(start) : undefined;
    const element = canvas.current;
    if (!node || !element) return;
    element.scrollLeft = node.x + PADDING - element.clientWidth / 2;
    element.scrollTop = node.y + PADDING - element.clientHeight / 2;
  }, [byId, start]);

  // Rappels stables : une flèche ne re-rend que les deux bulles dont l'état change.
  const register = useCallback((id: string, element: HTMLAnchorElement | undefined) => {
    if (element) elements.current.set(id, element);
    else elements.current.delete(id);
  }, []);

  const onKeyDown = useCallback(
    (id: string, event: KeyboardEvent<HTMLAnchorElement>) => {
      const move = MOVES[event.key];
      const node = byId.get(id);
      if (!move || !node || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = move(node, rows.get(node.row) ?? []);
      event.preventDefault();
      if (!target) return;
      setActiveId(target);
      elements.current.get(target)?.focus();
    },
    [byId, rows],
  );

  if (nodes.length === 0) {
    return (
      <p className="text-[15px] text-ink-2">
        L’arbre est encore vide : les fiches de la famille arrivent avec la reprise des données.
      </p>
    );
  }

  return (
    <div
      ref={canvas}
      className="canvas-grid h-[calc(100dvh-9rem)] min-h-[420px] overflow-auto overscroll-contain rounded-[var(--radius-panel)] border border-line"
    >
      <div
        className="relative mx-auto"
        style={{ width: width + PADDING * 2, height: height + PADDING * 2 }}
      >
        <TreeLinks links={links} width={width} height={height} />
        {unknownPartners.map((slot) => (
          <div
            key={slot.id}
            aria-hidden="true"
            className="absolute flex w-[120px] flex-col items-center"
            style={{
              left: slot.x - NODE_HALF_WIDTH + PADDING,
              top: slot.y - BUBBLE_RADIUS + PADDING,
            }}
          >
            <span className="grid size-[76px] place-items-center rounded-full border-2 border-link border-dashed font-display text-[24px] text-ink-2">
              ?
            </span>
            <span className="mt-1.5 text-xs text-ink-2">À découvrir</span>
          </div>
        ))}
        <div role="tree" aria-label="Arbre de la famille" className="absolute inset-0">
          {nodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              active={node.id === activeId}
              register={register}
              onFocus={setActiveId}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
