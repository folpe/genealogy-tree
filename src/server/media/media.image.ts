import sharp from 'sharp';
import { MEDIA_WIDTHS, type MediaWidth } from './media.url';

// Normalisation d'une photo avant stockage (spec section 15.1, plan lot 6) : la
// rotation EXIF est appliquée aux pixels, puis toutes les métadonnées (EXIF, GPS,
// XMP) disparaissent, car `sharp` ne les recopie que sur demande. L'original garde
// son format ; les dérivées servies à l'écran sont en WebP.

const FORMATS = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
} as const;
type Format = keyof typeof FORMATS;

const isFormat = (format: string | undefined): format is Format =>
  format !== undefined && format in FORMATS;

const BLUR_WIDTH = 16;

export type NormalizedImage = {
  original: {
    bytes: Buffer;
    mime: (typeof FORMATS)[Format]['mime'];
    extension: (typeof FORMATS)[Format]['extension'];
    width: number;
    height: number;
  };
  /** Une dérivée par largeur cible ; `actualWidth` est plus petit si l'original l'est. */
  variants: { width: MediaWidth; actualWidth: number; bytes: Buffer }[];
  blurDataUrl: string;
};

export async function normalizeImage(input: Buffer): Promise<NormalizedImage> {
  const { format } = await sharp(input).metadata();
  if (!isFormat(format)) throw new Error(`Image non prise en charge : ${format ?? 'inconnue'}`);

  const upright = sharp(input).rotate();
  const encoded =
    format === 'jpeg'
      ? upright.jpeg({ quality: 90, mozjpeg: true })
      : format === 'png'
        ? upright.png()
        : upright.webp({ quality: 90 });
  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

  const variants = await Promise.all(
    MEDIA_WIDTHS.map(async (width) => {
      const variant = await sharp(data)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      return { width, actualWidth: variant.info.width, bytes: variant.data };
    }),
  );
  const blur = await sharp(data).resize({ width: BLUR_WIDTH }).webp({ quality: 40 }).toBuffer();

  return {
    original: { bytes: data, ...FORMATS[format], width: info.width, height: info.height },
    variants,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
  };
}
