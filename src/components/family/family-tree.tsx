'use client';

import Link, { useLinkStatus } from 'next/link';
import {
  type KeyboardEvent,
  memo,
  type Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type Camera,
  cameraFraming,
  cameraOn,
  nodesInView,
  type Rect,
  type Size,
  VIRTUALIZE_ABOVE,
  visibleWorld,
} from '@/lib/tree/tree.camera';
import { recallCamera, rememberCamera, type TreeMemory } from '@/lib/tree/tree.memory';
import { DEFAULT_METRICS } from '@/lib/tree/tree.metrics';
import type { PathHighlight } from '@/lib/tree/tree.path';
import type { TreeLink } from '@/lib/tree/tree.routes';
import type { CameraController } from '@/motion/camera';
import type { DisplayedGraph } from '@/server/family/family.display';
import { PersonBubble } from './person-bubble';
import type { BranchHandle, TreeDrawing, TreeNode } from './tree-drawing';
import { readTreeMemory, writeTreeMemory } from './tree-memory.storage';
import { TreeMinimap } from './tree-minimap';
import { useFoldedTree } from './use-folded-tree';
import { useRelayout } from './use-relayout';
import { useTreeCamera } from './use-tree-camera';

// Canevas de l'arbre (plan phase 4, lots 3 à 5). Le placement arrive tout calculé du
// serveur ; les liens sont un SVG sous les bulles, les bulles des liens HTML (photo
// en srcset, focus natif, nouvel onglet), comme dans la maquette Arbre. Un seul
// calque porte le tout : la caméra (`src/motion/camera.ts`) le transforme hors React.
//
// Zoom sémantique : la caméra pose `data-detail` (far, mid, near) sur le canevas, et
// chaque bulle porte déjà ses trois rendus ; le CSS montre le bon, sans re-rendu.
//
// Branches : sur le trait de chaque branche, une poignée la plie ou la déplie. Rien
// d'autre ne bouge, le dessin plié garde le placement d'origine (`use-folded-tree.ts`) ;
// les bulles cachées s'effacent, celles qui reviennent apparaissent (`use-relayout.ts`).

/** Sélecteurs du niveau de détail, posé sur le canevas (`group/canvas`). */
const FAR_HIDDEN = 'group-data-[detail=far]/canvas:hidden';
const NEAR_HIDDEN = 'group-data-[detail=near]/canvas:hidden';
const ONLY_FAR = 'hidden group-data-[detail=far]/canvas:block';
/** Nom complet de près : deux lignes au plus (line-clamp fixe lui-même l'affichage). */
const ONLY_NEAR_CLAMPED = 'hidden group-data-[detail=near]/canvas:line-clamp-2';
/** Teintes des générations, vues de loin (globals.css, `--color-gen-*`). */
const GENERATION_TINTS = 5;

const BUBBLE = DEFAULT_METRICS.bubble;
const BUBBLE_RADIUS = BUBBLE / 2;
/** Sous la bulle, la place du prénom et des années, d'où partent les branches. */
const LABEL_HEIGHT = DEFAULT_METRICS.nodeHeight - BUBBLE;
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
  ref,
  links,
  width,
  height,
  lit,
}: {
  ref: Ref<SVGSVGElement>;
  links: TreeLink[];
  width: number;
  height: number;
  /** Traits du lien de parenté en cours : en accent, les autres estompés. */
  lit: ReadonlySet<string> | undefined;
}) {
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      width={width}
      height={height}
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
    >
      {links.map((link) => (
        <path
          key={link.id}
          d={link.d}
          // De loin, le trait garde son épaisseur à l'écran au lieu de s'effacer.
          className={`fill-none [stroke-linecap:round] transition-opacity group-data-[detail=far]/canvas:[vector-effect:non-scaling-stroke] ${
            link.kind === 'raised'
              ? `[stroke-dasharray:4_6] [stroke-width:1.5] ${FAR_HIDDEN}`
              : 'stroke-2'
          } ${!lit ? 'stroke-link' : lit.has(link.id) ? 'stroke-accent [stroke-width:3.5]' : 'stroke-link opacity-25'}`}
        />
      ))}
    </svg>
  );
});

