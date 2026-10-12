// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TreeForViewer } from '@/server/family/family.service';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
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
    expect(screen.getByText('Surnom : Lulu')).toBeVisible();
    expect(screen.getByText('21 août 1963, Toulouse')).toBeVisible();
    expect(screen.getByText('Toulouse', { selector: 'dd' })).toBeVisible();
    const parents = screen.getByRole('list', { name: 'Parents' });
    expect(within(parents).getByRole('link', { name: 'Paul Marchand' })).toBeVisible();
    const children = screen.getByRole('list', { name: 'Enfants' });
    expect(
      within(children)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Maxime Marchand', 'Léa Marchand', 'Hugo Marchand']);
    const unions = screen.getByRole('list', { name: 'Unions' });
    expect(unions).toHaveTextContent('Claire Dumont : Union libre (1985), séparation (1989)');
    expect(unions).toHaveTextContent('Sophie Marchand : Mariage depuis 1990');
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
    expect(screen.getByText('LM')).toHaveAttribute('aria-hidden', 'true');
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
});
