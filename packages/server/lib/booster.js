// Tirage d'un booster côté serveur.
// Mirror de scripts/data.js#rollBooster mais avec le serveur comme source
// de vérité (le client ne peut pas trafiquer le tirage en altérant son JS).

import db from '../db/index.js';

export const BOOSTER_COST = 1200;
export const BOOSTER_SIZE = 5;
export const VALID_FAMILIES = new Set(['energie', 'luxe', 'tech', 'pharma', 'finance']);

function pickRandom(arr, fallback) {
  if (!arr.length) return fallback[Math.floor(Math.random() * fallback.length)];
  return arr[Math.floor(Math.random() * arr.length)];
}

// Stratégie : 3 communes (filler), 1 rare-ou-mieux, 1 hit (UR/L attendu).
// Identique à la version frontend pour garder la même sensation de pull.
export function rollBoosterSlots(family) {
  if (family !== 'mix' && !VALID_FAMILIES.has(family)) {
    throw new Error(`Famille inconnue: ${family}`);
  }

  const pool = family === 'mix'
    ? db.prepare('SELECT id, rarity FROM cards').all()
    : db.prepare('SELECT id, rarity FROM cards WHERE family = ?').all(family);

  if (pool.length === 0) {
    throw new Error('Aucune carte en base pour ce booster');
  }

  const byRarity = {
    C:  pool.filter((c) => c.rarity === 'C'),
    R:  pool.filter((c) => c.rarity === 'R'),
    UR: pool.filter((c) => c.rarity === 'UR'),
    L:  pool.filter((c) => c.rarity === 'L'),
  };

  return [
    pickRandom(byRarity.C, pool),
    pickRandom(byRarity.C, pool),
    pickRandom(byRarity.C, pool),
    pickRandom(Math.random() < 0.35 ? byRarity.UR : byRarity.R, pool),
    pickRandom(
      Math.random() < 0.18
        ? byRarity.L
        : (Math.random() < 0.5 ? byRarity.UR : byRarity.R),
      pool
    ),
  ];
}
