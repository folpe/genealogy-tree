// Génère les icônes de l'app depuis le signe de `src/lib/brand.ts` : favicon, icônes
// installables (dont la masquable), icône iOS et logo des emails. À relancer quand le
// signe change : `bun run brand:icons`. Les fichiers produits sont versionnés dans public/.

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { BRAND_INK, BRAND_PAPER, brandMarkSvg } from '../src/lib/brand';

const PUBLIC = join(import.meta.dirname, '..', 'public');

type Icon = {
  file: string;
  size: number;
  shape: 'circle' | 'square';
  inset: number;
};

// Pastille ronde (favicon, icône « any », email) : le signe respire comme dans l'en-tête.
// Carré plein (iOS, masquable) : le système découpe, le signe reste dans la zone sûre.
const ICONS: Icon[] = [
  { file: 'favicon-96x96.png', size: 96, shape: 'circle', inset: 0.12 },
  { file: 'web-app-manifest-192x192.png', size: 192, shape: 'circle', inset: 0.12 },
  { file: 'web-app-manifest-512x512.png', size: 512, shape: 'circle', inset: 0.12 },
  { file: 'web-app-manifest-maskable-512x512.png', size: 512, shape: 'square', inset: 0.25 },
  { file: 'apple-touch-icon.png', size: 180, shape: 'square', inset: 0.18 },
  { file: 'email/logo.png', size: 96, shape: 'circle', inset: 0.12 },
];

const ICO_SIZES = [16, 32, 48];

function svgFor(icon: Pick<Icon, 'size' | 'shape' | 'inset'>) {
  return brandMarkSvg({ ...icon, stroke: BRAND_PAPER, background: BRAND_INK });
}

const png = (svg: string) => sharp(Buffer.from(svg)).png().toBuffer();

/** Conteneur ICO qui embarque des PNG (accepté par tous les navigateurs actuels). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

async function main() {
  const vector = svgFor({ size: 512, shape: 'circle', inset: 0.12 });
  await writeFile(join(PUBLIC, 'favicon.svg'), `${vector}\n`);
  for (const icon of ICONS) {
    await writeFile(join(PUBLIC, icon.file), await png(svgFor(icon)));
  }
  const images = await Promise.all(
    ICO_SIZES.map(async (size) => ({
      size,
      data: await png(svgFor({ size, shape: 'circle', inset: 0.12 })),
    })),
  );
  await writeFile(join(PUBLIC, 'favicon.ico'), ico(images));
}

await main();
