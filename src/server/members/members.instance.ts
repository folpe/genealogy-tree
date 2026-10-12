// tdd-cover: e2e src/server/members/members.service.integration.test.ts
import 'server-only';
import { resolveAppUrl, serverEnv } from '../../env';
import { getDb } from '../db/client';
import { getEmailSender } from '../notifications/email.instance';
import type { MembersDeps } from './members.service';

export function getMembersDeps(): MembersDeps {
  return {
    db: getDb(),
    now: () => new Date(),
    appUrl: resolveAppUrl(serverEnv()),
    sendEmail: getEmailSender(),
  };
}