/**
 * Bulle touchée, fiche en route : un anneau tourne autour d'elle aussitôt. Les bulles
 * ne préchargent pas leur fiche (des centaines de liens) : sans lui, rien ne
 * montrerait que le tap a pris (Next 16, `useLinkStatus`).
 */
function PendingRing() {
  const { pending } = useLinkStatus();
  if (!pending) return undefined;
  return (
    <span
      aria-hidden="true"
      data-link-pending
      className="pointer-events-none absolute -top-1 left-1/2 size-[84px] -translate-x-1/2 rounded-full border-[3px] border-accent border-t-transparent motion-safe:animate-spin"
    />
  );
}

const TreeItem = memo(function TreeItem({
  node,
  active,
  selected,
  onPath,
  onOpen,
  expanded,
  register,
  onFocus,
  onKeyDown,
}: {
  node: TreeNode;
  active: boolean;
  selected: boolean;
  /** Sur le chemin du lien de parenté en cours ; absent sans lien affiché. */
  onPath: boolean | undefined;
  onOpen: ((id: string) => void) | undefined;
  /** Branche dépliée ou pliée ; absent si la bulle n'a pas d'enfant. */
  expanded: boolean | undefined;
  register: (id: string, element: HTMLElement | undefined) => void;
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
      aria-expanded={expanded}
      aria-selected={selected}
      data-on-path={onPath}
      tabIndex={active ? 0 : -1}
      draggable={false}
      onFocus={() => onFocus(node.id)}
      onKeyDown={(event) => onKeyDown(node.id, event)}
      onClick={(event) => {
        // Nouvel onglet (⌘, Ctrl, Maj, clic du milieu) : la page de la fiche, comme un lien.
        if (!onOpen || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        onOpen(node.id);
      }}
      className={`group absolute flex w-[120px] flex-col items-center outline-none transition-opacity ${onPath === false ? 'opacity-30' : ''}`}
      style={{ left: node.x - NODE_HALF_WIDTH, top: node.y - BUBBLE_RADIUS }}
    >
      <PendingRing />
      <span
        className={`rounded-full outline-offset-2 group-hover:motion-safe:scale-[1.03] group-focus-visible:outline-2 group-focus-visible:outline-ink motion-safe:transition-transform ${selected ? 'shadow-bubble-selected' : ''}`}
      >
        <span className={FAR_HIDDEN}>
          <PersonBubble
            initials={node.initials}
            deceased={node.deceased}
            photo={node.photo}
            size="tree"
            name=""
          />
        </span>
        <span
          aria-hidden="true"
          className={`${ONLY_FAR} size-[76px] rounded-full ${node.me ? 'bg-accent' : ''}`}
          style={
            node.me
              ? undefined
              : { backgroundColor: `var(--color-gen-${node.row % GENERATION_TINTS})` }
          }
        />
      </span>
      {node.branchesBelow ? (
        // Vue de loin, sans étiquette : relie la pastille à sa branche, au trait des liens.
        <span
          aria-hidden="true"
          className={`${ONLY_FAR} absolute left-1/2 w-[calc(2px/var(--cam-k,1))] -translate-x-1/2 bg-link`}
          style={{ top: BUBBLE, height: LABEL_HEIGHT }}
        />
      ) : undefined}
      <span
        className={`mt-1.5 max-w-full truncate font-display text-[17px] ${tone} ${FAR_HIDDEN} ${NEAR_HIDDEN}`}
      >
        {node.name}
      </span>
      <span
        className={`${ONLY_NEAR_CLAMPED} mt-1.5 max-w-full text-center font-display text-[15px] leading-tight ${tone}`}
      >
        {node.fullName}
      </span>
      {node.years ? (
        <span className={`text-xs text-ink-2 tabular-nums ${FAR_HIDDEN}`}>{node.years}</span>
      ) : undefined}
    </Link>
  );
});

/** Bulle qui quitte l'arbre (branche pliée) : visible le temps de s'effacer. */
function TreeGhost({ node }: { node: TreeNode }) {
  return (
    <div
      className="absolute flex w-[120px] flex-col items-center"
      style={{ left: node.x - NODE_HALF_WIDTH, top: node.y - BUBBLE_RADIUS }}
    >
      <PersonBubble
        initials={node.initials}
        deceased={node.deceased}
        photo={node.photo}
        size="tree"
        name=""
      />
      <span className={`mt-1.5 font-display text-[17px] text-ink-2 ${FAR_HIDDEN}`}>
        {node.name}
      </span>
    </div>
  );
}

function UnknownPartners({ slots }: { slots: TreeDrawing['unknownPartners'] }) {
  return slots.map((slot) => (
    <div
      key={slot.id}
      aria-hidden="true"
      className="absolute flex w-[120px] flex-col items-center"
      style={{ left: slot.x - NODE_HALF_WIDTH, top: slot.y - BUBBLE_RADIUS }}
    >
      <span className="grid size-[76px] place-items-center rounded-full border-2 border-link border-dashed font-display text-[24px] text-ink-2">
        ?
      </span>
      <span className={`mt-1.5 text-xs text-ink-2 ${FAR_HIDDEN}`}>À découvrir</span>
    </div>
  ));
}

/** Poignée posée au départ de la branche, à taille d'écran constante (cible de 44 px). */
const BranchToggle = memo(function BranchToggle({
  branch,
  folded,
  hidden,
  onToggle,
}: {
  branch: BranchHandle;
  folded: boolean;
  hidden: number;
  onToggle: (branch: BranchHandle) => void;
}) {
  // Hors du Tab (l'arbre se parcourt aux flèches, « + » et « - » plient) ; reste
  // atteignable au doigt, à la souris et par un lecteur d'écran.
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-expanded={!folded}
      aria-label={
        folded
          ? `Déplier la branche de ${branch.owners}, ${hidden} ${hidden > 1 ? 'personnes' : 'personne'}`
          : `Replier la branche de ${branch.owners}`
      }
      onClick={() => onToggle(branch)}
      className={`${FAR_HIDDEN} group/toggle absolute grid size-11 -translate-x-1/2 -translate-y-1/2 scale-[calc(1/var(--cam-k,1))] cursor-pointer place-items-center`}
      style={{ left: branch.x, top: branch.y }}
    >
      <span
        aria-hidden="true"
        className="grid h-6 min-w-6 place-items-center rounded-full bg-card px-1.5 font-semibold text-ink-2 text-xs tabular-nums shadow-float group-hover/toggle:text-ink"
      >
        {folded ? `+${hidden}` : '−'}
      </span>
    </button>
  );
});

