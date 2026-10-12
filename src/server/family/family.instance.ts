// tdd-cover: e2e src/server/family/family.service.integration.test.ts
import 'server-only';
import { getDb } from '../db/client';
import type { FamilyDeps } from './family.service';

export function getFamilyDeps(): FamilyDeps {
  return { db: getDb(), now: () => new Date() };
}
