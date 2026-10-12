// tdd-cover: e2e tests/e2e/tree-camera.spec.ts
'use client';

import { type RefObject, useEffect, useState } from 'react';
import { type Camera, cameraOn, type Size } from '@/lib/tree/tree.camera';
import type { Point } from '@/lib/tree/tree.layout';
import { type CameraController, createCamera } from '@/motion/camera';
import { bindCameraGestures } from '@/motion/camera.gestures';

/** Échelle de départ : lue sur le canevas (`--k0`), la même que celle du rendu serveur. */
function initialScale(viewport: HTMLElement): number {
  const k0 = Number.parseFloat(getComputedStyle(viewport).getPropertyValue('--k0'));
  return Number.isFinite(k0) && k0 > 0 ? k0 : 1;
}

/**
 * Monte la caméra sur le canevas une fois le DOM prêt : gestes, suivi de la taille,
 * et `data-camera-ready` sur le calque quand elle a la main.
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
  const startX = start?.x ?? 0;
  const startY = start?.y ?? 0;

  useEffect(() => {
    const viewportElement = viewport.current;
    const layerElement = layer.current;
    if (!viewportElement || !layerElement) return;
    const camera = createCamera({
      viewport: viewportElement,
      layer: layerElement,
      content,
      initial: cameraOn({ x: startX, y: startY }, initialScale(viewportElement)),
      onSettle: (state) => onSettle(state, camera.viewport()),
    });
    const unbind = bindCameraGestures(viewportElement, camera);
    const resize = new ResizeObserver(([entry]) => {
      if (entry)
        camera.resize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resize.observe(viewportElement);
    layerElement.dataset['cameraReady'] = 'true';
    setController(camera);
    onSettle(camera.get(), camera.viewport());
    return () => {
      resize.disconnect();
      unbind();
      camera.dispose();
      delete layerElement.dataset['cameraReady'];
    };
    // La caméra se remonte si le placement change, pas à chaque rendu de la page.
  }, [viewport, layer, content, startX, startY, onSettle]);

  return controller;
}
