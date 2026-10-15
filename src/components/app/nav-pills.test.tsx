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
    render(<NavPills placement="header" />);
    expect(screen.getByRole('link', { name: 'Ancêtres' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Arbre' })).not.toHaveAttribute('aria-current');
  });

  it('une fiche n’est aucune des vues', () => {
    pathname.mockReturnValue('/people/luc');
    render(<NavPills placement="header" />);
    for (const link of screen.getAllByRole('link'))
      expect(link).not.toHaveAttribute('aria-current');
  });

  it('en bas de l’écran (téléphone) : les mêmes onglets, qui se partagent la largeur', () => {
    pathname.mockReturnValue('/tree');
    render(<NavPills placement="bar" />);
    const nav = screen.getByRole('navigation', { name: 'Vues' });
    expect(nav).toHaveAttribute('data-placement', 'bar');
    expect(screen.getByRole('link', { name: 'Arbre' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Ancêtres' })).toHaveClass('flex-1');
  });

  it('« Arbre » ramène à la vue que l’on quittait', () => {
    pathname.mockReturnValue('/ancestors');
    sessionStorage.setItem(
      'racines:tree',
      JSON.stringify({ anchorId: 'luc', dx: 0, dy: 0, k: 1, folded: [], view: '/tree?view=all' }),
    );
    render(<NavPills placement="header" />);
    expect(screen.getByRole('link', { name: 'Arbre' })).toHaveAttribute('href', '/tree?view=all');
  });
});
