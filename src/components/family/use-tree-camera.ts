// tdd-cover: e2e tests/e2e/tree-camera.spec.ts
'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type Camera, cameraOn, detailLevel, type Size } from '@/lib/tree/tree.camera';
import type { Point } from '@/lib/tree/tree.metrics';
import { type CameraController, createCamera } from '@/motion/camera';
import { bindCameraGestures } from '@/motion/camera.gestures';

/** Échelle de départ : lue sur le canevas (`--k0`), la même que celle du rendu serveur. */
function initialScale(viewport: HTMLElement): number {
  const k0 = Number.parseFloat(getComputedStyle(viewport).getPropertyValue('--k0'));
  return Number.isFinite(k0) && k0 > 0 ? k0 : 1;
}

/**
 * Monte la caméra sur le canevas une fois le DOM prêt : gestes, suivi de la taille,
 * niveau de détail (`data-detail`) sur le canevas, et `data-camera-ready` sur le
 * calque quand elle a la main.
 */
export function useTreeCamera({
  viewport,
  layer,
  content,
  start,
  onSettle,
}: {
  viewport: RefObject<HTMLDivElement | null>; // allow-null: contrat des refs de React
  layer: RefObject<HTMLDivElement | null>; // allow-null: contrat des refs de React
  content: Size;
  start: Point | undefined;
  onSettle: (camera: Camera, viewport: Size) => void;
}): CameraController | undefined {
  const [controller, setController] = useState<CameraController>();
  // Lus au montage seulement : un nouveau placement (branche pliée) passe par
  // setContent et jump, sans remonter la caméra ni la ramener au départ.
  const mount = useRef({ content, start });
  const settleTo = useRef(onSettle);
  useLayoutEffect(() => {
    settleTo.current = onSettle;
  });

  useEffect(() => {
    const viewportElement = viewport.current;
    const layerElement = layer.current;
    if (!viewportElement || !layerElement) return;
    const { content: firstContent, start: firstStart } = mount.current;
    const camera = createCamera({
      viewport: viewportElement,
      layer: layerElement,
      content: firstContent,
      initial: cameraOn(firstStart ?? { x: 0, y: 0 }, initialScale(viewportElement)),
      onSettle: (state) => settleTo.current(state, camera.viewport()),
    });
    const unbind = bindCameraGestures(viewportElement, camera);
    // Zoom sémantique : une écriture du DOM au changement de niveau, aucune entre deux.
    const unfollow = camera.subscribe((state) => {
      const level = detailLevel(state.k);
      if (viewportElement.dataset['detail'] !== level) viewportElement.dataset['detail'] = level;
    });
    const resize = new ResizeObserver(([entry]) => {
      if (entry)
        camera.resize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resize.observe(viewportElement);
    layerElement.dataset['cameraReady'] = 'true';
    setController(camera);
    settleTo.current(camera.get(), camera.viewport());
    return () => {
      resize.disconnect();
      unfollow();
      unbind();
      camera.dispose();
      delete layerElement.dataset['cameraReady'];
    };
  }, [viewport, layer]);

  return controller;
}
