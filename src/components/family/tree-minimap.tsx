// tdd-cover: e2e tests/e2e/tree-camera.spec.ts
'use client';

import { type PointerEvent, useEffect, useRef } from 'react';
import { cameraOn, visibleWorld } from '@/lib/tree/tree.camera';
import type { Point } from '@/lib/tree/tree.metrics';
import type { CameraController } from '@/motion/camera';

// Mini-carte (plan phase 4, lot 4) : l'arbre en points, et le cadre de l'écran qu'on
// déplace d'un clic ou d'un glissé. Réservée aux grands écrans : sur téléphone, le
// pincement donne la même vue d'ensemble sans prendre de place. Doublon visuel de la
// caméra, elle est cachée des lecteurs d'écran ; le clavier a les flèches et
// « Me retrouver ».

const MINIMAP_MAX = { width: 168, height: 120 };

export function TreeMinimap({
  points,
  width,
  height,
  camera,
}: {
  points: (Point & { id: string })[];
  width: number;
  height: number;
  camera: CameraController;
}) {
  const frame = useRef<SVGRectElement>(null); // allow-null: contrat des refs de React
  const radius = Math.max(width, height) / 90;
  const scale = Math.min(MINIMAP_MAX.width / width, MINIMAP_MAX.height / height);

  // Le cadre suit la caméra à chaque frame, sans passer par React.
  useEffect(
    () =>
      camera.subscribe((state) => {
        const rect = visibleWorld(state, camera.viewport());
        frame.current?.setAttribute('x', String(rect.x0));
        frame.current?.setAttribute('y', String(rect.y0));
        frame.current?.setAttribute('width', String(rect.x1 - rect.x0));
        frame.current?.setAttribute('height', String(rect.y1 - rect.y0));
      }),
    [camera],
  );

  const moveTo = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const world = {
      x: ((event.clientX - box.left) / box.width) * width,
      y: ((event.clientY - box.top) / box.height) * height,
    };
    camera.set(cameraOn(world, camera.get().k));
  };

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-4 left-4 hidden rounded-2xl bg-card p-2 shadow-float md:block"
    >
      <svg
        data-minimap
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        width={width * scale}
        height={height * scale}
        className="block cursor-pointer touch-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          moveTo(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event);
        }}
        onPointerUp={() => camera.release({ x: 0, y: 0 })}
      >
        {points.map((point) => (
          <circle key={point.id} cx={point.x} cy={point.y} r={radius} className="fill-ink-3" />
        ))}
        <rect
          ref={frame}
          className="fill-accent/10 stroke-accent"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          rx={radius}
        />
      </svg>
    </div>
  );
}
