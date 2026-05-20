// Fluctuation des cours en tâche planifiée.
//
// À chaque tick (cron), on choisit ~30% des cartes au hasard, on applique un
// delta de prix borné par MARKET_TICK_VOLATILITY, on persiste, on logue dans
// price_history, et on broadcast le changement via Socket.IO.

import cron from 'node-cron';
import db from '../db/index.js';

const PRICE_FLOOR = 1;
const TICK_RATIO = 0.3; // fraction de cartes touchées à chaque tick

const selectAllCards = () =>
  db.prepare('SELECT id, family, base_price, current_price FROM cards').all();

const updateCard = db.prepare('UPDATE cards SET current_price = ? WHERE id = ?');
const insertHistory = db.prepare(
  'INSERT INTO price_history (card_id, price) VALUES (?, ?)'
);

// On encapsule l'écriture batch dans une transaction : un seul fsync,
// throughput drastiquement meilleur.
const applyTick = db.transaction((updates) => {
  for (const { id, newPrice } of updates) {
    updateCard.run(newPrice, id);
    insertHistory.run(id, newPrice);
  }
});

function rollNewPrice(card, volatility) {
  const drift = (Math.random() - 0.5) * 2 * volatility; // [-vol, +vol]
  const raw = Math.round(card.current_price * (1 + drift));
  // Plancher absolu + on évite de s'éloigner indéfiniment du base_price.
  const min = Math.max(PRICE_FLOOR, Math.round(card.base_price * 0.4));
  const max = Math.round(card.base_price * 2.5);
  return Math.min(max, Math.max(min, raw));
}

export function startMarketTicker(io) {
  const pattern = process.env.MARKET_TICK_CRON || '*/30 * * * * *';
  const volatility = Number(process.env.MARKET_TICK_VOLATILITY) || 0.04;

  if (!cron.validate(pattern)) {
    throw new Error(`MARKET_TICK_CRON invalide: "${pattern}"`);
  }

  const task = cron.schedule(pattern, () => {
    const cards = selectAllCards();
    const touched = cards.filter(() => Math.random() < TICK_RATIO);
    if (touched.length === 0) return;

    const updates = touched.map((c) => ({
      id: c.id,
      family: c.family,
      newPrice: rollNewPrice(c, volatility),
      oldPrice: c.current_price,
    }));

    applyTick(updates);

    for (const u of updates) {
      const payload = {
        card_id: u.id,
        family: u.family,
        price: u.newPrice,
        previous: u.oldPrice,
        at: new Date().toISOString(),
      };
      io.to('prices').emit('price_update', payload);
      io.to(`family:${u.family}`).emit('price_update', payload);
    }
  });

  console.log(
    `[market] ticker actif (cron "${pattern}", volatilité ±${(volatility * 100).toFixed(1)}%)`
  );
  return task;
}