/** Marge d'écran sous laquelle une bulle prise au clavier fait bouger la caméra. */
const REVEAL_MARGIN = 80;
const ZOOM_STEP = 1.4;

function CanvasControls({
  camera,
  home,
}: {
  camera: CameraController | undefined;
  home: (() => void) | undefined;
}) {
  const button =
    'grid size-[46px] place-items-center rounded-full bg-card text-ink shadow-float ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
    'disabled:opacity-40';
  return (
    <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
      {home ? (
        <button
          type="button"
          onClick={home}
          disabled={!camera}
          className="h-[46px] rounded-full bg-card px-4 font-medium text-[15px] shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40"
        >
          Me retrouver
        </button>
      ) : undefined}
      <button
        type="button"
        aria-label="Zoomer"
        disabled={!camera}
        onClick={() => camera?.zoomTo(camera.get().k * ZOOM_STEP)}
        className={button}
      >
        <span aria-hidden="true" className="text-[22px] leading-none">
          +
        </span>
      </button>
      <button
        type="button"
        aria-label="Dézoomer"
        disabled={!camera}
        onClick={() => camera?.zoomTo(camera.get().k / ZOOM_STEP)}
        className={button}
      >
        <span aria-hidden="true" className="text-[22px] leading-none">
          −
        </span>
      </button>
    </div>
  );
}

