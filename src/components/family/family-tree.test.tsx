// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { FamilyTree } from './family-tree';
import { drawTree } from './family-tree.helper';
import type { TreeDrawing } from './tree-drawing';

const hugoView = treeForViewer('m-hugo');
const emptyLayout = {
  persons: {},
  unions: {},
  unknownPartners: {},
  detachedUnions: [],
  markers: {},
  width: 0,
  height: 0,
};
let drawing: TreeDrawing;
beforeAll(async () => {
  const photo = { src: '/media/p-luc/256?e=1&s=x', srcSet: '', width: 256, height: 256 };
  drawing = await drawTree({ ...hugoView, photos: { luc: photo } }, new ELK());
});

const item = (name: RegExp) => screen.getByRole('treeitem', { name });

// Le canevas retient position et plis pour l'onglet : chaque test part d'un onglet neuf.
beforeEach(() => {
  window.sessionStorage.clear();
});

describe('FamilyTree', () => {
  it('un arbre nommé, une entrée par bulle, chacune menant à sa fiche', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    const tree = screen.getByRole('tree', { name: 'Arbre de la famille' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(drawing.nodes.length);
    expect(item(/^Henri Marchand, 1902 - 1979$/)).toHaveAttribute('href', '/people/henri');
    expect(item(/^Henri Marchand/)).toHaveAttribute('aria-level', '1');
  });

  it('« Toi » sous la bulle du lecteur, seule entrée atteignable par Tab', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    const hugo = item(/c’est toi$/);
    expect(within(hugo).getByText('Toi')).toBeVisible();
    const reachable = screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0);
    expect(reachable).toEqual([hugo]);
  });

  it('les flèches suivent les liens : parent en haut, voisin à droite, enfant en bas', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
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
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
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
    const { rerender } = render(
      <FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />,
    );
    const henri = item(/^Henri Marchand/);
    henri.focus();
    fireEvent.keyDown(henri, { key: 'ArrowRight' });
    const gone = (document.activeElement as HTMLElement).getAttribute('href')?.split('/').at(-1);
    const without = { ...drawing, nodes: drawing.nodes.filter((n) => n.id !== gone) };
    rerender(<FamilyTree drawing={without} graph={hugoView.drawn} focusId="hugo" />);
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
    const wide = {
      nodes: row,
      links: [],
      unknownPartners: [],
      branches: [],
      layout: emptyLayout,
      width: 302 * 136,
      height: 132,
    };
    render(<FamilyTree drawing={wide} graph={hugoView.drawn} focusId="p0" />);
    const first = screen.getByRole('treeitem', { name: 'Personne 0' });
    expect(screen.queryByRole('treeitem', { name: 'Personne 301' })).toBeNull();
    first.focus();
    fireEvent.keyDown(first, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'Personne 301' }));
  });

  it('zoom sémantique : niveau moyen au départ, nom complet prêt pour la vue de près', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    expect(screen.getByRole('region', { name: 'Canevas de l’arbre' })).toHaveAttribute(
      'data-detail',
      'mid',
    );
    const hugo = item(/c’est toi$/);
    expect(within(hugo).getByText('Toi')).toBeInTheDocument();
    expect(within(hugo).getByText('Hugo Marchand')).toBeInTheDocument();
  });

  it('« - » replie la branche de Luc, « + » la rouvre', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    const luc = item(/^Luc Marchand/);
    expect(luc).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(luc, { key: '-' });
    expect(screen.queryByRole('treeitem', { name: /c’est toi$/ })).toBeNull();
    expect(item(/^Luc Marchand/)).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', {
        name: /^Déplier la branche de Luc Marchand et Sophie Marchand, \d+ personnes$/,
      }),
    ).toBeInTheDocument();
    fireEvent.keyDown(item(/^Luc Marchand/), { key: '+' });
    expect(item(/c’est toi$/)).toBeInTheDocument();
    expect(item(/^Luc Marchand/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('plier ne déplace aucune bulle restante', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    const henri = item(/^Henri Marchand/);
    const before = henri.getAttribute('style');
    fireEvent.keyDown(item(/^Léa Marchand/), { key: '-' });
    fireEvent.keyDown(item(/^Luc Marchand/), { key: '-' });
    expect(screen.queryByRole('treeitem', { name: /^Jade/ })).toBeNull();
    expect(item(/^Henri Marchand/).getAttribute('style')).toBe(before);
  });

  it('la poignée plie et déplie sa branche', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Replier la branche de Luc Marchand et Sophie Marchand' }),
    );
    expect(screen.queryByRole('treeitem', { name: /c’est toi$/ })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', {
        name: /^Déplier la branche de Luc Marchand et Sophie Marchand/,
      }),
    );
    expect(item(/c’est toi$/)).toBeInTheDocument();
  });

  it('une bulle sans enfant n’a ni poignée ni état plié', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    expect(item(/^Jade/)).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByRole('button', { name: /branche de Jade/ })).toBeNull();
  });

  it('laisse passer les autres touches, Entrée comprise', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    const hugo = item(/c’est toi$/);
    hugo.focus();
    expect(fireEvent.keyDown(hugo, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(hugo, { key: 'ArrowUp' })).toBe(false);
  });

  it('la photo dans la bulle est décorative, sinon les initiales', () => {
    render(<FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />);
    expect(item(/^Luc Marchand/).querySelector('img')).toHaveAttribute('alt', '');
    expect(within(item(/^Paul Marchand/)).getByText('PM')).toHaveAttribute('aria-hidden', 'true');
  });

  it('trace les liens sous les bulles, hors de l’arbre accessible', () => {
    const { container } = render(
      <FamilyTree drawing={drawing} graph={hugoView.drawn} focusId="hugo" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelectorAll('path')).toHaveLength(drawing.links.length);
  });

  it('invite à patienter quand l’arbre est encore vide', () => {
    const empty = {
      nodes: [],
      links: [],
      unknownPartners: [],
      branches: [],
      layout: emptyLayout,
      width: 0,
      height: 0,
    };
    render(<FamilyTree drawing={empty} graph={hugoView.drawn} focusId={undefined} />);
    expect(screen.getByText(/L’arbre est encore vide/)).toBeVisible();
    expect(screen.queryByRole('tree')).toBeNull();
  });
});
