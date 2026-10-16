import { and, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { marchandFamily } from '../../../tests/fixtures/marchand-family';
import { testDb } from '../../../tests/integration/test-db';
import { ValidationError } from '../_shared/errors';
import { accessRequests, invitations, memberships, users } from '../db/schema';
import { insertFamilyGraph } from '../family/family.repository';
import type { EmailMessage } from '../notifications/email';
import {
  ACCESS_REQUESTS_PER_HOUR,
  cancelInvitation,
  claimOwnPerson,
  decideAccessRequest,
  getInvitationPreview,
  getViewerAccount,
  inviteMember,
  listAccessRequests,
  listMembers,
  listPendingInvitations,
  type MembersDeps,
  requestAccess,
  resendInvitation,
  setAdmin,
} from './members.service';

const db = testDb();
const NOW = new Date('2026-10-11T12:00:00Z');

describe.skipIf(!db)('members.service (intégration)', () => {
  if (!db) return;
  const { client, reset, close } = db;
  let sent: EmailMessage[] = [];
  const deps = (): MembersDeps => ({
    db: client,
    now: () => NOW,
    appUrl: 'https://famille.folpe.me',
    sendEmail: async (message) => {
      sent.push(message);
    },
  });

  async function addMember(
    id: string,
    email: string,
    personId: string | undefined,
    extra: { isAdmin?: boolean; isOwner?: boolean } = {},
  ) {
    await client.insert(users).values({ id, email, name: '' });
    const [m] = await client
      .insert(memberships)
      .values({ userId: id, personId, ...extra })
      .returning({ id: memberships.id });
    return m?.id ?? '';
  }

  /** Jeton en clair porté par le lien d'un email d'invitation. */
  const tokenOf = (message: EmailMessage | undefined) =>
    /\/invite\/([\w-]+)/.exec(message?.text ?? '')?.[1] ?? '';

  const pendingFor = (personId: string) =>
    client
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.personId, personId),
          isNull(invitations.usedAt),
          isNull(invitations.revokedAt),
        ),
      );

  beforeEach(async () => {
    await reset();
    sent = [];
    await insertFamilyGraph(client, marchandFamily);
    await addMember('u-owner', 'folpe@exemple.fr', undefined, { isAdmin: true, isOwner: true });
    await addMember('u-hugo', 'hugo@exemple.fr', 'hugo');
  });
  afterAll(async () => {
    await close();
  });

  describe('inviteMember', () => {
    it('Hugo invite sa sœur : invitation créée, email avec le lien d’invitation', async () => {
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'Lea@Exemple.fr' });
      const [invitation] = await client.select().from(invitations);
      expect(invitation).toMatchObject({
        email: 'lea@exemple.fr',
        personId: 'lea',
        invitedBy: 'u-hugo',
      });
      expect(sent).toHaveLength(1);
      expect(sent[0]?.to).toBe('lea@exemple.fr');
      expect(sent[0]?.text).toMatch(/https:\/\/famille\.folpe\.me\/invite\/[\w-]{20,}/);
      expect(sent[0]?.text).toContain('Hugo');
    });

    it('Hugo ne peut pas inviter son grand-père', async () => {
      await expect(
        inviteMember(deps(), 'u-hugo', { personId: 'paul', email: 'paul@exemple.fr' }),
      ).rejects.toMatchObject({ code: 'MEMBERS_FORBIDDEN', status: 403 });
      expect(sent).toHaveLength(0);
    });

    it('réinviter une fiche remplace l’invitation en attente : l’ancien lien ne sert plus', async () => {
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'lea@exemple.fr' });
      const first = tokenOf(sent[0]);
      await inviteMember(deps(), 'u-owner', { personId: 'lea', email: 'autre@exemple.fr' });
      const second = tokenOf(sent[1]);

      expect(await getInvitationPreview(client, first, NOW)).toBeUndefined();
      expect(await getInvitationPreview(client, second, NOW)).toMatchObject({
        email: 'autre@exemple.fr',
      });
      const rows = await client.select().from(invitations).where(eq(invitations.personId, 'lea'));
      expect(rows.map((r) => [r.email, r.revokedAt instanceof Date])).toEqual(
        expect.arrayContaining([
          ['lea@exemple.fr', true],
          ['autre@exemple.fr', false],
        ]),
      );
    });

    it('réinviter à la même adresse remplace aussi', async () => {
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'lea@exemple.fr' });
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'Lea@Exemple.fr' });
      expect(await pendingFor('lea')).toHaveLength(1);
      expect(sent).toHaveLength(2);
    });

    it('une adresse déjà en attente pour une autre fiche est refusée, même sans ses points', async () => {
      await inviteMember(deps(), 'u-owner', { personId: 'lea', email: 'lea.marchand@gmail.com' });
      await expect(
        inviteMember(deps(), 'u-owner', { personId: 'isabelle', email: 'leamarchand@gmail.com' }),
      ).rejects.toMatchObject({
        code: 'MEMBERS_INVITATION_PENDING',
        status: 409,
        message: 'Cette adresse attend déjà une invitation pour une autre fiche.',
      });
      expect(await pendingFor('lea')).toHaveLength(1);
      expect(await pendingFor('isabelle')).toHaveLength(0);
      expect(sent).toHaveLength(1);
    });

    it('un visiteur sans compte n’invite personne', async () => {
      await expect(
        inviteMember(deps(), 'u-inconnu', { personId: 'lea', email: 'lea@exemple.fr' }),
      ).rejects.toMatchObject({ code: 'MEMBERS_FORBIDDEN' });
    });
  });

  describe('invitations en attente (admin)', () => {
    async function inviteLea() {
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'lea@exemple.fr' });
      const [invitation] = await pendingFor('lea');
      if (!invitation) throw new Error('invitation manquante');
      return { id: invitation.id, token: tokenOf(sent.at(-1)) };
    }

    it('la liste montre la fiche, l’adresse, l’envoi et l’échéance', async () => {
      await inviteLea();
      expect(await listPendingInvitations(deps(), 'u-owner')).toEqual([
        {
          id: expect.any(String),
          personId: 'lea',
          label: 'Léa Marchand',
          email: 'lea@exemple.fr',
          sentAt: expect.any(Date),
          expiresAt: new Date('2026-10-25T12:00:00Z'),
          expired: false,
        },
      ]);
      const after = { ...deps(), now: () => new Date('2026-10-25T12:00:00Z') };
      expect((await listPendingInvitations(after, 'u-owner'))[0]?.expired).toBe(true);
    });

    it('« Annuler » révoque : le lien ne sert plus et la fiche se réinvite', async () => {
      const { id, token } = await inviteLea();
      await cancelInvitation(deps(), 'u-owner', id);
      expect(await getInvitationPreview(client, token, NOW)).toBeUndefined();
      expect(await listPendingInvitations(deps(), 'u-owner')).toEqual([]);
      await expect(cancelInvitation(deps(), 'u-owner', id)).rejects.toMatchObject({
        code: 'MEMBERS_NOT_FOUND',
        status: 404,
      });
    });

    it('« Renvoyer » envoie un nouveau lien et éteint l’ancien', async () => {
      const { id, token } = await inviteLea();
      await resendInvitation(deps(), 'u-owner', id);
      expect(sent).toHaveLength(2);
      expect(sent[1]?.to).toBe('lea@exemple.fr');
      const fresh = tokenOf(sent[1]);
      expect(fresh).not.toBe(token);
      expect(await getInvitationPreview(client, token, NOW)).toBeUndefined();
      expect(await getInvitationPreview(client, fresh, NOW)).toBeDefined();
      expect(await pendingFor('lea')).toHaveLength(1);
    });

    it('seul un admin voit, annule ou renvoie', async () => {
      const { id } = await inviteLea();
      await expect(listPendingInvitations(deps(), 'u-hugo')).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
      await expect(cancelInvitation(deps(), 'u-hugo', id)).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
      await expect(resendInvitation(deps(), 'u-hugo', id)).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
      expect(await pendingFor('lea')).toHaveLength(1);
      expect(sent).toHaveLength(1);
    });
  });

  describe('demandes d’accès', () => {
    it('une demande prévient les admins, puis l’admin l’accepte en choisissant la fiche', async () => {
      const { id } = await requestAccess(deps(), {
        name: 'Isabelle Lefèvre',
        email: 'Isabelle@Exemple.fr',
        relation: 'Cousine de Luc',
      });
      expect(sent.map((m) => m.to)).toEqual(['folpe@exemple.fr']);
      expect(sent[0]?.text).toContain('Isabelle Lefèvre');

      sent = [];
      await decideAccessRequest(deps(), 'u-owner', id, { accept: true, personId: 'isabelle' });
      const [request] = await client.select().from(accessRequests).where(eq(accessRequests.id, id));
      expect(request).toMatchObject({
        status: 'acceptee',
        personId: 'isabelle',
        decidedBy: 'u-owner',
      });
      const [invitation] = await client.select().from(invitations);
      expect(invitation).toMatchObject({ email: 'isabelle@exemple.fr', personId: 'isabelle' });
      expect(sent[0]?.to).toBe('isabelle@exemple.fr');
      expect(sent[0]?.subject).toBe('Ta demande est acceptée : bienvenue dans l’arbre');
    });

    it('une demande en attente est reconnue sous l’autre forme d’une adresse Gmail', async () => {
      const first = await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'xavier.roux@gmail.com',
        relation: 'Voisin',
      });
      const again = await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'XavierRoux+arbre@googlemail.com',
        relation: 'Voisin',
      });
      expect(again).toEqual(first);
      expect(await client.select().from(accessRequests)).toHaveLength(1);
      expect(sent).toHaveLength(1);
    });

    it('un refus ne crée rien et n’envoie rien au demandeur', async () => {
      const { id } = await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'x@exemple.fr',
        relation: 'Voisin',
      });
      sent = [];
      await decideAccessRequest(deps(), 'u-owner', id, { accept: false });
      expect(await client.select().from(invitations)).toHaveLength(0);
      expect(sent).toHaveLength(0);
    });

    it('seul un admin tranche', async () => {
      const { id } = await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'x@exemple.fr',
        relation: 'Voisin',
      });
      await expect(
        decideAccessRequest(deps(), 'u-hugo', id, { accept: true, personId: 'isabelle' }),
      ).rejects.toMatchObject({ code: 'MEMBERS_FORBIDDEN' });
    });
  });

  describe('getViewerAccount', () => {
    it('Hugo : sa fiche, son nom et ses initiales pour l’avatar', async () => {
      expect(await getViewerAccount(deps(), 'u-hugo')).toEqual({
        personId: 'hugo',
        name: 'Hugo Marchand',
        initials: 'HM',
        email: 'hugo@exemple.fr',
        isAdmin: false,
      });
    });

    it('un admin sans fiche : son email tient lieu de nom', async () => {
      expect(await getViewerAccount(deps(), 'u-owner')).toEqual({
        personId: undefined,
        name: 'folpe@exemple.fr',
        initials: 'F',
        email: 'folpe@exemple.fr',
        isAdmin: true,
      });
    });

    it('un compte sans adhésion n’a rien à voir', async () => {
      await client.insert(users).values({ id: 'u-x', email: 'x@exemple.fr', name: '' });
      await expect(getViewerAccount(deps(), 'u-x')).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
    });
  });

  describe('claimOwnPerson (« C’est moi »)', () => {
    it('un admin sans fiche se relie à une fiche libre', async () => {
      await claimOwnPerson(deps(), 'u-owner', 'paul');
      expect((await getViewerAccount(deps(), 'u-owner')).personId).toBe('paul');
    });

    it('une fiche déjà reliée à un autre compte est refusée', async () => {
      await expect(claimOwnPerson(deps(), 'u-owner', 'hugo')).rejects.toMatchObject({
        code: 'MEMBERS_PERSON_TAKEN',
      });
    });

    it('un compte déjà relié ne change pas de fiche ainsi', async () => {
      await claimOwnPerson(deps(), 'u-owner', 'paul');
      await expect(claimOwnPerson(deps(), 'u-owner', 'jeanne')).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
    });

    it('un membre (toujours relié à sa fiche, contrainte en base) ne change pas de fiche', async () => {
      await expect(claimOwnPerson(deps(), 'u-hugo', 'paul')).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
    });

    it('une fiche promise par une invitation en attente est refusée', async () => {
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'lea@exemple.fr' });
      await expect(claimOwnPerson(deps(), 'u-owner', 'lea')).rejects.toMatchObject({
        code: 'MEMBERS_INVITATION_PENDING',
      });
    });

    it('un identifiant hors format est refusé avant la base', async () => {
      await expect(claimOwnPerson(deps(), 'u-owner', 'x'.repeat(65))).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('une fiche inconnue est refusée', async () => {
      await expect(claimOwnPerson(deps(), 'u-owner', 'personne')).rejects.toMatchObject({
        code: 'MEMBERS_NOT_FOUND',
      });
    });
  });

  describe('setAdmin', () => {
    it('le propriétaire nomme Hugo admin, puis le retire', async () => {
      const [hugo] = await client
        .select()
        .from(memberships)
        .where(eq(memberships.userId, 'u-hugo'));
      await setAdmin(deps(), 'u-owner', hugo?.id ?? '', true);
      expect(
        (await client.select().from(memberships).where(eq(memberships.userId, 'u-hugo')))[0]
          ?.isAdmin,
      ).toBe(true);
      await setAdmin(deps(), 'u-owner', hugo?.id ?? '', false);
      expect(
        (await client.select().from(memberships).where(eq(memberships.userId, 'u-hugo')))[0]
          ?.isAdmin,
      ).toBe(false);
    });

    it('le propriétaire reste admin', async () => {
      const [owner] = await client
        .select()
        .from(memberships)
        .where(eq(memberships.userId, 'u-owner'));
      await expect(setAdmin(deps(), 'u-owner', owner?.id ?? '', false)).rejects.toMatchObject({
        code: 'MEMBERS_OWNER_PROTECTED',
      });
    });
  });

  describe('frein aux demandes d’accès', () => {
    it('une même adresse n’a qu’une demande en attente, et les admins ne sont prévenus qu’une fois', async () => {
      const first = await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'x@exemple.fr',
        relation: 'Voisin',
      });
      const second = await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'X@exemple.fr',
        relation: 'Voisin',
      });
      expect(second.id).toBe(first.id);
      expect(sent).toHaveLength(1);
    });

    it('au-delà du plafond horaire, les demandes sont refusées', async () => {
      for (let i = 0; i < ACCESS_REQUESTS_PER_HOUR; i++) {
        await requestAccess(deps(), {
          name: `Personne ${i}`,
          email: `p${i}@exemple.fr`,
          relation: 'Cousin',
        });
      }
      await expect(
        requestAccess(deps(), {
          name: 'Une de trop',
          email: 'trop@exemple.fr',
          relation: 'Cousin',
        }),
      ).rejects.toMatchObject({ code: 'MEMBERS_TOO_MANY_REQUESTS', status: 429 });
    });
  });

  describe('lectures', () => {
    it('l’aperçu d’une invitation donne l’adresse, le prénom et qui invite', async () => {
      await inviteMember(deps(), 'u-hugo', { personId: 'lea', email: 'lea@exemple.fr' });
      const token = /\/invite\/([\w-]+)/.exec(sent[0]?.text ?? '')?.[1] ?? '';
      expect(await getInvitationPreview(client, token, NOW)).toEqual({
        email: 'lea@exemple.fr',
        firstName: 'Léa',
        inviterName: 'Hugo',
      });
      expect(await getInvitationPreview(client, 'faux-jeton', NOW)).toBeUndefined();
      const later = new Date(NOW.getTime() + 15 * 24 * 3600 * 1000);
      expect(await getInvitationPreview(client, token, later)).toBeUndefined();
    });

    it('la page Membres liste les comptes et les fiches que je peux inviter', async () => {
      const view = await listMembers(deps(), 'u-hugo');
      expect(view.viewer).toMatchObject({ isAdmin: false });
      expect(view.members.map((m) => m.label).sort()).toEqual([
        'Hugo Marchand',
        'folpe@exemple.fr',
      ]);
      const invitable = view.invitable.map((p) => p.personId).sort();
      expect(invitable).toContain('lea');
      expect(invitable).toContain('sophie');
      expect(invitable).not.toContain('paul');
      expect(invitable).not.toContain('hugo');
    });

    it('les demandes en attente ne se lisent que par un admin', async () => {
      await requestAccess(deps(), {
        name: 'Xavier Roux',
        email: 'x@exemple.fr',
        relation: 'Voisin',
      });
      const view = await listAccessRequests(deps(), 'u-owner');
      expect(view.requests).toHaveLength(1);
      expect(view.unlinkedPersons.some((p) => p.personId === 'hugo')).toBe(false);
      expect(view.unlinkedPersons.some((p) => p.personId === 'isabelle')).toBe(true);
      await expect(listAccessRequests(deps(), 'u-hugo')).rejects.toMatchObject({
        code: 'MEMBERS_FORBIDDEN',
      });
    });
  });
});
