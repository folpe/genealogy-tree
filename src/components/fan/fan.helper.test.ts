import { describe, expect, it } from 'vitest';
import { redactPerson } from '@/server/access/access.redact';
import { aChildOf, aPerson, yearOnly } from '../../../tests/fixtures/builders';
import { treeForViewer } from '../../../tests/fixtures/tree-for-viewer';
import { buildFan, type FanSlot } from './fan.helper';

const ids = (slots: FanSlot[] | undefined) => (slots ?? []).map((s) => s.person?.id);

describe('buildFan', () => {
  const hugo = treeForViewer('m-hugo');

  it('range les ancêtres par génération, le père avant la mère', () => {
    const fan = buildFan(hugo, 'hugo', 3);
    expect(ids(fan?.generations[0])).toEqual(['luc', 'sophie']);
    expect(ids(fan?.generations[1])).toEqual(['paul', 'jeanne', 'bernard', 'odette']);
    expect(ids(fan?.generations[2])).toEqual([
      'henri',
      'louise',
      'emile',
      'marthe',
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('dit de quel côté et de qui chaque case est le parent', () => {
    const fan = buildFan(hugo, 'hugo', 3);
    const third = fan?.generations[2] ?? [];
    expect(third.map((s) => s.side)).toEqual([
      ...Array(4).fill('paternal'),
      ...Array(4).fill('maternal'),
    ]);
    expect(third.map((s) => s.role).slice(0, 2)).toEqual(['father', 'mother']);
    expect(third[0]?.child?.id).toBe('paul');
    // Les parents de Bernard sont inconnus : la case attend quelqu'un.
    expect(third[4]?.child?.id).toBe('bernard');
    expect(third[4]?.person).toBeUndefined();
  });

  it('au-delà d’une case vide, les cases n’ont plus d’enfant connu', () => {
    const fan = buildFan(hugo, 'hugo', 4);
    const fourth = fan?.generations[3] ?? [];
    expect(fourth).toHaveLength(16);
    expect(fourth[0]?.child?.id).toBe('henri');
    expect(fourth[8]?.child).toBeUndefined();
  });

  it('compte les ancêtres connus sur le total des cases', () => {
    const fan = buildFan(hugo, 'hugo', 4);
    expect(fan?.known).toBe(10);
    expect(fan?.total).toBe(30);
  });

  it('nomme le plus ancien et les terres d’origine, des plus fréquentes aux plus rares', () => {
    const fan = buildFan(hugo, 'hugo', 4);
    expect(fan?.oldest?.id).toBe('henri');
    // Albi (Émile, Marthe, Jeanne), Nantes (Bernard, Odette, Sophie) : à égalité, l'alphabet.
    expect(fan?.origins.slice(0, 3)).toEqual([
      { place: 'Albi', count: 3 },
      { place: 'Nantes', count: 3 },
      { place: 'Rodez', count: 2 },
    ]);
  });

  it('ignore le beau-parent qui a élevé l’enfant et préfère la filiation biologique', () => {
    const maxime = buildFan(hugo, 'maxime', 2);
    expect(ids(maxime?.generations[0])).toEqual(['luc', 'claire']);
    expect(ids(buildFan(hugo, 'tom', 1)?.generations[0])).toEqual([undefined, 'anne']);
  });

  it('place un parent de genre inconnu dans la case restée libre', () => {
    const persons = [
      aPerson('kid', { gender: 'femme' }),
      aPerson('p1', { gender: 'inconnu' }),
      aPerson('p2', { gender: 'homme' }),
    ].map((p) => redactPerson(p, 'full'));
    const parentChildren = [aChildOf('p1', 'kid'), aChildOf('p2', 'kid')];
    const fan = buildFan({ persons, parentChildren }, 'kid', 1);
    expect(ids(fan?.generations[0])).toEqual(['p2', 'p1']);
  });

  it('ne garde ni plus ni moins de générations que demandé, et refuse une racine inconnue', () => {
    expect(buildFan(hugo, 'hugo', 6)?.generations).toHaveLength(6);
    expect(buildFan(hugo, 'personne', 4)).toBeUndefined();
  });

  it('ne lit rien qu’une fiche restreinte ne montre pas', () => {
    const kid = aPerson('kid', { gender: 'femme' });
    const dad = aPerson('dad', { gender: 'homme', birth: { date: yearOnly(1900), place: 'Albi' } });
    const fan = buildFan(
      {
        persons: [redactPerson(kid, 'full'), redactPerson(dad, 'structure')],
        parentChildren: [aChildOf('dad', 'kid')],
      },
      'kid',
      1,
    );
    expect(fan?.known).toBe(1);
    expect(fan?.oldest).toBeUndefined();
    expect(fan?.origins).toEqual([]);
  });
});
