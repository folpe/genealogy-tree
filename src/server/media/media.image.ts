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

/**
 * Plafond de pixels d'une image reçue : décoder coûte 4 octets par pixel, et un
 * fichier de quelques Mo peut annoncer des dimensions immenses. 50 Mpx couvrent les
 * photos de téléphone (48 Mpx).
 */
const MAX_INPUT_PIXELS = 50_000_000;
/** Côté maximal de l'original rangé : au-delà, rien ne s'affiche mieux. */
const MAX_SIDE = 4096;

/** Image refusée pour ses dimensions, avant tout décodage. */
export class ImageTooLargeError extends Error {
  constructor(width: number, height: number) {
    super(`Image trop grande : ${width} x ${height}`);
    this.name = 'ImageTooLargeError';
  }
}

const decode = (input: Buffer) => sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });

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
  // Les dimensions se lisent dans l'en-tête, sans décoder : on refuse avant.
  const { format, width = 0, height = 0 } = await sharp(input).metadata();
  if (!isFormat(format)) throw new Error(`Image non prise en charge : ${format ?? 'inconnue'}`);
  if (width * height > MAX_INPUT_PIXELS) throw new ImageTooLargeError(width, height);

  const upright = decode(input)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true });
  const encoded =
    format === 'jpeg'
      ? upright.jpeg({ quality: 90, mozjpeg: true })
      : format === 'png'
        ? upright.png()
        : upright.webp({ quality: 90 });
  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

  // Une dérivée après l'autre : une seule image décodée en mémoire à la fois.
  const variants: NormalizedImage['variants'] = [];
  for (const target of MEDIA_WIDTHS) {
    const variant = await decode(data)
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    variants.push({ width: target, actualWidth: variant.info.width, bytes: variant.data });
  }
  const blur = await decode(data).resize({ width: BLUR_WIDTH }).webp({ quality: 40 }).toBuffer();

  return {
    original: { bytes: data, ...FORMATS[format], width: info.width, height: info.height },
    variants,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
  };
}
