// Constantes partagées par la configuration Playwright et les parcours.

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_DATABASE_URL =
  process.env['E2E_DATABASE_URL'] ?? 'postgres://postgres:test@localhost:54329/racines_e2e';
export const E2E_SERVER_LOG = '.e2e/server.log';
/** Admin d'amorçage : entre sans invitation et devient propriétaire. */
export const E2E_ADMIN_EMAIL = 'admin@famille.test';
/** Invitée reliée à la fiche d'Isabelle (famille fictive Marchand). */
export const E2E_ISABELLE_EMAIL = 'isabelle@famille.test';
