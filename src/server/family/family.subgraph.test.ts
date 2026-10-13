import { describe, expect, it } from 'vitest';
import { aChildOf, anUnion, aPerson } from '../../../tests/fixtures/builders';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { selectDisplayedGraph } from './family.display';
import { selectSubgraph } from './family.subgraph';
import type { FamilyGraph } from './family.types';

const ids = (graph: FamilyGraph) => graph.persons.map((p) => p.id).sort();
const unionIds = (graph: FamilyGraph) => graph.unions.map((u) => u.id).sort();

describe('selectSubgraph, descendants', () => {
  const paul = selectSubgraph(marchandFamily, { view: 'descendants', rootId: 'paul' });

  it('garde la racine, sa descendance, adoption comprise, et les conjoints', () => {
    expect(ids(paul)).toEqual(
      [
        'anne',
        'claire',
        'hugo',
        'jade',
        'jeanne',
        'lea',
        'luc',
        'maxime',
        'paul',
        'sophie',
        'tom',
      ].sort(),
    );
  });

  it('ne remonte ni chez les parents de la racine ni chez ceux des conjoints', () => {
    for (const id of ['henri', 'louise', 'emile', 'marthe', 'bernard', 'odette', 'isabelle']) {
      expect(ids(paul)).not.toContain(id);
    }
  });

  it('ne garde que les unions et les liens entre personnes gardées', () => {
    expect(unionIds(paul)).toEqual(['u-luc-claire', 'u-luc-sophie', 'u-paul-jeanne']);
    const kept = new Set(ids(paul));
    for (const link of paul.parentChildren) {
      expect(kept.has(link.parentId) && kept.has(link.childId)).toBe(true);
    }
    expect(paul.parentChildren).toContainEqual(
      expect.objectContaining({ parentId: 'sophie', childId: 'maxime', kind: 'a_eleve' }),
    );
  });

  it('s’arrête à la profondeur demandée, conjoints des derniers compris', () => {
    const one = selectSubgraph(marchandFamily, { view: 'descendants', rootId: 'paul', depth: 1 });
    expect(ids(one)).toEqual(['anne', 'claire', 'jeanne', 'luc', 'paul', 'sophie']);
  });

  it('un élevé n’est pas un descendant', () => {
    const sophie = selectSubgraph(marchandFamily, { view: 'descendants', rootId: 'sophie' });
    expect(ids(sophie)).toEqual(['hugo', 'jade', 'lea', 'luc', 'sophie']);
  });
});

describe('selectSubgraph, sablier', () => {
  const luc = selectSubgraph(marchandFamily, { view: 'hourglass', rootId: 'luc' });

  it('garde les ancêtres au-dessus, la descendance en dessous et les conjoints du centre', () => {
    expect(ids(luc)).toEqual(
      [
        'claire',
        'emile',
        'henri',
        'hugo',
        'jade',
        'jeanne',
        'lea',
        'louise',
        'luc',
        'marthe',
        'maxime',
        'paul',
        'sophie',
      ].sort(),
    );
  });

  it('laisse de côté la fratrie et les collatéraux', () => {
    for (const id of ['anne', 'tom', 'marie', 'claude', 'isabelle']) {
      expect(ids(luc)).not.toContain(id);
    }
  });

  it('limite les deux côtés à la profondeur demandée', () => {
    const near = selectSubgraph(marchandFamily, { view: 'hourglass', rootId: 'luc', depth: 1 });
    expect(ids(near)).toEqual(
      ['claire', 'hugo', 'jeanne', 'lea', 'luc', 'maxime', 'paul', 'sophie'].sort(),
    );
  });
});

