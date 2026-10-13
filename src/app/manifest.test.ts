import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifeste de l’app', () => {
  const app = manifest();

  it('s’ouvre en app plein écran, sur l’arbre', () => {
    expect(app.display).toBe('standalone');
    expect(app.start_url).toBe('/tree');
    expect(app.name).toBe('Ances-Tree');
  });

  it('garde toutes les pages de l’app dans sa portée : une fiche ne sort pas de l’app', () => {
    expect(app.scope).toBe('/');
    expect(app.id).toBe('/');
  });

  it('a les icônes d’installation, sans les recadrer', () => {
    expect(app.icons?.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
    expect(app.icons?.every((icon) => icon.purpose === 'any')).toBe(true);
  });
});
