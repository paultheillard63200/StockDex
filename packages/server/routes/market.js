// Marketplace : listings publics, achat direct en CR.
//
// Convention : une "listing" = un joueur publie UNE instance précise
// (owned_cards.id) à un prix en CR. N'importe quel autre joueur peut
// l'acheter (transactionnel : débit + crédit + transfert d'ownership).
//
// Pas de système d'échange — supprimé volontairement pour garder la
// surface de jeu simple.

import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

const MIN_PRICE = 0;
const MAX_PRICE = 1_000_000;

const sql = {
  selectListingById: db.prepare(`
    SELECT id, seller_id, card_instance_id, price_cr, status, created_at, resolved_at
      FROM market_listings WHERE id = ?`),
  selectOpenListings: db.prepare(`
    SELECT l.id            AS listing_id,
           l.price_cr,
           l.created_at,
           u.id            AS seller_id,
           u.username      AS seller_username,
           oc.id           AS card_instance_id,
           c.id            AS card_id,
           c.ticker, c.name, c.family, c.rarity,
           c.base_price, c.current_price, c.mcap
      FROM market_listings l
      JOIN users u         ON u.id  = l.seller_id
      JOIN owned_cards oc  ON oc.id = l.card_instance_id
      JOIN cards c         ON c.id  = oc.card_id
     WHERE l.status = 'open'
     ORDER BY l.created_at DESC`),
  insertListing: db.prepare(`
    INSERT INTO market_listings (seller_id, card_instance_id, price_cr) VALUES (?, ?, ?)`),
  cancelListing: db.prepare(`
    UPDATE market_listings SET status = 'cancelled', resolved_at = datetime('now')
     WHERE id = ? AND seller_id = ? AND status = 'open'`),
  markListingSold: db.prepare(`
    UPDATE market_listings SET status = 'sold', resolved_at = datetime('now')
     WHERE id = ? AND status = 'open'`),

  selectOwnedInstance: db.prepare(`SELECT id, user_id, card_id, acquired_price FROM owned_cards WHERE id = ?`),
  transferOwnership:   db.prepare(`UPDATE owned_cards SET user_id = ? WHERE id = ?`),

  selectUserCoins: db.prepare(`SELECT id, username, coins, gems FROM users WHERE id = ?`),
  debitCoins:      db.prepare(`UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?`),
  creditCoins:     db.prepare(`UPDATE users SET coins = coins + ? WHERE id = ?`),
};

function serializeListing(row) {
  return {
    id: row.listing_id,
    price_cr: row.price_cr,
    created_at: row.created_at,
    seller: { id: row.seller_id, username: row.seller_username },
    card_instance_id: row.card_instance_id,
    card: {
      id: row.card_id,
      ticker: row.ticker, name: row.name,
      family: row.family, rarity: row.rarity,
      base_price: row.base_price, current_price: row.current_price, mcap: row.mcap,
    },
  };
}

// GET /api/market — toutes les listings ouvertes
router.get('/', (_req, res) => {
  res.json({ listings: sql.selectOpenListings.all().map(serializeListing) });
});

// POST /api/market — créer une listing
router.post('/', requireAuth, (req, res) => {
  const cardInstanceId = Number(req.body?.card_instance_id);
  const priceCr        = Number(req.body?.price_cr);

  if (!Number.isInteger(cardInstanceId)) throw new HttpError(400, 'card_instance_id requis');
  if (!Number.isFinite(priceCr) || priceCr < MIN_PRICE || priceCr > MAX_PRICE) {
    throw new HttpError(400, `price_cr doit être entre ${MIN_PRICE} et ${MAX_PRICE}`);
  }

  const inst = sql.selectOwnedInstance.get(cardInstanceId);
  if (!inst)                        throw new HttpError(404, 'Carte introuvable');
  if (inst.user_id !== req.user.id) throw new HttpError(403, 'Cette carte ne vous appartient pas');

  let info;
  try {
    info = sql.insertListing.run(req.user.id, cardInstanceId, Math.round(priceCr));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new HttpError(409, 'Cette carte est déjà en vente');
    }
    throw err;
  }

  const listing = sql.selectListingById.get(info.lastInsertRowid);
  res.status(201).json({
    id:               listing.id,
    seller_id:        listing.seller_id,
    card_instance_id: listing.card_instance_id,
    price_cr:         listing.price_cr,
    status:           listing.status,
    created_at:       listing.created_at,
  });
});

// DELETE /api/market/:id — annuler sa propre listing
router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'id invalide');

  const listing = sql.selectListingById.get(id);
  if (!listing)                          throw new HttpError(404, 'Listing introuvable');
  if (listing.seller_id !== req.user.id) throw new HttpError(403, 'Vous n\'êtes pas le vendeur');
  if (listing.status !== 'open')         throw new HttpError(409, 'Cette listing n\'est plus active');

  sql.cancelListing.run(id, req.user.id);
  res.json({ id, status: 'cancelled' });
});

// POST /api/market/:id/buy — achat direct en CR
router.post('/:id/buy', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'id invalide');

  const listing = sql.selectListingById.get(id);
  if (!listing)                          throw new HttpError(404, 'Listing introuvable');
  if (listing.status !== 'open')         throw new HttpError(409, 'Cette listing n\'est plus active');
  if (listing.seller_id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas acheter votre propre carte');

  const buyer = sql.selectUserCoins.get(req.user.id);
  if (buyer.coins < listing.price_cr) {
    throw new HttpError(402, `Crédits insuffisants (il en faut ${listing.price_cr}, vous en avez ${buyer.coins})`);
  }

  const txn = db.transaction(() => {
    // Re-marquer la listing comme sold en première étape — si quelqu'un
    // d'autre l'a achetée entre-temps, 0 changes et on remonte une 409.
    const sold = sql.markListingSold.run(id);
    if (sold.changes !== 1) {
      throw new HttpError(409, 'Cette listing vient d\'être achetée par un autre joueur');
    }

    const debit = sql.debitCoins.run(listing.price_cr, buyer.id, listing.price_cr);
    if (debit.changes !== 1) throw new HttpError(402, 'Crédits insuffisants');
    sql.creditCoins.run(listing.price_cr, listing.seller_id);
    sql.transferOwnership.run(buyer.id, listing.card_instance_id);
  });
  txn();

  const fresh = sql.selectUserCoins.get(buyer.id);
  res.json({
    listing_id: id,
    price_cr: listing.price_cr,
    user: { id: fresh.id, username: fresh.username, coins: fresh.coins, gems: fresh.gems },
  });
});

export default router;
