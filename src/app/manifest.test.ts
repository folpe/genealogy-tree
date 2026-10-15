import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifeste de l’app', () => {
  const app = manifest();

  it('s’ouvre en app plein écran, sur l’arbre', () => {
    expect(app.display).toBe('standalone');
    expect(app.start_url).toBe('/tree');
    expect(app.name).toBe('Racines');
  });

  it('garde toutes les pages de l’app dans sa portée : une fiche ne sort pas de l’app', () => {
    expect(app.scope).toBe('/');
    expect(app.id).toBe('/');
  });

  it('a les icônes d’installation, et une masquable que le système peut recadrer', () => {
    expect(app.icons?.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual([
      '192x192 any',
      '512x512 any',
      '512x512 maskable',
    ]);
  });
});
