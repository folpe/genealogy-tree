// Appui long au doigt (plan phase 5, lot 7) : les actions rapides d'une bulle. Safari
// iOS n'émet pas `contextmenu` au doigt ; Android le fait, la souris et le clavier
// aussi (clic droit, touche Menu) : ceux-là passent par l'événement, pas d'ici.

/** Assez long pour ne pas prendre un tap appuyé, assez court pour ne pas faire attendre. */
export const LONG_PRESS_MS = 450;
/** Le doigt tremble ; au-delà, c'est un glissé : la caméra a la main. */
const TOLERANCE_PX = 8;

type Point = { x: number; y: number };
type Down = Point & { pointerType: string; isPrimary: boolean };

export type LongPress = {
  down: (id: string, pointer: Down) => void;
  move: (point: Point) => void;
  up: () => void;
  cancel: () => void;
  /** Le clic qui suit un appui long n'ouvre pas la fiche : vrai une fois, puis faux. */
  swallowClick: () => boolean;
};

export function createLongPress(onLongPress: (id: string) => void): LongPress {
  let pending: { origin: Point; timer: ReturnType<typeof setTimeout> } | undefined;
  let fired = false;
  const cancel = () => {
    if (pending) clearTimeout(pending.timer);
    pending = undefined;
  };
  return {
    down(id, pointer) {
      cancel();
      fired = false;
      // Un deuxième doigt : c'est un pincement.
      if (pointer.pointerType === 'mouse' || !pointer.isPrimary) return;
      const timer = setTimeout(() => {
        pending = undefined;
        fired = true;
        onLongPress(id);
      }, LONG_PRESS_MS);
      pending = { origin: { x: pointer.x, y: pointer.y }, timer };
    },
    move(point) {
      if (!pending) return;
      const { origin } = pending;
      if (Math.hypot(point.x - origin.x, point.y - origin.y) > TOLERANCE_PX) cancel();
    },
    up: cancel,
    cancel,
    swallowClick() {
      const swallow = fired;
      fired = false;
      return swallow;
    },
  };
}
