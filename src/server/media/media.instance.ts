// tdd-cover: e2e src/server/media/media.service.integration.test.ts
import 'server-only';
import { serverEnv } from '../../env';
import { getDb } from '../db/client';
import { vercelBlobStore } from './media.blob';
import type { MediaDeps } from './media.service';
import { mediaUrlKey } from './media.url';

export function getMediaDeps(): MediaDeps {
  return { db: getDb(), blob: vercelBlobStore() };
}

export function getMediaKey(): Buffer {
  return mediaUrlKey(serverEnv().BETTER_AUTH_SECRET);
}
