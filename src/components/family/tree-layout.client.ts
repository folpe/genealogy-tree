// tdd-cover: e2e tests/e2e/tree-fold.spec.ts
import type { TreeLayout } from '@/lib/tree/tree.layout';
import type { DisplayedGraph } from '@/server/family/family.display';

// Placement dans le navigateur, après un pliage. ELK calcule dans un worker
// (`src/workers/elk.worker.ts`, protocole d'elk-api) ; le thread principal ne fait que
// préparer le graphe et valider la sortie. Tout se charge au premier pliage
// (import dynamique) : la page n'en paie rien tant qu'on ne plie pas.

export type LayoutClient = {
  layout: (graph: DisplayedGraph) => Promise<TreeLayout>;
  dispose: () => void;
};

/** Au-delà, la demande échoue : un worker bloqué ne doit pas figer le canevas. */
const LAYOUT_TIMEOUT_MS = 10_000;

async function loadEngine() {
  const [{ computeTreeLayout }, { default: ELK }] = await Promise.all([
    import('@/lib/tree/tree.layout'),
    import('elkjs/lib/elk-api'),
  ]);
  const elk = new ELK({
    workerFactory: () =>
      new Worker(new URL('../../workers/elk.worker.ts', import.meta.url), { name: 'elk' }),
  });
  return { computeTreeLayout, elk };
}

export function createLayoutClient(): LayoutClient {
  let engine: ReturnType<typeof loadEngine> | undefined;
  let disposed = false;

  /** Arrête le worker ; le prochain pliage en relance un neuf. */
  const stop = () => {
    const running = engine;
    engine = undefined;
    running
      ?.then(({ elk }) => elk.terminateWorker())
      .catch(() => {
        // Moteur jamais chargé (import échoué) : rien à arrêter.
      });
  };
  const withTimeout = <T>(work: Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Un worker bloqué retiendrait les demandes suivantes derrière lui.
        stop();
        reject(new Error('Placement trop long'));
      }, LAYOUT_TIMEOUT_MS);
      work.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });

  return {
    layout(graph) {
      engine ??= loadEngine();
      return withTimeout(
        engine.then(({ computeTreeLayout, elk }) => computeTreeLayout(graph, elk)),
      );
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
    },
  };
}
