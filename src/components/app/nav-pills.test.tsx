// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pathname } = vi.hoisted(() => ({ pathname: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: pathname }));

import { NavPills } from './nav-pills';

describe('NavPills', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('marque la vue ouverte, y compris sur une sous-page', () => {
    pathname.mockReturnValue('/ancestors');
    render(<NavPills />);
    expect(screen.getByRole('link', { name: 'Ancêtres' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Arbre' })).not.toHaveAttribute('aria-current');
  });

  it('une fiche n’est aucune des vues', () => {
    pathname.mockReturnValue('/people/luc');
    render(<NavPills />);
    for (const link of screen.getAllByRole('link'))
      expect(link).not.toHaveAttribute('aria-current');
  });

  it('« Arbre » ramène à la vue que l’on quittait', () => {
    pathname.mockReturnValue('/ancestors');
    sessionStorage.setItem(
      'ances-tree:tree',
      JSON.stringify({ anchorId: 'luc', dx: 0, dy: 0, k: 1, folded: [], view: '/tree?view=all' }),
    );
    render(<NavPills />);
    expect(screen.getByRole('link', { name: 'Arbre' })).toHaveAttribute('href', '/tree?view=all');
  });
});