function useRows(nodes: TreeNode[]) {
  return useMemo(() => {
    const grouped = new Map<number, TreeNode[]>();
    for (const node of nodes) grouped.set(node.row, [...(grouped.get(node.row) ?? []), node]);
    return grouped;
  }, [nodes]);
}

export function FamilyTree({
  drawing: initial,
  graph,
  focusId,
  centerId,
  viewKey = '/tree',
  selectedId,
  onOpen,
  highlight,
  coveredTop = 0,
}: {
  /** Premier dessin, calculé au rendu serveur. */
  drawing: TreeDrawing;
  /** Graphe dessiné, pour replacer l'arbre dans le navigateur après un pliage. */
  graph: DisplayedGraph;
  /** Bulle de départ : celle du lecteur. */
  focusId: string | undefined;
  /** Personne au centre de la vue (lot 6) : départ de la caméra, qui y revient quand la vue change. */
  centerId?: string | undefined;
  /** URL de la vue : la position retenue ne revient que dans la même vue. */
  viewKey?: string;
  /** Fiche ouverte à côté de l'arbre : sa bulle est cerclée d'accent. */
  selectedId?: string | undefined;
  /** Ouvre la fiche sans quitter l'arbre ; sans lui, la bulle mène à la page de la fiche. */
  onOpen?: ((id: string) => void) | undefined;
  /** Lien de parenté éclairé (« Notre lien ») : la caméra cadre son chemin. */
  highlight?: PathHighlight | undefined;
  /** Hauteur couverte en haut du canevas (carte du lien) : le cadrage l'évite. */
  coveredTop?: number;
}) {
  const fold = useFoldedTree(initial, graph);
  const { nodes, width, height } = fold.drawing;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const rows = useRows(nodes);
  const me = focusId ? byId.get(focusId) : undefined;
  const startId = centerId ?? focusId;
  const start = (startId ? byId.get(startId) : undefined) ?? me ?? nodes[0];
  // Le rendu serveur se cale sur le premier dessin : un pliage ne doit pas le déplacer.
  const first =
    (startId ? initial.nodes.find((n) => n.id === startId) : undefined) ?? initial.nodes[0];
  const [chosenId, setActiveId] = useState(start?.id);
  // Une bulle disparue (nouveau rendu serveur, branche pliée) n'emporte pas le Tab.
  const activeId = chosenId && byId.has(chosenId) ? chosenId : start?.id;
  const viewport = useRef<HTMLDivElement>(null); // allow-null: contrat des refs de React
  const layer = useRef<HTMLDivElement>(null); // allow-null: contrat des refs de React
  const linksRef = useRef<SVGSVGElement>(null); // allow-null: contrat des refs de React
  const ghostsRef = useRef<HTMLDivElement>(null); // allow-null: contrat des refs de React
  const elements = useRef(new Map<string, HTMLElement>());
  const pendingFocus = useRef<string | undefined>(undefined);
  const content = useMemo<Size>(() => ({ width, height }), [width, height]);
  const [view, setView] = useState<Rect>();
  // Retour d'une fiche : l'arbre revient là où on l'avait laissé, plis compris.
  // Lue une seule fois par affichage de l'arbre : un remontage (StrictMode) ne doit pas
  // relire une mémoire déjà réécrite par le premier montage.
  const memory = useRef<{ read: boolean; value: TreeMemory | undefined }>({
    read: false,
    value: undefined,
  });
  const restore = useCallback(() => {
    if (!memory.current.read) memory.current = { read: true, value: readTreeMemory() };
    const remembered = memory.current.value;
    return remembered?.view === viewKey ? recallCamera(remembered, nodes) : undefined;
  }, [nodes, viewKey]);
  const onSettle = useCallback(
    (state: Camera, size: Size) => {
      if (nodes.length > VIRTUALIZE_ABOVE) setView(visibleWorld(state, size));
      else setView(undefined);
      const remembered = rememberCamera(state, nodes, [...fold.folded], viewKey);
      if (remembered) writeTreeMemory(remembered);
    },
    [nodes, fold.folded, viewKey],
  );
  const camera = useTreeCamera({ viewport, layer, content, start, restore, onSettle });
  // Un nouveau lien éclairé : la caméra cadre tout son chemin, et recadre quand la carte
  // a pris sa hauteur. Un pli ensuite ne la déplace pas : les bulles sont relues ici.
  const nodesById = useRef(byId);
  nodesById.current = byId;
  useEffect(() => {
    if (!camera || !highlight) return;
    const onPath = [...highlight.persons].flatMap((id) => nodesById.current.get(id) ?? []);
    if (onPath.length === 0) return;
    const rect = {
      x0: Math.min(...onPath.map((n) => n.x)) - NODE_HALF_WIDTH,
      y0: Math.min(...onPath.map((n) => n.y)) - BUBBLE_RADIUS,
      x1: Math.max(...onPath.map((n) => n.x)) + NODE_HALF_WIDTH,
      y1: Math.max(...onPath.map((n) => n.y)) + BUBBLE_RADIUS + LABEL_HEIGHT,
    };
    camera.flyTo(cameraFraming(rect, camera.viewport(), camera.limits(), { top: coveredTop }));
  }, [camera, highlight, coveredTop]);
  const leaving = useRelayout({
    drawing: fold.drawing,
    camera,
    elements,
    links: linksRef,
    ghosts: ghostsRef,
  });

  // Rappels stables : une flèche ne re-rend que les deux bulles dont l'état change.
  const register = useCallback((id: string, element: HTMLElement | undefined) => {
    if (element) elements.current.set(id, element);
    else elements.current.delete(id);
  }, []);

  // Une bulle prise au clavier, hors de l'écran ou trop près du bord : la caméra y va.
  const onFocus = useCallback(
    (id: string) => {
      setActiveId(id);
      const node = byId.get(id);
      if (!camera || !node) return;
      const state = camera.get();
      const { width: w, height: h } = camera.viewport();
      const screenX = node.x * state.k + state.x;
      const screenY = node.y * state.k + state.y;
      const inside =
        Math.abs(screenX) < w / 2 - REVEAL_MARGIN && Math.abs(screenY) < h / 2 - REVEAL_MARGIN;
      if (!inside) camera.flyTo(cameraOn(node, state.k));
    },
    [byId, camera],
  );

  const { folded, branchesOf, setFolded } = fold;
  const onKeyDown = useCallback(
    (id: string, event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      // « - » replie les branches sous la bulle, « + » les déplie (DESIGN.md, section 11).
      const keys = branchesOf.get(id) ?? [];
      // D'après la dernière demande : « - » puis « + » coup sur coup s'annulent.
      const collapse = event.key === '-' && keys.some((k) => !folded.has(k));
      const expand = (event.key === '+' || event.key === '=') && keys.some((k) => folded.has(k));
      if (collapse || expand) {
        event.preventDefault();
        setFolded(keys, collapse);
        return;
      }
      const move = MOVES[event.key];
      const node = byId.get(id);
      if (!move || !node) return;
      const target = move(node, rows.get(node.row) ?? []);
      event.preventDefault();
      if (!target) return;
      setActiveId(target);
      const element = elements.current.get(target);
      if (element) element.focus({ preventScroll: true });
      // Bulle virtualisée, pas encore rendue : le focus suit après le rendu.
      else pendingFocus.current = target;
    },
    [byId, rows, branchesOf, folded, setFolded],
  );

  // Les plis retenus reviennent une fois la caméra en place, autour de la bulle repère.
  const foldsRestored = useRef(false);
  useEffect(() => {
    if (!camera || foldsRestored.current) return;
    foldsRestored.current = true;
    const remembered = memory.current.value;
    if (remembered?.view === viewKey && remembered.folded.length > 0) {
      setFolded(remembered.folded, true);
    }
  }, [camera, setFolded, viewKey]);

  // Un pli ne fait pas bouger la caméra : la mémoire suit aussi chaque pli, sans
  // attendre le prochain arrêt de la caméra.
  useEffect(() => {
    if (!camera) return;
    const remembered = rememberCamera(camera.get(), nodes, [...folded], viewKey);
    if (remembered) writeTreeMemory(remembered);
  }, [camera, nodes, folded, viewKey]);

  // Nouvelle vue (ou nouvelles données) servie par le serveur : la caméra rejoint la
  // personne au centre ; les bulles glissent vers leur nouvelle place (useRelayout).
  const shownInitial = useRef(initial);
  useEffect(() => {
    if (!camera || shownInitial.current === initial) return;
    shownInitial.current = initial;
    const center = initial.nodes.find((n) => n.id === (centerId ?? focusId));
    if (center) camera.flyTo(cameraOn(center, camera.get().k));
  }, [camera, initial, centerId, focusId]);

  const toggleBranch = useCallback(
    (branch: BranchHandle) => setFolded([branch.id], !folded.has(branch.id)),
    [folded, setFolded],
  );

  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id || id !== activeId) return;
    pendingFocus.current = undefined;
    elements.current.get(id)?.focus({ preventScroll: true });
  }, [activeId]);

  if (!start || !first) {
    return (
      <p className="text-[15px] text-ink-2">
        L’arbre est encore vide : les fiches de la famille arrivent avec la reprise des données.
      </p>
    );
  }

  const shown = view ? nodesInView(nodes, view, activeId ? [activeId] : []) : nodes;
  const { branches } = fold.drawing;
  const handles = view ? nodesInView(branches, view, []) : branches;
  const expandedOf = (id: string) => {
    const keys = branchesOf.get(id);
    return keys ? keys.some((k) => !folded.has(k)) : undefined;
  };
  const home =
    me && camera ? () => camera.flyTo(cameraOn(me, Math.max(camera.get().k, 0.75))) : undefined;

  return (
    <div className="relative h-[calc(100dvh-15rem)] min-h-[420px] md:h-[calc(100dvh-13rem)] overflow-hidden rounded-[var(--radius-panel)] border border-line">
      <section
        ref={viewport}
        aria-label="Canevas de l’arbre"
        // Niveau des échelles de départ ; la caméra le tient ensuite à jour.
        data-detail="mid"
        // Le focus d'une bulle ne doit jamais faire défiler le canevas : la caméra s'en charge.
        onScroll={(event) => {
          event.currentTarget.scrollTop = 0;
          event.currentTarget.scrollLeft = 0;
        }}
        className="canvas-grid group/canvas absolute inset-0 cursor-grab touch-none select-none overflow-hidden overscroll-none [--k0:0.75] active:cursor-grabbing md:[--k0:1]"
      >
        <div
          ref={layer}
          data-camera-layer
          className="absolute top-1/2 left-1/2 origin-top-left"
          // Rendu serveur déjà centré sur la bulle de départ : pas de saut à l'hydratation.
          style={{
            width,
            height,
            transform: `translate(calc(${-first.x}px * var(--k0)), calc(${-first.y}px * var(--k0))) scale(var(--k0))`,
          }}
        >
          <TreeLinks
            ref={linksRef}
            links={fold.drawing.links}
            width={width}
            height={height}
            lit={highlight?.links}
          />
          <UnknownPartners slots={fold.drawing.unknownPartners} />
          <div ref={ghostsRef} aria-hidden="true" className="pointer-events-none">
            {leaving.map((node) => (
              <TreeGhost key={node.id} node={node} />
            ))}
          </div>
          <div role="tree" aria-label="Arbre de la famille" className="absolute inset-0">
            {shown.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                active={node.id === activeId}
                selected={node.id === selectedId}
                onPath={highlight ? highlight.persons.has(node.id) : undefined}
                onOpen={onOpen}
                expanded={expandedOf(node.id)}
                register={register}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
              />
            ))}
          </div>
          {handles.map((branch) => (
            <BranchToggle
              key={branch.id}
              branch={branch}
              folded={folded.has(branch.id)}
              hidden={folded.has(branch.id) ? fold.hiddenBelow(branch.id) : 0}
              onToggle={toggleBranch}
            />
          ))}
        </div>
      </section>
      {camera ? (
        <TreeMinimap points={nodes} width={width} height={height} camera={camera} />
      ) : undefined}
      <CanvasControls camera={camera} home={me ? home : undefined} />
    </div>
  );
}
