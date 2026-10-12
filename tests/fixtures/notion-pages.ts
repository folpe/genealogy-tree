/**
 * Pages Notion fictives, à la forme exacte de l'API (`databases.query`), pour tester
 * la reprise sans jamais toucher aux vraies données de la famille. Les `null` sont
 * ceux que l'API renvoie pour un champ vide.
 */

type PageInput = {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  nickName?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  birthLocation?: string;
  deathDate?: string;
  city?: string;
  country?: string;
  zipCode?: number;
  photos?: string[];
  parents?: string[];
  children?: string[];
  partners?: string[];
};

const text = (value: string | undefined) => ({
  type: 'rich_text',
  rich_text: value ? [{ type: 'text', plain_text: value }] : [],
});
const date = (value: string | undefined) => ({
  type: 'date',
  date: value ? { start: value, end: null, time_zone: null } : null, // allow-null: forme de l'API Notion
});
const relation = (ids: string[] = []) => ({
  type: 'relation',
  relation: ids.map((id) => ({ id })),
  has_more: false,
});

export function aNotionPage(input: PageInput) {
  return {
    object: 'page',
    id: input.id,
    url: `https://www.notion.so/${input.id.replaceAll('-', '')}`,
    archived: false,
    properties: {
      id: {
        type: 'title',
        title: [{ type: 'text', plain_text: `${input.firstName} ${input.lastName}` }],
      },
      firstName: text(input.firstName),
      lastName: text(input.lastName),
      maidenName: text(input.maidenName),
      nickName: text(input.nickName),
      gender: { type: 'select', select: input.gender ? { name: input.gender } : null }, // allow-null: forme de l'API Notion
      birthDate: date(input.birthDate),
      birthLocation: text(input.birthLocation),
      deathDate: date(input.deathDate),
      city: text(input.city),
      country: text(input.country),
      zipCode: { type: 'number', number: input.zipCode ?? null }, // allow-null: forme de l'API Notion
      photo: {
        type: 'files',
        files: (input.photos ?? []).map((name) => ({
          name,
          type: 'file',
          file: {
            url: `https://files.notion.test/${name}?signature=x`,
            expiry_time: '2026-10-12T12:00:00.000Z',
          },
        })),
      },
      parentsIds: relation(input.parents),
      childrenIds: relation(input.children),
      partnerId: relation(input.partners),
    },
  };
}

// Identifiants à la forme de ceux de Notion (UUID).
export const NOTION_IDS = {
  henri: '00000000-0000-4000-8000-000000000001',
  louise: '00000000-0000-4000-8000-000000000002',
  paul: '00000000-0000-4000-8000-000000000003',
  jeanne: '00000000-0000-4000-8000-000000000004',
  luc: '00000000-0000-4000-8000-000000000005',
  claire: '00000000-0000-4000-8000-000000000006',
  sophie: '00000000-0000-4000-8000-000000000007',
  hugo: '00000000-0000-4000-8000-000000000008',
} as const;
const N = NOTION_IDS;

/** Une branche Marchand telle qu'elle pourrait être saisie dans Notion, défauts compris. */
export function marchandNotionPages() {
  return [
    aNotionPage({
      id: N.henri,
      firstName: 'Henri',
      lastName: 'Marchand',
      gender: 'male',
      // Saisi au 1er janvier faute de mieux : précision à vérifier.
      birthDate: '1902-01-01',
      birthLocation: 'Rodez',
      deathDate: '1979-11-12',
      children: [N.paul],
      partners: [N.louise],
    }),
    aNotionPage({
      id: N.louise,
      firstName: 'Louise',
      lastName: 'Marchand',
      maidenName: 'Vidal',
      gender: 'female',
      // Née il y a plus de 110 ans, sans date de décès.
      birthDate: '1905-04-02',
      birthLocation: 'Millau',
      children: [N.paul],
      partners: [N.henri],
    }),
    aNotionPage({
      id: N.paul,
      firstName: 'Paul',
      lastName: 'Marchand',
      gender: 'male',
      birthDate: '1931-06-20',
      birthLocation: 'Rodez',
      deathDate: '2008-03-03',
      parents: [N.henri, N.louise],
      children: [N.luc],
      partners: [N.jeanne],
    }),
    aNotionPage({
      id: N.jeanne,
      firstName: 'Jeanne',
      lastName: 'Marchand',
      gender: 'female',
      birthDate: '1934-02-11',
      birthLocation: 'Albi',
      city: 'Toulouse',
      country: 'France',
      // Relation saisie d'un seul côté : Luc n'est pas listé dans ses enfants.
      partners: [N.paul],
    }),
    aNotionPage({
      id: N.luc,
      firstName: 'Luc',
      lastName: 'Marchand',
      nickName: 'Lulu',
      gender: 'male',
      birthDate: '1963-08-21',
      birthLocation: 'Toulouse',
      city: 'Toulouse',
      country: 'France',
      zipCode: 31000,
      photos: ['luc.jpg'],
      parents: [N.paul, N.jeanne],
      children: [N.hugo],
      partners: [N.claire, N.sophie],
    }),
    aNotionPage({
      id: N.claire,
      firstName: 'Claire',
      lastName: 'Dumont',
      gender: 'female',
      birthDate: '1964-05-05',
      birthLocation: 'Nantes',
      city: 'Montréal',
      country: 'Canada',
      partners: [N.luc],
    }),
    aNotionPage({
      id: N.sophie,
      firstName: 'Sophie',
      lastName: 'Marchand',
      maidenName: 'Blanc',
      gender: 'female',
      birthDate: '1965-01-09',
      birthLocation: 'Nantes',
      children: [N.hugo],
      partners: [N.luc],
    }),
    aNotionPage({
      id: N.hugo,
      firstName: 'Hugo',
      lastName: 'Marchand',
      gender: 'male',
      birthDate: '1995-11-26',
      birthLocation: 'Toulouse',
      parents: [N.luc, N.sophie],
    }),
  ];
}
