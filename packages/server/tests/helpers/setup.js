// Bootstrap pour chaque fichier de test.
//
// Idée :
//   1. Le TOP-LEVEL du module règle STOCKDEX_DB_PATH vers un fichier temporaire
//      UNIQUE à ce process. C'est volontairement synchrone et exécuté avant
//      tout autre import statique du fichier de test qui nous importe : on
//      garantit ainsi que db/index.js (singleton ouvert au load) pointera
//      bien sur notre base éphémère.
//   2. setupTestApp() effectue (à la demande) le dynamic import du module DB,
//      applique le schéma et seed un catalogue de cartes de test, puis
//      construit l'app Express via buildApp(). Tout import dynamique →
//      contourne le hoisting ESM, et on est sûrs que l'env est déjà en place.
//
// Convention : chaque fichier de test commence par
//   `import { setupTestApp } from './helpers/setup.js';`
//   `const { app, db } = await setupTestApp();`

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const tmpDir = mkdtempSync(resolve(tmpdir(), 'stockdex-test-'));
process.env.STOCKDEX_DB_PATH = resolve(tmpDir, 'stockdex.db');
process.env.JWT_SECRET ??= 'test-secret-do-not-use-in-prod';
process.env.BCRYPT_ROUNDS ??= '4';

let cached = null;

export async function setupTestApp() {
  if (cached) return cached;

  // IMPORTANT : on importe d'abord la DB, puis on applique le schéma AVANT
  // de charger les routes — plusieurs d'entre elles appellent db.prepare()
  // au niveau module et exigent que les tables existent déjà.
  const { default: db } = await import('../../db/index.js');
  const { applyTestSchema, seedTestCatalog } = await import('./seed.js');
  applyTestSchema(db);
  seedTestCatalog(db);

  const { buildApp } = await import('../../app.js');
  const app = buildApp({ corsOrigins: [] });

  cached = { app, db };
  return cached;
}
