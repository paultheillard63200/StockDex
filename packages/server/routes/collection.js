// GET /api/me/collection — cartes possédées par l'utilisateur connecté.
//
// Retourne deux représentations :
//   - `instances` : une ligne par exemplaire possédé (utile pour le trade)
//   - `byTicker`  : { TICKER: { count, card } } — pratique pour le rendu front
//                   qui raisonne en "nombre d'exemplaires par ticker".

import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT oc.id            AS instance_id,
              oc.acquired_at,
              oc.acquired_price,
              c.id, c.ticker, c.name, c.family, c.rarity,
              c.base_price, c.current_price, c.mcap
         FROM owned_cards oc
         JOIN cards c ON c.id = oc.card_id
        WHERE oc.user_id = ?
        ORDER BY oc.acquired_at DESC`
    )
    .all(req.user.id);

  const byTicker = {};
  for (const r of rows) {
    if (!byTicker[r.ticker]) {
      byTicker[r.ticker] = {
        count: 0,
        card: {
          id: r.id, ticker: r.ticker, name: r.name,
          family: r.family, rarity: r.rarity,
          base_price: r.base_price, current_price: r.current_price, mcap: r.mcap,
        },
      };
    }
    byTicker[r.ticker].count += 1;
  }

  res.json({
    instances: rows.map((r) => ({
      instance_id: r.instance_id,
      ticker: r.ticker,
      acquired_at: r.acquired_at,
      acquired_price: r.acquired_price,
    })),
    byTicker,
  });
});

export default router;
