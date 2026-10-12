import { describe, expect, it } from 'vitest';
import { exact } from '../../../tests/fixtures/builders';
import { marchandNotionPages, NOTION_IDS as N } from '../../../tests/fixtures/notion-pages';
import { renderNotionReport } from './notion.report';
import { transformNotionExport } from './notion.transform';

const transform = transformNotionExport(marchandNotionPages(), {
  today: exact(2026, 10, 12),
  photos: [
    { pageId: N.luc, name: 'luc.jpg', ok: true },
    { pageId: N.hugo, name: 'hugo.png', ok: false, error: 'HTTP 403' },
  ],
});
const report = renderNotionReport(transform, { exportedAt: '2026-10-12T09:30:00.000Z' });

describe('renderNotionReport', () => {
  it('ouvre sur les comptes Notion et repris', () => {
    expect(report.markdown).toContain('# Reprise Notion du 12 octobre 2026');
    expect(report.markdown).toMatch(/\| Pages Notion \| 8 \|/);
    expect(report.markdown).toMatch(/\| Fiches reprises \| 8 \|/);
    expect(report.markdown).toMatch(/\| Photos récupérées \| 1 \/ 2 \|/);
  });

  it('met les anomalies à corriger avant celles à vérifier, avec le lien Notion', () => {
    const corriger = report.markdown.indexOf('## À corriger');
    const verifier = report.markdown.indexOf('## À vérifier');
    expect(corriger).toBeGreaterThan(-1);
    expect(verifier).toBeGreaterThan(corriger);
    expect(report.markdown).toContain(
      `[Hugo Marchand](https://www.notion.so/${N.hugo.replaceAll('-', '')})`,
    );
  });

  it('fournit la même chose en JSON', () => {
    expect(report.json).toMatchObject({
      exportedAt: '2026-10-12T09:30:00.000Z',
      stats: { persons: 8, photoFailures: 1 },
    });
    expect(report.json.anomalies.length).toBe(transform.anomalies.length);
  });
});
