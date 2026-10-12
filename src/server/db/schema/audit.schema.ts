// tdd-cover: e2e src/server/family/family.service.integration.test.ts
import { date, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { persons } from './family.schema';

/**
 * Consultations par un admin de fiches qu'il ne verrait pas sans ce rôle (spec
 * section 6.4). Une ligne par admin, fiche et jour : le journal dit qui a regardé
 * quoi et quand, sans grossir à chaque affichage de l'arbre.
 */
export const adminRecordViews = pgTable(
  'admin_record_views',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    personId: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    viewedOn: date('viewed_on').notNull(),
    firstViewedAt: timestamp('first_viewed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('admin_record_views_once_a_day').on(t.userId, t.personId, t.viewedOn)],
);
