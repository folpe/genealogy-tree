// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthShell } from './auth-shell';

describe('AuthShell', () => {
  it('pose les étapes dans la carte principale', () => {
    render(
      <AuthShell>
        <h1>Étape</h1>
      </AuthShell>,
    );
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Étape' }),
    );
  });

  it('garde le canevas décoratif hors de l’arbre d’accessibilité', () => {
    const { container } = render(<AuthShell>étape</AuthShell>);
    const canvas = container.querySelector('section');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas?.querySelectorAll('.sketch-bubble')).toHaveLength(8);
  });

  it('ne montre de la famille ni nom ni initiales avant la connexion', () => {
    const { container } = render(<AuthShell>étape</AuthShell>);
    const labels = [...container.querySelectorAll('.sketch-bubble')].map((b) => b.textContent);
    expect(labels.filter(Boolean)).toEqual(['?', 'Toi']);
  });
});
