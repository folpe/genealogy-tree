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
  };
}
const hugo = treeOf('m-hugo');

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

  it('invite à patienter quand l’arbre est encore vide', () => {
    render(
      <GenerationList
        tree={{
          persons: [],
          unions: [],
          parentChildren: [],
          generations: {},
          viewerPersonId: undefined,
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
