// tdd-cover: e2e tests/e2e/tree.spec.ts
import 'server-only';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkLike } from './tree.layout';

// Le placement se calcule au rendu serveur : la page arrive dessinée, sans attendre
// de script ni de worker (journal des décisions, 2026-10-12). Une seule instance par
// processus ; la version « bundled » tourne dans le thread de Node.
let elk: ElkLike | undefined;

export function getElk(): ElkLike {
  elk ??= new ELK();
  return elk;
}
