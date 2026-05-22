// Seed minimal pour la suite de tests.
//
// On lit le schéma de référence (db/schema.sql) pour rester en phase avec
// le vrai schéma, mais on insère seulement un catalogue compact (16 cartes)
// qui couvre les 5 familles et les 4 raretés — suffisant pour tester les
// boosters, le market et la collection sans alourdir les tests.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, '..', '..', 'db', 'schema.sql');

export const TEST_CARDS = [
  // ENERGIE
  { ticker: 'TTE',  name: 'TotalEnergies', family: 'energie', basePts: 2400, rarity: 'UR', mcap: 148 },
  { ticker: 'BP',   name: 'BP',            family: 'energie', basePts: 1600, rarity: 'R',  mcap:  88 },
  { ticker: 'ENGI', name: 'Engie',         family: 'energie', basePts:  720, rarity: 'C',  mcap:  37 },
  { ticker: 'EDF',  name: 'EDF',           family: 'energie', basePts:  960, rarity: 'R',  mcap:  52 },
  // LUXE
  { ticker: 'MC',   name: 'LVMH',          family: 'luxe',    basePts: 4800, rarity: 'L',  mcap: 372 },
  { ticker: 'KER',  name: 'Kering',        family: 'luxe',    basePts: 1100, rarity: 'R',  mcap:  44 },
  { ticker: 'MONC', name: 'Moncler',       family: 'luxe',    basePts:  520, rarity: 'C',  mcap:  16 },
  // TECH
  { ticker: 'ASML', name: 'ASML Holding',  family: 'tech',    basePts: 4400, rarity: 'L',  mcap: 310 },
  { ticker: 'SAP',  name: 'SAP',           family: 'tech',    basePts: 3500, rarity: 'UR', mcap: 232 },
  { ticker: 'CAP',  name: 'Capgemini',     family: 'tech',    basePts:  680, rarity: 'C',  mcap:  29 },
  // PHARMA
  { ticker: 'ROG',  name: 'Roche Holding', family: 'pharma',  basePts: 3500, rarity: 'L',  mcap: 245 },
  { ticker: 'SAN',  name: 'Sanofi',        family: 'pharma',  basePts: 2100, rarity: 'R',  mcap: 122 },
  { ticker: 'BAYN', name: 'Bayer',         family: 'pharma',  basePts:  640, rarity: 'C',  mcap:  28 },
  // FINANCE
  { ticker: 'BNP',  name: 'BNP Paribas',   family: 'finance', basePts: 1500, rarity: 'R',  mcap:  78 },
  { ticker: 'UBS',  name: 'UBS Group',     family: 'finance', basePts: 1900, rarity: 'UR', mcap: 106 },
  { ticker: 'GLE',  name: 'Société Gén.',  family: 'finance', basePts:  480, rarity: 'C',  mcap:  20 },
];

export function applyTestSchema(db) {
  const sql = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(sql);
}

export function seedTestCatalog(db) {
  const insertCard = db.prepare(
    `INSERT OR IGNORE INTO cards (ticker, name, family, rarity, base_price, current_price, mcap)
     VALUES (@ticker, @name, @family, @rarity, @basePts, @basePts, @mcap)`
  );
  const insertHistory = db.prepare(
    'INSERT INTO price_history (card_id, price) VALUES (?, ?)'
  );
  const tx = db.transaction((rows) => {
    for (const c of rows) {
      const info = insertCard.run(c);
      if (info.changes === 1) insertHistory.run(info.lastInsertRowid, c.basePts);
    }
  });
  tx(TEST_CARDS);
}
