// Initialise / met à jour le catalogue de cartes en base.
//
// Comportement :
//   - npm run db:seed             → idempotent. Crée les tables si elles n'existent
//                                    pas, ajoute les cartes manquantes (par ticker).
//                                    N'EFFACE JAMAIS les users / collections / listings.
//   - npm run db:reset            → DESTRUCTIF. Drop tout et recommence à zéro.
//                                    À n'utiliser qu'en dev quand on veut une base propre.
//
// Les sociétés sont dupliquées ici (volontairement) parce que data.js est
// un script frontend qui assigne à `window.StockDex` — impossible à
// require() proprement côté Node. Si la liste évolue, mettre les deux
// fichiers à jour en parallèle.

import db from './index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COMPANIES = [
  // ENERGIE
  { ticker: 'TTE',  name: 'TotalEnergies',     family: 'energie', mcap: 148, basePts: 2400, rarity: 'UR' },
  { ticker: 'SHEL', name: 'Shell',             family: 'energie', mcap: 215, basePts: 2800, rarity: 'UR' },
  { ticker: 'BP',   name: 'BP',                family: 'energie', mcap:  88, basePts: 1600, rarity: 'R'  },
  { ticker: 'ENI',  name: 'Eni',               family: 'energie', mcap:  48, basePts:  900, rarity: 'R'  },
  { ticker: 'ENGI', name: 'Engie',             family: 'energie', mcap:  37, basePts:  720, rarity: 'C'  },
  { ticker: 'EDF',  name: 'Électricité de Fr.',family: 'energie', mcap:  52, basePts:  960, rarity: 'R'  },
  { ticker: 'EQNR', name: 'Equinor',           family: 'energie', mcap:  82, basePts: 1500, rarity: 'R'  },
  { ticker: 'REP',  name: 'Repsol',            family: 'energie', mcap:  18, basePts:  420, rarity: 'C'  },

  // LUXE
  { ticker: 'MC',   name: 'LVMH',              family: 'luxe',    mcap: 372, basePts: 4800, rarity: 'L'  },
  { ticker: 'RMS',  name: 'Hermès',            family: 'luxe',    mcap: 235, basePts: 3900, rarity: 'L'  },
  { ticker: 'KER',  name: 'Kering',            family: 'luxe',    mcap:  44, basePts: 1100, rarity: 'R'  },
  { ticker: 'CFR',  name: 'Richemont',         family: 'luxe',    mcap:  82, basePts: 1700, rarity: 'UR' },
  { ticker: 'MONC', name: 'Moncler',           family: 'luxe',    mcap:  16, basePts:  520, rarity: 'C'  },
  { ticker: 'BRBY', name: 'Burberry',          family: 'luxe',    mcap:   9, basePts:  340, rarity: 'C'  },
  { ticker: 'OR',   name: 'L\u2019Oréal',      family: 'luxe',    mcap: 218, basePts: 3200, rarity: 'UR' },
  { ticker: 'EL',   name: 'EssilorLuxottica',  family: 'luxe',    mcap:  98, basePts: 1900, rarity: 'R'  },

  // TECH
  { ticker: 'ASML', name: 'ASML Holding',      family: 'tech',    mcap: 310, basePts: 4400, rarity: 'L'  },
  { ticker: 'SAP',  name: 'SAP',               family: 'tech',    mcap: 232, basePts: 3500, rarity: 'UR' },
  { ticker: 'DSY',  name: 'Dassault Systèmes', family: 'tech',    mcap:  46, basePts: 1200, rarity: 'R'  },
  { ticker: 'CAP',  name: 'Capgemini',         family: 'tech',    mcap:  29, basePts:  680, rarity: 'C'  },
  { ticker: 'STM',  name: 'STMicroelectronics',family: 'tech',    mcap:  22, basePts:  560, rarity: 'C'  },
  { ticker: 'NXI',  name: 'Nexi',              family: 'tech',    mcap:   7, basePts:  280, rarity: 'C'  },
  { ticker: 'ATCO', name: 'Atlas Copco',       family: 'tech',    mcap:  68, basePts: 1400, rarity: 'R'  },
  { ticker: 'WCH',  name: 'Wacker Chemie',     family: 'tech',    mcap:  12, basePts:  380, rarity: 'C'  },

  // PHARMA
  { ticker: 'NOVN', name: 'Novartis',          family: 'pharma',  mcap: 230, basePts: 3300, rarity: 'UR' },
  { ticker: 'ROG',  name: 'Roche Holding',     family: 'pharma',  mcap: 245, basePts: 3500, rarity: 'L'  },
  { ticker: 'AZN',  name: 'AstraZeneca',       family: 'pharma',  mcap: 198, basePts: 2900, rarity: 'UR' },
  { ticker: 'SAN',  name: 'Sanofi',            family: 'pharma',  mcap: 122, basePts: 2100, rarity: 'R'  },
  { ticker: 'GSK',  name: 'GSK',               family: 'pharma',  mcap:  72, basePts: 1400, rarity: 'R'  },
  { ticker: 'BAYN', name: 'Bayer',             family: 'pharma',  mcap:  28, basePts:  640, rarity: 'C'  },
  { ticker: 'NOVO', name: 'Novo Nordisk',      family: 'pharma',  mcap: 415, basePts: 5200, rarity: 'L'  },
  { ticker: 'MRK',  name: 'Merck KGaA',        family: 'pharma',  mcap:  68, basePts: 1300, rarity: 'R'  },

  // FINANCE
  { ticker: 'BNP',  name: 'BNP Paribas',       family: 'finance', mcap:  78, basePts: 1500, rarity: 'R'  },
  { ticker: 'CS',   name: 'AXA',               family: 'finance', mcap:  74, basePts: 1450, rarity: 'R'  },
  { ticker: 'GLE',  name: 'Société Générale',  family: 'finance', mcap:  20, basePts:  480, rarity: 'C'  },
  { ticker: 'ACA',  name: 'Crédit Agricole',   family: 'finance', mcap:  42, basePts:  920, rarity: 'C'  },
  { ticker: 'DBK',  name: 'Deutsche Bank',     family: 'finance', mcap:  31, basePts:  720, rarity: 'C'  },
  { ticker: 'UBS',  name: 'UBS Group',         family: 'finance', mcap: 106, basePts: 1900, rarity: 'UR' },
  { ticker: 'HSBA', name: 'HSBC Holdings',     family: 'finance', mcap: 160, basePts: 2600, rarity: 'UR' },
  { ticker: 'INGA', name: 'ING Groep',         family: 'finance', mcap:  48, basePts: 1050, rarity: 'R'  },
];

