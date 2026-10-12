// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAccessContext } from '@/server/access/access.policy';
import { viewTreeAs } from '@/server/access/access.view';
import { buildFamilyIndex, generationLevels } from '@/server/family/family.helper';
import type { TreeForViewer } from '@/server/family/family.service';
import { exact } from '../../../tests/fixtures/builders';
import { marchandFamily, marchandMembers } from '../../../tests/fixtures/marchand-family';
import { GenerationList, PersonSheet } from './family-views';

/** L'arbre tel que Hugo le reçoit du service. */
function treeOf(memberId: string): TreeForViewer {
  const index = buildFamilyIndex(marchandFamily);
  const viewer = marchandMembers.find((m) => m.id === memberId);
  if (!viewer) throw new Error(memberId);
  const { audited: _, ...view } = viewTreeAs(
    buildAccessContext(index, [...marchandMembers]),
    viewer,
    exact(2026, 10, 12),
  );
  return {
    ...view,
    generations: Object.fromEntries(generationLevels(index)),
    viewerPersonId: viewer.personId ?? undefined,
    photos: {},
  };
}
const hugo = treeOf('m-hugo');
// Photo signée telle que le service la fournit (URLs fictives).
const lucPhoto = {
  src: '/media/p-luc/768?e=1&s=x',
  srcSet: '/media/p-luc/256?e=1&s=x 256w, /media/p-luc/768?e=1&s=x 768w',
  width: 768,
  height: 1024,
  blurDataUrl: 'data:image/webp;base64,AA',
};
const hugoWithPhoto: TreeForViewer = { ...hugo, photos: { luc: lucPhoto } };

describe('GenerationList', () => {
  it('range les fiches par génération, de la plus ancienne à la plus récente', () => {
    render(<GenerationList tree={hugo} />);
    const generations = screen.getAllByRole('region');
    expect(generations).toHaveLength(5);
    expect(within(generations[0] as HTMLElement).getByText('Génération 1')).toBeVisible();
    expect(
      within(generations[3] as HTMLElement).getByRole('link', { name: /Hugo Marchand/ }),
    ).toHaveAttribute('href', '/people/hugo');
  });

  it('signale ma fiche et affiche les années de vie', () => {
    render(<GenerationList tree={hugo} />);
    expect(screen.getByRole('link', { name: /Hugo Marchand.*c’est toi/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /Henri Marchand.*1902 - 1979/ })).toBeVisible();
  });

  it('ne nomme un mineur hors du cercle proche que par son prénom et son initiale', () => {
    render(<GenerationList tree={hugo} />);
    expect(screen.getByRole('link', { name: /^Jade M\./ })).toBeVisible();
    expect(screen.queryByText(/2018/)).toBeNull();
  });

  it('montre la photo dans la bulle, sinon les initiales', () => {
    render(<GenerationList tree={hugoWithPhoto} />);
    const luc = screen.getByRole('link', { name: /Luc Marchand/ });
    // Décorative : le nom suit dans le lien.
    const img = luc.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', lucPhoto.src);
    expect(img).toHaveAttribute('srcset', lucPhoto.srcSet);
    const paul = screen.getByRole('link', { name: /Paul Marchand/ });
    expect(paul.querySelector('img')).toBeNull();
    expect(within(paul).getByText('PM')).toHaveAttribute('aria-hidden', 'true');
  });

  it('invite à patienter quand l’arbre est encore vide', () => {
    render(
      <GenerationList
        tree={{
          persons: [],
          unions: [],
          parentChildren: [],
          generations: {},
          viewerPersonId: undefined,
          photos: {},
        }}
      />,
    );
    expect(screen.getByText(/L’arbre est encore vide/)).toBeVisible();
  });
});

describe('PersonSheet', () => {
  it('fiche entière : dates, lieux, résidence et proches', () => {
    render(<PersonSheet tree={hugo} personId="luc" />);
    expect(screen.getByRole('heading', { name: 'Luc Marchand' })).toBeVisible();
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
