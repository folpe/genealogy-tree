import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { normalizeImage } from './media.image';

// Images de synthèse : aucune photo réelle dans les tests.
async function aJpeg(options: {
  width: number;
  height: number;
  orientation?: number;
  gps?: boolean;
}): Promise<Buffer> {
  let image = sharp({
    create: {
      width: options.width,
      height: options.height,
      channels: 3,
      background: { r: 200, g: 120, b: 80 },
    },
  }).jpeg();
  if (options.gps) {
    image = image.withExif({
      IFD0: { Make: 'Appareil de test' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '44/1 21/1 0/1' },
    });
  }
  if (options.orientation) image = image.withMetadata({ orientation: options.orientation });
  return image.toBuffer();
}

describe('normalizeImage', () => {
  it('retire l’EXIF et la position GPS de l’original et des dérivées', async () => {
    const input = await aJpeg({ width: 400, height: 300, gps: true });
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const result = await normalizeImage(input);
    for (const bytes of [result.original.bytes, ...result.variants.map((v) => v.bytes)]) {
      const metadata = await sharp(bytes).metadata();
      expect(metadata.exif).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
    }
  });

  it('applique la rotation EXIF (photo prise téléphone tourné)', async () => {
    const input = await aJpeg({ width: 400, height: 200, orientation: 6 });
    const result = await normalizeImage(input);
    expect(result.original).toMatchObject({ width: 200, height: 400, mime: 'image/jpeg' });
    const metadata = await sharp(result.original.bytes).metadata();
    expect(metadata.orientation ?? 1).toBe(1);
    expect([metadata.width, metadata.height]).toEqual([200, 400]);
  });

  it('produit les dérivées WebP 256, 768 et 1600 sans agrandir', async () => {
    const result = await normalizeImage(await aJpeg({ width: 1000, height: 500 }));
    const sizes = await Promise.all(
      result.variants.map(async (v) => {
        const m = await sharp(v.bytes).metadata();
        return { width: v.width, actual: v.actualWidth, format: m.format, pixels: m.width };
      }),
    );
    expect(sizes).toEqual([
      { width: 256, actual: 256, format: 'webp', pixels: 256 },
      { width: 768, actual: 768, format: 'webp', pixels: 768 },
      { width: 1600, actual: 1000, format: 'webp', pixels: 1000 },
    ]);
  });

  it('fournit un aperçu flou en data URL, léger', async () => {
    const result = await normalizeImage(await aJpeg({ width: 600, height: 400 }));
    expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(result.blurDataUrl.length).toBeLessThan(1_000);
  });

  it('garde un PNG en PNG', async () => {
    const png = await sharp({
      create: { width: 50, height: 50, channels: 4, background: '#00000000' },
    })
      .png()
      .toBuffer();
    const result = await normalizeImage(png);
    expect(result.original).toMatchObject({ mime: 'image/png', extension: 'png' });
  });

  it('garde un WebP en WebP', async () => {
    const webp = await sharp({
      create: { width: 40, height: 30, channels: 3, background: '#336699' },
    })
      .webp()
      .toBuffer();
    const result = await normalizeImage(webp);
    expect(result.original).toMatchObject({ mime: 'image/webp', extension: 'webp', width: 40 });
  });

  it('refuse ce qui n’est pas une image prise en charge', async () => {
    await expect(normalizeImage(Buffer.from('pas une image'))).rejects.toThrow();
    const gif = await sharp({
      create: { width: 10, height: 10, channels: 3, background: '#ffffff' },
    })
      .gif()
      .toBuffer();
    await expect(normalizeImage(gif)).rejects.toThrow(/non prise en charge/);
  });
});
