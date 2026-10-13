// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { FamilyTree } from './family-tree';
import { drawTree, type TreeDrawing } from './family-tree.helper';

let drawing: TreeDrawing;
beforeAll(async () => {
  const hugo = treeForViewer('m-hugo');
  const photo = { src: '/media/p-luc/256?e=1&s=x', srcSet: '', width: 256, height: 256 };
  drawing = await drawTree({ ...hugo, photos: { luc: photo } }, new ELK());
});

const item = (name: RegExp) => screen.getByRole('treeitem', { name });

describe('FamilyTree', () => {
  it('un arbre nommé, une entrée par bulle, chacune menant à sa fiche', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const tree = screen.getByRole('tree', { name: 'Arbre de la famille' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(drawing.nodes.length);
    expect(item(/^Henri Marchand, 1902 - 1979$/)).toHaveAttribute('href', '/people/henri');
    expect(item(/^Henri Marchand/)).toHaveAttribute('aria-level', '1');
  });

  it('« Toi » sous la bulle du lecteur, seule entrée atteignable par Tab', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const hugo = item(/c’est toi$/);
    expect(within(hugo).getByText('Toi')).toBeVisible();
    const reachable = screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0);
    expect(reachable).toEqual([hugo]);
  });

  it('les flèches suivent les liens : parent en haut, voisin à droite, enfant en bas', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const hugo = item(/c’est toi$/);
    hugo.focus();
    fireEvent.keyDown(hugo, { key: 'ArrowUp' });
    const parent = document.activeElement as HTMLElement;
    expect(parent.getAttribute('href')).toMatch(/^\/people\/(luc|sophie)$/);
    expect(parent.tabIndex).toBe(0);
    expect(hugo.tabIndex).toBe(-1);

    fireEvent.keyDown(parent, { key: 'ArrowDown' });
    expect(document.activeElement?.getAttribute('aria-level')).toBe(
      hugo.getAttribute('aria-level'),
    );

    const henri = item(/^Henri Marchand/);
    henri.focus();
    fireEvent.keyDown(henri, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('aria-level')).toBe('1');
    expect(document.activeElement).not.toBe(henri);
  });

  it('Début et Fin vont aux deux bouts de la génération', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const level = (el: Element | null) => el?.getAttribute('aria-level');
    const row = screen.getAllByRole('treeitem').filter((el) => level(el) === '1');
    const henri = item(/^Henri Marchand/);
    henri.focus();
    fireEvent.keyDown(henri, { key: 'End' });
    expect(document.activeElement).toBe(row.at(-1));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Home' });
    expect(document.activeElement).toBe(row[0]);
  });

  it('garde une entrée atteignable par Tab si la bulle active disparaît', () => {
    const { rerender } = render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const henri = item(/^Henri Marchand/);
    henri.focus();
    fireEvent.keyDown(henri, { key: 'ArrowRight' });
    const gone = (document.activeElement as HTMLElement).getAttribute('href')?.split('/').at(-1);
    const without = { ...drawing, nodes: drawing.nodes.filter((n) => n.id !== gone) };
    rerender(<FamilyTree drawing={without} focusId="hugo" />);
    const reachable = screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0);
    expect(reachable).toEqual([item(/c’est toi$/)]);
  });

  it('au-delà de 300 bulles, Fin atteint une bulle qui n’était pas encore rendue', () => {
    const row = Array.from({ length: 302 }, (_, i) => ({
      id: `p${i}`,
      x: i * 136,
      y: 0,
      row: 0,
      ...(i > 0 ? { left: `p${i - 1}` } : {}),
      ...(i < 301 ? { right: `p${i + 1}` } : {}),
      name: `P${i}`,
      fullName: `P${i} Q`,
      label: `Personne ${i}`,
      initials: 'PP',
      deceased: false,
      me: false,
      branchesBelow: false,
    }));
    const wide = { nodes: row, links: [], unknownPartners: [], width: 302 * 136, height: 132 };
    render(<FamilyTree drawing={wide} focusId="p0" />);
    const first = screen.getByRole('treeitem', { name: 'Personne 0' });
    expect(screen.queryByRole('treeitem', { name: 'Personne 301' })).toBeNull();
    first.focus();
    fireEvent.keyDown(first, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'Personne 301' }));
  });

  it('zoom sémantique : niveau moyen au départ, nom complet prêt pour la vue de près', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    expect(screen.getByRole('region', { name: 'Canevas de l’arbre' })).toHaveAttribute(
      'data-detail',
      'mid',
    );
    const hugo = item(/c’est toi$/);
    expect(within(hugo).getByText('Toi')).toBeInTheDocument();
    expect(within(hugo).getByText('Hugo Marchand')).toBeInTheDocument();
  });

  it('laisse passer les autres touches, Entrée comprise', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const hugo = item(/c’est toi$/);
    hugo.focus();
    expect(fireEvent.keyDown(hugo, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(hugo, { key: 'ArrowUp' })).toBe(false);
  });

  it('la photo dans la bulle est décorative, sinon les initiales', () => {
    render(<FamilyTree drawing={drawing} focusId="hugo" />);
    expect(item(/^Luc Marchand/).querySelector('img')).toHaveAttribute('alt', '');
    expect(within(item(/^Paul Marchand/)).getByText('PM')).toHaveAttribute('aria-hidden', 'true');
  });

  it('trace les liens sous les bulles, hors de l’arbre accessible', () => {
    const { container } = render(<FamilyTree drawing={drawing} focusId="hugo" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelectorAll('path')).toHaveLength(drawing.links.length);
  });

  it('invite à patienter quand l’arbre est encore vide', () => {
    const empty = { nodes: [], links: [], unknownPartners: [], width: 0, height: 0 };
    render(<FamilyTree drawing={empty} focusId={undefined} />);
    expect(screen.getByText(/L’arbre est encore vide/)).toBeVisible();
    expect(screen.queryByRole('tree')).toBeNull();
  });
});
