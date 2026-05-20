// GET /api/cards                    — liste de toutes les cartes (cours actuel)
// GET /api/cards/:id                — détail d'une carte
// GET /api/cards/:id/history?limit  — historique de prix (défaut 30 derniers points)

import { Router } from 'express';
import db from '../db/index.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

router.get('/', (req, res) => {
  const { family, rarity } = req.query;
  const where = [];
  const params = [];

  if (family) {
    where.push('family = ?');
    params.push(family);
  }
  if (rarity) {
    where.push('rarity = ?');
    params.push(rarity);
  }

  const sql = `SELECT id, name, family, rarity, base_price, current_price
               FROM cards
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY family, rarity, name`;

  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'id invalide');

  const card = db
    .prepare(
      'SELECT id, name, family, rarity, base_price, current_price, created_at FROM cards WHERE id = ?'
    )
    .get(id);

  if (!card) throw new HttpError(404, 'carte introuvable');
  res.json(card);
});

router.get('/:id/history', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'id invalide');

  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 500);

  const points = db
    .prepare(
      `SELECT price, recorded_at
       FROM price_history
       WHERE card_id = ?
       ORDER BY recorded_at DESC
       LIMIT ?`
    )
    .all(id, limit)
    .reverse();

  res.json({ card_id: id, points });
});

export default router;
