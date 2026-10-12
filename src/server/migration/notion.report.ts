import { formatFuzzyDate } from '../family/fuzzy-date.helper';
import type { MigrationAnomaly, NotionTransform } from './notion.transform';

// Rapport de reprise, relu avec Folpe avant toute écriture en production. Il
// contient des noms réels : il s'écrit à côté de l'export, hors du dépôt.

const KIND_LABELS: Record<MigrationAnomaly['kind'], string> = {
  'fiche-incomplete': 'Fiche incomplète',
  'date-impossible': 'Date impossible',
  'date-a-verifier': 'Date à vérifier',
  'deces-presume': 'Décès présumé',
  'vivant-sans-date': 'Vivant sans date',
  'genre-inconnu': 'Genre inconnu',
  'doublon-probable': 'Doublon probable',
  'relation-introuvable': 'Relation introuvable',
  'lien-refuse': 'Lien refusé',
  'unions-multiples': 'Unions multiples',
  'photo-en-echec': 'Photo en échec',
};

export function renderNotionReport(transform: NotionTransform, meta: { exportedAt: string }) {
  const { stats, anomalies, nicknames, graph } = transform;
  const names = new Map(graph.persons.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const day = new Date(meta.exportedAt);
  const title = formatFuzzyDate({
    precision: 'exacte',
    year: day.getUTCFullYear(),
    month: day.getUTCMonth() + 1,
    day: day.getUTCDate(),
  });

  const who = (a: MigrationAnomaly) => {
    const label = a.personId ? (names.get(a.personId) ?? a.personId) : 'Page sans identité';
    return a.notionUrl ? `[${label}](${a.notionUrl})` : label;
  };
  const section = (heading: string, severity: MigrationAnomaly['severity']) => {
    const items = anomalies.filter((a) => a.severity === severity);
    if (items.length === 0) return [`## ${heading}`, '', 'Rien.', ''];
    return [
      `## ${heading} (${items.length})`,
      '',
      ...items.map((a) => `- **${KIND_LABELS[a.kind]}**, ${who(a)} : ${a.message}`),
      '',
    ];
  };

  const markdown = [
    `# Reprise Notion du ${title}`,
    '',
    '| Compte | Valeur |',
    '|---|---|',
    `| Pages Notion | ${stats.pages} |`,
    `| Fiches reprises | ${stats.persons} |`,
    `| Unions | ${stats.unions} |`,
    `| Filiations | ${stats.parentChildren} |`,
    `| Liens déclarés d’un seul côté dans Notion | ${stats.oneSidedRelations} |`,
    `| Photos récupérées | ${stats.photos} / ${stats.photos + stats.photoFailures} |`,
    '',
    ...section('À corriger', 'a-corriger'),
    ...section('À vérifier', 'a-verifier'),
    `## Surnoms (${nicknames.length}), à reprendre quand la fiche les portera`,
    '',
    ...(nicknames.length
      ? nicknames.map((n) => `- ${names.get(n.personId) ?? n.personId} : « ${n.nickname} »`)
      : ['Aucun.']),
    '',
  ].join('\n');

  return { markdown, json: { exportedAt: meta.exportedAt, stats, anomalies, nicknames } };
}
