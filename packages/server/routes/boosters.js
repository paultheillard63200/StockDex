// POST /api/boosters/open — ouvre un booster pour l'utilisateur connecté.
//
// Body: { family: 'energie' | 'luxe' | 'tech' | 'pharma' | 'finance' | 'mix' }
//
// Tout est en transaction : on ne déduit les coins que si l'insert des
// 5 cartes a réussi, et on relit le user à la fin pour renvoyer le solde
// frais sans imposer un second round-trip /api/me au client.

import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { BOOSTER_COST, VALID_FAMILIES, rollBoosterSlots } from '../lib/booster.js';

const router = Router();

const selectUser    = db.prepare('SELECT id, username, coins, gems FROM users WHERE id = ?');
const deductCoins   = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?');
const selectCard    = db.prepare('SELECT id, ticker, name, family, rarity, base_price, current_price, mcap FROM cards WHERE id = ?');
const insertOwned   = db.prepare(
  'INSERT INTO owned_cards (user_id, card_id, acquired_price) VALUES (?, ?, ?)'
);

router.post('/open', requireAuth, (req, res) => {
  const { family } = req.body ?? {};
  if (typeof family !== 'string' || (family !== 'mix' && !VALID_FAMILIES.has(family))) {
    throw new HttpError(400, 'Paramètre `family` invalide');
  }

  const user = selectUser.get(req.user.id);
  if (!user) throw new HttpError(404, 'utilisateur introuvable');
  if (user.coins < BOOSTER_COST) {
    throw new HttpError(402, `Crédits insuffisants (il en faut ${BOOSTER_COST}, vous en avez ${user.coins})`);
  }

  // Le tirage doit aussi être dans la transaction : si l'insert plante, on
  // ne veut pas avoir déjà décrémenté les coins.
  const txn = db.transaction(() => {
    const result = deductCoins.run(BOOSTER_COST, user.id, BOOSTER_COST);
    if (result.changes !== 1) {
      // Course conditionnelle improbable mais explicite (autre tab qui dépense en parallèle).
      throw new HttpError(409, 'Solde modifié, réessayez');
    }

    const slots = rollBoosterSlots(family);
    const cards = [];
    for (const slot of slots) {
      const card = selectCard.get(slot.id);
      insertOwned.run(user.id, card.id, card.current_price);
      cards.push(card);
    }
    return cards;
  });

  const cards = txn();
  const fresh = selectUser.get(user.id);

  res.json({
    cost: BOOSTER_COST,
    family,
    cards,
    user: { id: fresh.id, username: fresh.username, coins: fresh.coins, gems: fresh.gems },
  });
});

export default router;
