import { describe, expect, it } from 'vitest';
import { marchandFamily, marchandMembers } from '../../../tests/fixtures/marchand-family';
import { buildFamilyIndex } from '../family/family.helper';
import { buildAccessContext } from './access.policy';
import { rightsNotice, rightsNotices, rightsOf } from './access.rights';
import type { Member } from './access.types';

const ctx = () => buildAccessContext(buildFamilyIndex(marchandFamily), [...marchandMembers]);
const member = (id: string): Member => {
  const found = marchandMembers.find((m) => m.id === id);
  if (!found) throw new Error(id);
  return found;
};
const hugo = member('m-hugo');

describe('droits sur une fiche, vus par Hugo', () => {
  it('sa propre fiche', () => {
    expect(rightsOf(ctx(), hugo, 'hugo')).toEqual({ kind: 'self' });
  });

  it('ses parents et grands-parents maternels restent dans sa lignée', () => {
    expect(rightsOf(ctx(), hugo, 'luc')).toEqual({ kind: 'lineage' });
    expect(rightsOf(ctx(), hugo, 'sophie')).toEqual({ kind: 'lineage' });
    expect(rightsOf(ctx(), hugo, 'odette')).toEqual({ kind: 'lineage' });
  });

  it('un ancêtre partagé avec un membre d’une autre branche est commun', () => {
    // Henri est l'arrière-grand-père d'Isabelle ; Paul, le père d'Anne.
    expect(rightsOf(ctx(), hugo, 'henri')).toEqual({ kind: 'common' });
    expect(rightsOf(ctx(), hugo, 'paul')).toEqual({ kind: 'common' });
  });

  it('une fiche qu’aucun membre n’a dans son périmètre est ouverte', () => {
    expect(rightsOf(ctx(), hugo, 'claude')).toEqual({ kind: 'open' });
  });

  it('hors de sa lignée, la suggestion va aux gardiens de la fiche', () => {
    expect(rightsOf(ctx(), hugo, 'marie')).toEqual({
      kind: 'outside',
      guardians: ['m-isabelle'],
    });
    expect(rightsOf(ctx(), hugo, 'isabelle')).toEqual({
      kind: 'outside',
      guardians: ['m-isabelle'],
    });
  });
});

describe('droits d’un administrateur', () => {
  it('modifie directement partout', () => {
    expect(rightsOf(ctx(), member('m-folpe'), 'marie')).toEqual({ kind: 'admin' });
  });
});

describe('texte de l’encart', () => {
  const names = { personName: 'Claude', guardianNames: ['Isabelle'] };

  it('dit la règle de chaque cas, puce à l’encre quand on modifie directement', () => {
    expect(rightsNotice({ kind: 'self' }, names)).toEqual({
      tone: 'direct',
      text: 'C’est ta fiche : toi seul décides de ce que la famille voit.',
    });
    expect(rightsNotice({ kind: 'lineage' }, names)).toEqual({
      tone: 'direct',
      text: 'Dans ta lignée : tu modifies directement.',
    });
    expect(rightsNotice({ kind: 'common' }, names).text).toBe(
      'Ancêtre commun à plusieurs branches : tu modifies directement, toute sa lignée est prévenue et peut annuler.',
    );
    expect(rightsNotice({ kind: 'open' }, names).text).toBe(
      'Fiche ouverte : aucun proche de Claude n’est inscrit, tu peux la compléter.',
    );
    expect(rightsNotice({ kind: 'admin' }, names).tone).toBe('direct');
  });

  it('hors lignée, nomme les gardiens, puce en accent', () => {
    expect(rightsNotice({ kind: 'outside', guardians: ['a'] }, names)).toEqual({
      tone: 'suggest',
      text: 'Hors de ta lignée : ta suggestion ira à Isabelle.',
    });
    expect(
      rightsNotice(
        { kind: 'outside', guardians: ['a', 'b', 'c'] },
        { personName: 'Marie', guardianNames: ['Isabelle', 'Luc', 'Anne'] },
      ).text,
    ).toBe('Hors de ta lignée : ta suggestion ira à Isabelle, Luc et Anne.');
  });

  it('sans gardien inscrit, la suggestion va aux administrateurs', () => {
    expect(
      rightsNotice({ kind: 'outside', guardians: [] }, { personName: 'X', guardianNames: [] }).text,
    ).toBe('Hors de ta lignée : ta suggestion ira aux administrateurs.');
  });
});

describe('encarts de toutes les fiches visibles', () => {
  it('nomme les gardiens par leur prénom tel que le lecteur le voit', () => {
    const notices = rightsNotices(ctx(), hugo, [
      { id: 'marie', firstName: 'Marie' },
      { id: 'isabelle', firstName: 'Isabelle' },
      { id: 'hugo', firstName: 'Hugo' },
    ]);
    expect(notices['marie']?.text).toBe('Hors de ta lignée : ta suggestion ira à Isabelle.');
    expect(notices['hugo']?.tone).toBe('direct');
  });

  it('ne nomme pas un gardien que le lecteur ne voit pas', () => {
    const notices = rightsNotices(ctx(), hugo, [{ id: 'marie', firstName: 'Marie' }]);
    expect(notices['marie']?.text).toBe(
      'Hors de ta lignée : ta suggestion ira aux administrateurs.',
    );
  });
});
