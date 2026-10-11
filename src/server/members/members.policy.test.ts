import { describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { buildFamilyIndex } from '../family/family.helper';
import { canInvite, canSetAdmin, type MemberRecord } from './members.policy';

const index = buildFamilyIndex(marchandFamily);

const member = (id: string, personId: string | undefined, extra: Partial<MemberRecord> = {}) => ({
  id,
  personId,
  isAdmin: false,
  isOwner: false,
  ...extra,
});
const owner = member('m-owner', undefined, { isAdmin: true, isOwner: true });
const hugo = member('m-hugo', 'hugo');
const luc = member('m-luc', 'luc');

describe('canInvite', () => {
  const linked = new Set(['hugo', 'luc']);

  it('autorise le cercle proche : parents, frères et sœurs, conjoint', () => {
    expect(canInvite(index, hugo, 'sophie', linked)).toEqual({ allowed: true });
    expect(canInvite(index, hugo, 'lea', linked)).toEqual({ allowed: true });
  });

  it('autorise toute la descendance, petits-enfants compris', () => {
    expect(canInvite(index, luc, 'jade', linked)).toEqual({ allowed: true });
  });

  it('refuse au-delà : un grand-parent, un cousin passent par un admin ou un proche', () => {
    expect(canInvite(index, hugo, 'paul', linked)).toEqual({ allowed: false, reason: 'outside' });
    expect(canInvite(index, hugo, 'isabelle', linked)).toEqual({
      allowed: false,
      reason: 'outside',
    });
  });

  it('un admin invite qui il veut, même sans fiche', () => {
    expect(canInvite(index, owner, 'isabelle', linked)).toEqual({ allowed: true });
  });

  it('un membre sans fiche et sans droit d’admin n’invite personne', () => {
    expect(canInvite(index, member('m-x', undefined), 'lea', linked)).toEqual({
      allowed: false,
      reason: 'outside',
    });
  });

  it('une fiche déjà reliée à un compte ne s’invite plus', () => {
    expect(canInvite(index, hugo, 'luc', linked)).toEqual({
      allowed: false,
      reason: 'already-member',
    });
  });

  it('une fiche inconnue est refusée', () => {
    expect(canInvite(index, owner, 'personne', linked)).toEqual({
      allowed: false,
      reason: 'unknown-person',
    });
  });
});

describe('canSetAdmin', () => {
  const admin = member('m-anne', 'anne', { isAdmin: true });
  const members = [owner, admin, hugo, luc];

  it('seul un admin nomme ou retire un admin', () => {
    expect(canSetAdmin(members, hugo, 'm-luc', true)).toEqual({
      allowed: false,
      reason: 'not-admin',
    });
    expect(canSetAdmin(members, admin, 'm-luc', true)).toEqual({ allowed: true });
    expect(canSetAdmin(members, owner, 'm-anne', false)).toEqual({ allowed: true });
  });

  it('le propriétaire ne peut pas être rétrogradé, même par lui-même', () => {
    expect(canSetAdmin(members, admin, 'm-owner', false)).toEqual({
      allowed: false,
      reason: 'owner-protected',
    });
    expect(canSetAdmin(members, owner, 'm-owner', false)).toEqual({
      allowed: false,
      reason: 'owner-protected',
    });
  });

  it('le dernier admin ne peut pas être retiré', () => {
    const alone = [admin, hugo];
    expect(canSetAdmin(alone, admin, 'm-anne', false)).toEqual({
      allowed: false,
      reason: 'last-admin',
    });
  });

  it('un membre inconnu est refusé', () => {
    expect(canSetAdmin(members, owner, 'm-inconnu', true)).toEqual({
      allowed: false,
      reason: 'unknown-member',
    });
  });
});
