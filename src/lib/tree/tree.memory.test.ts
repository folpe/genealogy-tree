import { describe, expect, it } from 'vitest';
import { cameraOn, worldAt } from './tree.camera';
import { parseMemory, recallCamera, rememberCamera } from './tree.memory';

const nodes = [
  { id: 'a', x: 0, y: 0 },
  { id: 'b', x: 400, y: 0 },
  { id: 'c', x: 400, y: 300 },
];

describe('rememberCamera / recallCamera', () => {
  it('retient la bulle la plus proche du centre, le décalage et le zoom', () => {
    const camera = cameraOn({ x: 380, y: 260 }, 1.5);
    expect(rememberCamera(camera, nodes, ['u-1'])).toEqual({
      anchorId: 'c',
      dx: -20,
      dy: -40,
      k: 1.5,
      folded: ['u-1'],
    });
  });

  it('retrouve le même point au centre, même si l’arbre a bougé entre-temps', () => {
    const memory = rememberCamera(cameraOn({ x: 380, y: 260 }, 1.5), nodes, []);
    const moved = nodes.map((n) => ({ ...n, x: n.x + 1000 }));
    const camera = memory ? recallCamera(memory, moved) : undefined;
    expect(camera && worldAt(camera, { x: 0, y: 0 })).toEqual({ x: 1380, y: 260 });
    expect(camera?.k).toBe(1.5);
  });

  it('bulle disparue ou arbre vide : rien à retrouver, l’arbre s’ouvre au départ', () => {
    const memory = { anchorId: 'z', dx: 0, dy: 0, k: 1, folded: [] };
    expect(recallCamera(memory, nodes)).toBeUndefined();
    expect(rememberCamera(cameraOn({ x: 0, y: 0 }, 1), [], [])).toBeUndefined();
  });
});

describe('parseMemory', () => {
  it('relit ce qui a été rangé', () => {
    const memory = { anchorId: 'c', dx: 1, dy: 2, k: 0.8, folded: ['u-1'] };
    expect(parseMemory(JSON.stringify(memory))).toEqual(memory);
  });

  it('ignore ce qui n’a pas la bonne forme', () => {
    expect(parseMemory(undefined)).toBeUndefined();
    expect(parseMemory('pas du json')).toBeUndefined();
    expect(parseMemory(JSON.stringify({ anchorId: 'c', dx: 1 }))).toBeUndefined();
    expect(
      parseMemory(JSON.stringify({ anchorId: 'c', dx: 1, dy: 2, k: -1, folded: [] })),
    ).toBeUndefined();
    expect(
      parseMemory(JSON.stringify({ anchorId: 'c', dx: 1, dy: 2, k: 1, folded: [3] })),
    ).toBeUndefined();
  });
});