const RESET_MODE = process.argv.includes('--reset') || process.env.RESET === '1';

function applySchema() {
  const sql = readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
}

// Mode destructif : wipe complet (users, owned_cards, listings, etc.)
function dropTables() {
  db.exec(`
    DROP TABLE IF EXISTS market_offer_items;
    DROP TABLE IF EXISTS market_offers;
    DROP TABLE IF EXISTS market_listings;
    DROP TABLE IF EXISTS trade_items;
    DROP TABLE IF EXISTS trade_listings;
    DROP TABLE IF EXISTS price_history;
    DROP TABLE IF EXISTS owned_cards;
    DROP TABLE IF EXISTS cards;
    DROP TABLE IF EXISTS users;
  `);
  try { db.exec('DELETE FROM sqlite_sequence'); } catch (_) {}
}

// Insère les cartes manquantes (par ticker). Ne touche pas aux cartes
// existantes, ne touche pas aux users/collections.
function upsertCards() {
  const existing = new Set(db.prepare('SELECT ticker FROM cards').all().map((r) => r.ticker));
  const toInsert = COMPANIES.filter((c) => !existing.has(c.ticker));

  if (toInsert.length === 0) {
    console.log(`[seed] catalogue déjà à jour (${existing.size}/${COMPANIES.length} cartes).`);
    return 0;
  }

  const insert = db.prepare(`
    INSERT INTO cards (ticker, name, family, rarity, base_price, current_price, mcap)
    VALUES (@ticker, @name, @family, @rarity, @basePts, @basePts, @mcap)
  `);
  const insertHistory = db.prepare('INSERT INTO price_history (card_id, price) VALUES (?, ?)');

  const txn = db.transaction((rows) => {
    for (const c of rows) {
      const { lastInsertRowid } = insert.run(c);
      insertHistory.run(lastInsertRowid, c.basePts);
    }
  });
  txn(toInsert);
  return toInsert.length;
}

function main() {
  if (RESET_MODE) {
    console.log('[seed] MODE RESET — wipe complet…');
    dropTables();
    applySchema();
    upsertCards();
  } else {
    console.log('[seed] mode idempotent — préserve users et collections.');
    applySchema(); // CREATE TABLE IF NOT EXISTS, sans risque
    const added = upsertCards();
    if (added > 0) console.log(`[seed] ${added} cartes ajoutées.`);
  }

  const { c } = db.prepare('SELECT COUNT(*) AS c FROM cards').get();
  const { u } = db.prepare('SELECT COUNT(*) AS u FROM users').get();
  console.log(`[seed] OK — ${c} cartes, ${u} user(s) en base.`);
  db.close();
}

main();
