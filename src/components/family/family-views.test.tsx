// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TreeForViewer } from '@/server/family/family.service';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/actions/family.actions', () => ({
  editPersonAction: vi.fn(),
  changePhotoAction: vi.fn(),
  trashPersonAction: vi.fn(),
  restorePersonAction: vi.fn(),
}));

import { PersonSheet } from './family-views';

const hugo = treeForViewer('m-hugo');
// Photo signée telle que le service la fournit (URLs fictives).
const lucPhoto = {
  src: '/media/p-luc/768?e=1&s=x',
  srcSet: '/media/p-luc/256?e=1&s=x 256w, /media/p-luc/768?e=1&s=x 768w',
  width: 768,
  height: 1024,
  blurDataUrl: 'data:image/webp;base64,AA',
};
const hugoWithPhoto: TreeForViewer = { ...hugo, photos: { luc: lucPhoto } };

describe('PersonSheet', () => {
  it('fiche entière : dates, lieux, résidence et proches', () => {
    render(<PersonSheet tree={hugo} personId="luc" />);
    expect(screen.getByRole('heading', { name: 'Luc Marchand' })).toBeVisible();
    // Hugo peut modifier la fiche de son père : chaque fait est une ligne à toucher.
    expect(screen.getByRole('button', { name: 'Surnom : Lulu, modifier' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Naissance : 21 août 1963, Toulouse, modifier' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Réside à : Toulouse, modifier' })).toBeVisible();
    const parents = screen.getByRole('list', { name: 'Parents' });
    expect(within(parents).getByRole('link', { name: 'Paul Marchand' })).toBeVisible();
    const children = screen.getByRole('list', { name: 'Enfants' });
    // Pastilles : le prénom à l'écran, le nom complet pour les lecteurs d'écran.
    const chips = within(children).getAllByRole('link');
    expect(chips[0]).toHaveAccessibleName('Maxime Marchand');
    expect(chips[1]).toHaveAccessibleName('Léa Marchand');
    expect(chips[2]).toHaveAccessibleName('Hugo Marchand, toi');
    expect(within(chips[0] as HTMLElement).getByText('Maxime')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const unions = screen.getByRole('list', { name: 'Unions' });
    const [current, past] = within(unions).getAllByRole('listitem');
    expect(within(current as HTMLElement).getByRole('link')).toHaveAccessibleName(
      'Sophie Marchand',
    );
    expect(current).toHaveTextContent('Mariage depuis 1990');
    expect(within(past as HTMLElement).getByRole('link')).toHaveAccessibleName('Claire Dumont');
    expect(past).toHaveTextContent('Union libre (1985), séparation (1989)');
  });

  it('frères et sœurs, demi- à part, et qui l’a élevé', () => {
    render(<PersonSheet tree={hugo} personId="maxime" />);
    expect(
      within(screen.getByRole('list', { name: 'Demi-frères et sœurs' })).getAllByRole('link'),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole('list', { name: 'A aussi été élevé par' })).getByRole('link'),
    ).toHaveAccessibleName('Sophie Marchand');
  });

  it('photo de la fiche, nommée, avec son aperçu flou en attendant', () => {
    render(<PersonSheet tree={hugoWithPhoto} personId="luc" />);
    const img = screen.getByRole('img', { name: 'Luc Marchand' });
    expect(img).toHaveAttribute('srcset', lucPhoto.srcSet);
    expect(img).toHaveAttribute('width', '768');
    expect(img).toHaveAttribute('height', '1024');
    expect(img.parentElement?.style.backgroundImage).toContain(lucPhoto.blurDataUrl);
  });

  it('sans photo : les initiales dans la bulle', () => {
    render(<PersonSheet tree={hugo} personId="luc" />);
    expect(screen.queryByRole('img')).toBeNull();
    const header = screen.getByRole('banner');
    expect(within(header).getByText('LM')).toHaveAttribute('aria-hidden', 'true');
  });

  it('vivant hors de mon périmètre : année et ville de naissance, et pourquoi', () => {
    render(<PersonSheet tree={hugo} personId="anne" />);
    expect(screen.getByText('1960, Toulouse')).toBeVisible();
    expect(screen.queryByText('Bordeaux')).toBeNull();
    expect(screen.getByText(/hors de ta branche directe/)).toBeVisible();
  });

  it('mineur hors du cercle proche : prénom et initiale seulement', () => {
    render(<PersonSheet tree={hugo} personId="jade" />);
    expect(screen.getByRole('heading', { name: 'Jade M.' })).toBeVisible();
    expect(screen.queryByText(/Paris/)).toBeNull();
    expect(screen.getByText(/mineure/)).toBeVisible();
  });

  it('dans sa lignée : les faits et le nom se touchent pour se modifier', () => {
    render(<PersonSheet tree={hugo} personId="luc" />);
    const title = screen.getByRole('heading', { name: 'Luc Marchand' });
    expect(within(title).getByRole('button')).toHaveAccessibleDescription(
      'Touche pour modifier le prénom et le nom',
    );
    expect(screen.getByRole('button', { name: 'Réside à : Toulouse, modifier' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Surnom : Lulu, modifier' })).toBeVisible();
  });

  it('vivant : pas de ligne « Décès », une action pour l’indiquer', () => {
    render(<PersonSheet tree={hugo} personId="luc" />);
    expect(screen.queryByRole('button', { name: /^Décès/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Indiquer un décès' })).toBeVisible();
  });

  it('décédé : la ligne « Décès » et sa date, qui se touchent', () => {
    render(<PersonSheet tree={hugo} personId="paul" />);
    expect(screen.getByRole('button', { name: /^Décès : 2008/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Indiquer un décès' })).toBeNull();
  });

  it('la note se lit en fin de fiche', () => {
    render(<PersonSheet tree={{ ...hugo, editableIds: [] }} personId="maxime" />);
    const note = screen.getByText(/Il a grandi entre Nantes et Toulouse/);
    expect(note).toBeVisible();
    expect(screen.queryByRole('button', { name: /^Note/ })).toBeNull();
  });

  it('dans sa lignée, la note se touche pour se modifier', () => {
    render(<PersonSheet tree={hugo} personId="maxime" />);
    const note = screen.getByRole('button', { name: 'Note, modifier' });
    expect(note).toHaveAccessibleDescription(/^Né d’une précédente union de Luc/);
  });

  it('pas de note sur une fiche vue de loin', () => {
    render(<PersonSheet tree={treeForViewer('m-anne')} personId="maxime" />);
    expect(screen.queryByText(/Il a grandi entre Nantes/)).toBeNull();
  });

  it('hors de sa lignée : la fiche se lit, rien ne se touche', () => {
    render(<PersonSheet tree={hugo} personId="anne" />);
    expect(screen.queryByRole('button', { name: /modifier/i })).toBeNull();
  });
});
