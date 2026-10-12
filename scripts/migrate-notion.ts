import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { Client } from '@notionhq/client';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/server/db/schema';
import { todayIn } from '../src/server/family/fuzzy-date.helper';
import { decryptExport, encryptExport } from '../src/server/migration/export-crypto';
import { renderNotionReport } from '../src/server/migration/notion.report';
import { loadNotionGraph } from '../src/server/migration/notion.repository';
import { notionPageSchema, photoFiles } from '../src/server/migration/notion.schema';
import { type PhotoOutcome, transformNotionExport } from '../src/server/migration/notion.transform';

// Reprise Notion -> Neon (spec section 15.1, plan phase 3 lot 8). Notion n'est
// jamais modifié : le script ne fait que lire la base.
//
//   bun scripts/migrate-notion.ts extract
//   bun scripts/migrate-notion.ts report <dossier>
//   bun scripts/migrate-notion.ts load <dossier> --target notion-import [--dry-run]
//   bun scripts/migrate-notion.ts load <dossier> --target main --confirm-production
//
// Secrets lus dans le trousseau macOS (compte `ances-tree`) : jeton Notion, base,
// clé de chiffrement de l'export. L'export et le rapport vivent hors du dépôt.

const EXPORT_ROOT = join(homedir(), '.local/share/ances-tree/notion-exports');
const NEON_PROJECT_ID = 'frosty-feather-00901702';
const MAX_PAGES = 5_000;
const PHOTO_TIMEOUT_MS = 30_000;
const PHOTO_MAX_BYTES = 25 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/gif': 'gif',
};

function secret(service: string): string {
  return execFileSync('security', [
    'find-generic-password',
    '-a',
    'ances-tree',
    '-s',
    service,
    '-w',
  ])
    .toString()
    .trim();
}

function writePrivate(path: string, content: Buffer | string) {
  writeFileSync(path, content, { mode: 0o600 });
}

async function downloadPhoto(url: string): Promise<{ bytes: Buffer; mime: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > PHOTO_MAX_BYTES) throw new Error(`trop lourde (${bytes.length} octets)`);
  const mime = (response.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
  if (!EXTENSIONS[mime]) throw new Error(`type non pris en charge : ${mime || 'inconnu'}`);
  return { bytes, mime };
}

async function extract() {
  const notion = new Client({ auth: secret('ances-tree-notion-token') });
  const databaseId = secret('ances-tree-notion-database');
  const key = secret('ances-tree-export-key');
  const exportedAt = new Date().toISOString();
  const dir = join(EXPORT_ROOT, exportedAt.replace(/[:.]/g, '-'));
  mkdirSync(join(dir, 'photos'), { recursive: true, mode: 0o700 });

  const pages: unknown[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...response.results);
    cursor = response.next_cursor ?? undefined;
  } while (cursor && pages.length < MAX_PAGES);
  if (cursor) throw new Error(`Plus de ${MAX_PAGES} pages : export interrompu`);

  // Les URLs Notion expirent au bout d'une heure : chaque photo est téléchargée tout de suite.
  const photos: (PhotoOutcome & { sha256?: string; mime?: string; bytes?: number })[] = [];
  for (const raw of pages) {
    const page = notionPageSchema.safeParse(raw);
    if (!page.success) continue;
    for (const file of photoFiles(page.data)) {
      try {
        const { bytes, mime } = await downloadPhoto(file.url);
        const sha256 = createHash('sha256').update(bytes).digest('hex');
        writePrivate(
          join(dir, 'photos', `${sha256}.${EXTENSIONS[mime]}.enc`),
          encryptExport(bytes, key),
        );
        photos.push({
          pageId: page.data.id,
          name: file.name,
          ok: true,
          sha256,
          mime,
          bytes: bytes.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        photos.push({ pageId: page.data.id, name: file.name, ok: false, error: message });
      }
    }
  }

  const bundle = JSON.stringify({ exportedAt, databaseId, pages, photos });
  writePrivate(join(dir, 'export.json.enc'), encryptExport(Buffer.from(bundle), key));
  chmodSync(dir, 0o700);
  const failed = photos.filter((p) => !p.ok).length;
  console.log(
    `Export : ${pages.length} pages, ${photos.length - failed} photos, ${failed} en échec.`,
  );
  console.log(dir);
}

function readExport(dir: string) {
  const clear = decryptExport(
    readFileSync(join(dir, 'export.json.enc')),
    secret('ances-tree-export-key'),
  );
  const bundle: { exportedAt: string; pages: unknown[]; photos: PhotoOutcome[] } = JSON.parse(
    clear.toString('utf8'),
  );
  const transform = transformNotionExport(bundle.pages, {
    today: todayIn(new Date(), 'Europe/Paris'),
    photos: bundle.photos,
  });
  return { bundle, transform };
}

function report(dir: string) {
  const { bundle, transform } = readExport(dir);
  const { markdown, json } = renderNotionReport(transform, { exportedAt: bundle.exportedAt });
  writePrivate(join(dir, 'rapport.md'), markdown);
  writePrivate(join(dir, 'rapport.json'), JSON.stringify(json, undefined, 2));
  const fix = transform.anomalies.filter((a) => a.severity === 'a-corriger').length;
  console.log(
    `Rapport : ${transform.stats.persons} fiches, ${fix} anomalies à corriger, ` +
      `${transform.anomalies.length - fix} à vérifier.`,
  );
  console.log(join(dir, 'rapport.md'));
}

class DryRun extends Error {}

async function load(dir: string, target: string, options: { dryRun: boolean; confirmed: boolean }) {
  if (target === 'main' && !options.dryRun && !options.confirmed) {
    throw new Error(
      'Écriture en production : ajoute --confirm-production après validation de Folpe',
    );
  }
  const { transform } = readExport(dir);
  // Rôle applicatif : droits sur les données, aucun sur le schéma.
  const url = execFileSync('neonctl', [
    'connection-string',
    target,
    '--project-id',
    NEON_PROJECT_ID,
    '--database-name',
    'ances_tree',
    '--role-name',
    'ances_tree_app',
  ])
    .toString()
    .trim();
  const connection = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(connection, { schema });
  try {
    const result = await db.transaction(async (tx) => {
      const loaded = await loadNotionGraph(tx, transform.graph);
      // Le dry-run passe par les vraies contraintes de la base, puis annule tout.
      if (options.dryRun) throw new DryRun(JSON.stringify(loaded));
      return loaded;
    });
    console.log(`Chargé sur ${target} :`, result);
  } catch (error) {
    if (!(error instanceof DryRun)) throw error;
    console.log(`Dry-run sur ${target}, rien n'est écrit :`, JSON.parse(error.message));
  } finally {
    await connection.end();
  }
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'confirm-production': { type: 'boolean', default: false },
  },
});
const [command, dir] = positionals;

if (command === 'extract') {
  await extract();
} else if (command === 'report' && dir) {
  report(dir);
} else if (command === 'load' && dir && values.target) {
  await load(dir, values.target, {
    dryRun: values['dry-run'],
    confirmed: values['confirm-production'],
  });
} else {
  console.error(
    'Usage : extract | report <dossier> | load <dossier> --target <branche> [--dry-run]',
  );
  process.exit(1);
}
