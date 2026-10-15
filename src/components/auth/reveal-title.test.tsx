// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RevealTitle } from './reveal-title';

describe('RevealTitle', () => {
  it('garde un titre lisible d’un seul tenant', () => {
    render(<RevealTitle text="Entre dans l’arbre" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Entre dans l’arbre' })).toBeVisible();
  });

  it('lève chaque mot à son tour', () => {
    render(<RevealTitle text="Entre dans l’arbre" />);
    const words = screen.getByRole('heading').querySelectorAll('[data-word]');
    expect([...words].map((word) => word.textContent)).toEqual(['Entre', 'dans', 'l’arbre']);
    expect([...words].map((word) => word.getAttribute('style'))).toEqual([
      '--word: 0;',
      '--word: 1;',
      '--word: 2;',
    ]);
  });

  it('se laisse viser pour y poser le focus au changement d’étape', () => {
    render(<RevealTitle text="Regarde tes emails" />);
    expect(screen.getByRole('heading')).toHaveAttribute('tabindex', '-1');
  });
});