describe('selectSubgraph, consanguinité', () => {
  // Deux petits-enfants d'Aïeul, cousins germains, ont un enfant : Aïeul est atteint
  // par deux chemins.
  const cousins: FamilyGraph = {
    persons: ['aieul', 'fils', 'fille', 'cousin', 'cousine', 'enfant'].map((id) => aPerson(id)),
    unions: [anUnion('u-cousins', 'cousin', 'cousine')],
    parentChildren: [
      aChildOf('aieul', 'fils'),
      aChildOf('aieul', 'fille'),
      aChildOf('fils', 'cousin'),
      aChildOf('fille', 'cousine'),
      aChildOf('cousin', 'enfant', { unionId: 'u-cousins' }),
      aChildOf('cousine', 'enfant', { unionId: 'u-cousins' }),
    ],
  };

  it('ne double ni une personne ni un lien atteints par deux chemins', () => {
    for (const view of ['descendants', 'hourglass'] as const) {
      const rootId = view === 'descendants' ? 'aieul' : 'enfant';
      const sub = selectSubgraph(cousins, { view, rootId });
      expect(ids(sub)).toEqual(['aieul', 'cousin', 'cousine', 'enfant', 'fille', 'fils']);
      expect(new Set(sub.parentChildren.map((l) => `${l.parentId}>${l.childId}`)).size).toBe(
        sub.parentChildren.length,
      );
    }
  });

  it('se dessine avec une seule union et un seul lien vers l’enfant', () => {
    const sub = selectSubgraph(cousins, { view: 'descendants', rootId: 'aieul' });
    const drawn = selectDisplayedGraph(sub, { focusId: 'aieul' });
    expect(drawn.unions.map((u) => u.id)).toEqual(['u-cousins']);
    expect(drawn.edges.filter((e) => e.to === 'enfant')).toEqual([
      { kind: 'child', from: 'u-cousins', to: 'enfant' },
    ]);
  });
});

describe('selectSubgraph, parent inconnu', () => {
  it('garde l’union dont l’autre partenaire est inconnu', () => {
    const graph: FamilyGraph = {
      persons: [aPerson('mere'), aPerson('enfant')],
      unions: [anUnion('u-mere', 'mere', null)],
      parentChildren: [aChildOf('mere', 'enfant', { unionId: 'u-mere' })],
    };
    const sub = selectSubgraph(graph, { view: 'descendants', rootId: 'mere' });
    expect(unionIds(sub)).toEqual(['u-mere']);
    expect(ids(sub)).toEqual(['enfant', 'mere']);
  });
});

describe('selectSubgraph, sablier et parent inconnu', () => {
  it('laisse l’union d’un ancêtre avec un inconnu quand son enfant est écarté', () => {
    const graph: FamilyGraph = {
      persons: ['pere', 'mere', 'centre', 'demi'].map((id) => aPerson(id)),
      unions: [anUnion('u-parents', 'pere', 'mere'), anUnion('u-pere-inconnu', 'pere', null)],
      parentChildren: [
        aChildOf('pere', 'centre', { unionId: 'u-parents' }),
        aChildOf('mere', 'centre', { unionId: 'u-parents' }),
        aChildOf('pere', 'demi', { unionId: 'u-pere-inconnu' }),
      ],
    };
    const sub = selectSubgraph(graph, { view: 'hourglass', rootId: 'centre' });
    expect(ids(sub)).toEqual(['centre', 'mere', 'pere']);
    expect(unionIds(sub)).toEqual(['u-parents']);
  });
});

describe('selectSubgraph, racine inconnue', () => {
  it('rend un graphe vide plutôt que d’inventer une racine', () => {
    expect(selectSubgraph(marchandFamily, { view: 'descendants', rootId: 'personne' })).toEqual({
      persons: [],
      unions: [],
      parentChildren: [],
    });
  });
});

describe('selectSubgraph, notre famille (couple)', () => {
  const couple = selectSubgraph(marchandFamily, { view: 'couple', rootId: 'luc' });
  const hourglass = selectSubgraph(marchandFamily, { view: 'hourglass', rootId: 'luc' });

  it('les deux lignées au-dessus du couple en cours, ses enfants en dessous', () => {
    expect(ids(couple)).toEqual(
      expect.arrayContaining(['luc', 'sophie', 'paul', 'bernard', 'odette']),
    );
    expect(ids(couple)).toEqual(expect.arrayContaining(['hugo', 'lea', 'jade']));
    // Le sablier de Luc seul ne monte pas chez les parents de Sophie.
    expect(ids(hourglass)).not.toContain('bernard');
  });

  it('laisse de côté fratrie et collatéraux des deux côtés', () => {
    expect(ids(couple)).not.toContain('anne');
    expect(ids(couple)).not.toContain('tom');
  });

  it('sans union en cours, c’est le sablier de la personne', () => {
    expect(selectSubgraph(marchandFamily, { view: 'couple', rootId: 'hugo' })).toEqual(
      selectSubgraph(marchandFamily, { view: 'hourglass', rootId: 'hugo' }),
    );
  });

  it('la profondeur vaut des deux côtés', () => {
    const near = selectSubgraph(marchandFamily, { view: 'couple', rootId: 'luc', depth: 1 });
    expect(ids(near)).toEqual(expect.arrayContaining(['paul', 'bernard', 'hugo']));
    expect(ids(near)).not.toContain('henri');
    expect(ids(near)).not.toContain('jade');
  });
});
