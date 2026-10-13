// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TreeForViewer } from '@/server/family/family.service';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';

vi.mock('@/actions/family.actions', () => ({
  editPersonAction: vi.fn(),
  changePhotoAction: vi.fn(),
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
    expect(
      within(children)
        .getAllByRole('link')
        .map((l) => l.getAttribute('aria-label')),
    ).toEqual(['Maxime Marchand', 'Léa Marchand', 'Hugo Marchand, toi']);
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

  it('hors de sa lignée : la fiche se lit, rien ne se touche', () => {
    render(<PersonSheet tree={hugo} personId="anne" />);
    expect(screen.queryByRole('button', { name: /modifier/i })).toBeNull();
  });
});
