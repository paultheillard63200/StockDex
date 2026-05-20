// Connexion SQLite singleton.
// better-sqlite3 est synchrone : pas de callback, pas de promise.
// Le fichier est ouvert une fois au démarrage et partagé par tous les modules.

import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const DB_PATH = resolve(DATA_DIR, 'stockdex.db');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL → meilleur débit en lecture concurrente, transactions non bloquantes.
db.pragma('journal_mode = WAL');
// SQLite n'applique pas les FK par défaut, il faut l'activer par connexion.
db.pragma('foreign_keys = ON');
// Au cas où plusieurs writers concurrents : on attend jusqu'à 5s avant erreur.
db.pragma('busy_timeout = 5000');

export default db;
export { DB_PATH };
