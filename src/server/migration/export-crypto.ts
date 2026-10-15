import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { APP_NAME } from '@/lib/brand';

// Chiffrement au repos de l'export Notion et des photos (spec section 15.1) :
// AES-256-GCM, authentifié, un vecteur aléatoire par fichier. La clé vit dans
// le trousseau de la machine, jamais à côté des fichiers.

const MAGIC = Buffer.from('ANCES1');
const IV_BYTES = 12;
const TAG_BYTES = 16;

function keyOf(hex: string): Buffer {
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32)
    throw new Error('La clé de l’export doit faire 256 bits (64 caractères hexa)');
  return key;
}

export function encryptExport(clear: Buffer, keyHex: string): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', keyOf(keyHex), iv);
  const body = Buffer.concat([cipher.update(clear), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body]);
}

export function decryptExport(sealed: Buffer, keyHex: string): Buffer {
  if (!sealed.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error(`Ce fichier n’est pas un export chiffré de ${APP_NAME}`);
  }
  const ivStart = MAGIC.length;
  const tagStart = ivStart + IV_BYTES;
  const bodyStart = tagStart + TAG_BYTES;
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyOf(keyHex),
    sealed.subarray(ivStart, tagStart),
  );
  decipher.setAuthTag(sealed.subarray(tagStart, bodyStart));
  return Buffer.concat([decipher.update(sealed.subarray(bodyStart)), decipher.final()]);
}
