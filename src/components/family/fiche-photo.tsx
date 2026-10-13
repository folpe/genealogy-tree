// tdd-cover: e2e tests/e2e/fiche-photo.writes.spec.ts
'use client';

import { type ChangeEvent, type ReactNode, useId, useState, useTransition } from 'react';
import { changePhotoAction } from '@/actions/family.actions';
import { fitWithin } from './fiche-photo.helper';

// Changer la photo d'une fiche (retour de Folpe) : on touche l'appareil sur la bulle,
// le téléphone propose l'appareil photo ou la photothèque. La photo est redressée et
// réduite ici avant l'envoi (une photo d'iPhone dépasse la limite d'une action) ; le
// serveur la normalise ensuite et retire l'EXIF et le GPS.

const MAX_SIDE = 2048;
const QUALITY = 0.88;
const UNREADABLE = 'Ce fichier n’est pas une photo lisible (JPEG, PNG, WebP ou HEIC).';

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(UNREADABLE))),
      'image/jpeg',
      QUALITY,
    );
  });
}

export function PhotoPicker({ personId, children }: { personId: string; children: ReactNode }) {
  const id = useId();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(undefined);
    start(async () => {
      let photo: Blob;
      try {
        photo = await shrink(file);
      } catch {
        setError(UNREADABLE);
        return;
      }
      const data = new FormData();
      data.set('personId', personId);
      data.set('photo', photo, 'photo.jpg');
      const result = await changePhotoAction(data);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {children}
        <label
          htmlFor={id}
          className="absolute right-0 bottom-0 flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-ink text-on-ink shadow-float transition-transform has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink hover:scale-105"
        >
          {pending ? (
            <span
              aria-hidden="true"
              className="size-4 rounded-full border-2 border-on-ink border-t-transparent motion-safe:animate-spin"
            />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12.5"
                r="3.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          )}
          <input
            id={id}
            type="file"
            accept="image/*"
            aria-label="Changer la photo"
            disabled={pending}
            onChange={onChange}
            className="sr-only"
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="max-w-xs text-center text-[13px] text-accent">
          {error}
        </p>
      ) : pending ? (
        <p role="status" className="text-[13px] text-ink-2">
          Photo en cours d’envoi…
        </p>
      ) : undefined}
    </div>
  );
}
