// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { requestOpenFiche, useOpenFicheRequests } from './open-fiche';

describe('ouverture d’une fiche depuis la recherche', () => {
  it('sans arbre à l’écran, personne ne répond', () => {
    expect(requestOpenFiche('luc')).toBe(false);
  });

  it('l’arbre répond pour une personne qu’il dessine, pas pour une autre', () => {
    const opened: string[] = [];
    const { unmount } = renderHook(() =>
      useOpenFicheRequests((id) => {
        if (id !== 'luc') return false;
        opened.push(id);
        return true;
      }),
    );
    expect(requestOpenFiche('luc')).toBe(true);
    expect(requestOpenFiche('isabelle')).toBe(false);
    expect(opened).toEqual(['luc']);
    unmount();
    expect(requestOpenFiche('luc')).toBe(false);
  });
});
