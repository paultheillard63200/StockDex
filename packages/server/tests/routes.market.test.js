import { setupTestApp } from './helpers/setup.js';
const { app, db } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { registerUser, giveCardInstance, giveCoins, authHeader } from './helpers/factory.js';

async function createOpenListing({ ticker = 'TTE', price = 500 } = {}) {
  const seller = await registerUser(app);
  const { instanceId } = giveCardInstance(db, seller.id, ticker);
  const res = await request(app)
    .post('/api/market')
    .set(authHeader(seller.token))
    .send({ card_instance_id: instanceId, price_cr: price });
  assert.equal(res.status, 201);
  return { seller, instanceId, listingId: res.body.id, price };
}

describe('GET /api/market', () => {
  test('liste publique sans auth', async () => {
    const res = await request(app).get('/api/market');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.listings));
  });

  test('inclut un listing nouvellement créé', async () => {
    const { listingId, price } = await createOpenListing({ ticker: 'KER', price: 1234 });
    const res = await request(app).get('/api/market');
    const found = res.body.listings.find((l) => l.id === listingId);
    assert.ok(found, 'listing absent du flux public');
    assert.equal(found.price_cr, price);
    assert.equal(found.card.ticker, 'KER');
  });
});

describe('POST /api/market — création de listing', () => {
  test('refuse sans token', async () => {
    const res = await request(app).post('/api/market').send({ card_instance_id: 1, price_cr: 100 });
    assert.equal(res.status, 401);
  });

  test('refuse si la carte ne nous appartient pas (403)', async () => {
    const owner = await registerUser(app);
    const intruder = await registerUser(app);
    const { instanceId } = giveCardInstance(db, owner.id, 'BP');

    const res = await request(app)
      .post('/api/market')
      .set(authHeader(intruder.token))
      .send({ card_instance_id: instanceId, price_cr: 500 });
    assert.equal(res.status, 403);
  });

  test('refuse une carte inexistante (404)', async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .post('/api/market')
      .set(authHeader(user.token))
      .send({ card_instance_id: 9999999, price_cr: 500 });
    assert.equal(res.status, 404);
  });

  test('refuse un prix hors bornes', async () => {
    const user = await registerUser(app);
    const { instanceId } = giveCardInstance(db, user.id, 'CAP');
    const res = await request(app)
      .post('/api/market')
      .set(authHeader(user.token))
      .send({ card_instance_id: instanceId, price_cr: 9999999 });
    assert.equal(res.status, 400);
  });

  test('refuse une seconde mise en vente de la même instance (409)', async () => {
    const { seller, instanceId } = await createOpenListing({ ticker: 'SAP' });
    const res = await request(app)
      .post('/api/market')
      .set(authHeader(seller.token))
      .send({ card_instance_id: instanceId, price_cr: 800 });
    assert.equal(res.status, 409);
  });
});

describe('DELETE /api/market/:id — annulation', () => {
  test('le vendeur peut annuler son listing', async () => {
    const { seller, listingId } = await createOpenListing({ ticker: 'SAN' });

    const res = await request(app)
      .delete(`/api/market/${listingId}`)
      .set(authHeader(seller.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'cancelled');

    const row = db.prepare('SELECT status FROM market_listings WHERE id = ?').get(listingId);
    assert.equal(row.status, 'cancelled');
  });

  test('un tiers ne peut pas annuler (403)', async () => {
    const { listingId } = await createOpenListing({ ticker: 'GLE' });
    const intruder = await registerUser(app);

    const res = await request(app)
      .delete(`/api/market/${listingId}`)
      .set(authHeader(intruder.token));
    assert.equal(res.status, 403);
  });

  test('on ne peut pas annuler deux fois (409)', async () => {
    const { seller, listingId } = await createOpenListing({ ticker: 'BNP' });

    const first = await request(app)
      .delete(`/api/market/${listingId}`)
      .set(authHeader(seller.token));
    assert.equal(first.status, 200);

    const second = await request(app)
      .delete(`/api/market/${listingId}`)
      .set(authHeader(seller.token));
    assert.equal(second.status, 409);
  });
});

describe('POST /api/market/:id/buy — achat', () => {
  test('un acheteur paie, devient propriétaire et le vendeur est crédité', async () => {
    const { seller, listingId, price, instanceId } = await createOpenListing({
      ticker: 'UBS',
      price: 800,
    });
    const buyer = await registerUser(app);

    const sellerCoinsBefore = db.prepare('SELECT coins FROM users WHERE id = ?').get(seller.id).coins;
    const buyerCoinsBefore = db.prepare('SELECT coins FROM users WHERE id = ?').get(buyer.id).coins;

    const res = await request(app)
      .post(`/api/market/${listingId}/buy`)
      .set(authHeader(buyer.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.user.coins, buyerCoinsBefore - price);

    const sellerAfter = db.prepare('SELECT coins FROM users WHERE id = ?').get(seller.id);
    assert.equal(sellerAfter.coins, sellerCoinsBefore + price);

    const owned = db.prepare('SELECT user_id FROM owned_cards WHERE id = ?').get(instanceId);
    assert.equal(owned.user_id, buyer.id);

    const listing = db.prepare('SELECT status FROM market_listings WHERE id = ?').get(listingId);
    assert.equal(listing.status, 'sold');
  });

  test('le vendeur ne peut pas acheter sa propre carte (400)', async () => {
    const { seller, listingId } = await createOpenListing({ ticker: 'ROG', price: 600 });

    const res = await request(app)
      .post(`/api/market/${listingId}/buy`)
      .set(authHeader(seller.token));
    assert.equal(res.status, 400);
  });

  test('refus si solde insuffisant (402)', async () => {
    const { listingId } = await createOpenListing({ ticker: 'BAYN', price: 999000 });
    const buyer = await registerUser(app);
    // STARTER_COINS = 2500 < 999000 → 402
    const res = await request(app)
      .post(`/api/market/${listingId}/buy`)
      .set(authHeader(buyer.token));
    assert.equal(res.status, 402);
  });

  test('on ne peut pas racheter un listing déjà vendu (409)', async () => {
    const { listingId, price } = await createOpenListing({ ticker: 'EDF', price: 400 });
    const buyer1 = await registerUser(app);
    giveCoins(db, buyer1.id, price);

    const ok = await request(app)
      .post(`/api/market/${listingId}/buy`)
      .set(authHeader(buyer1.token));
    assert.equal(ok.status, 200);

    const buyer2 = await registerUser(app);
    giveCoins(db, buyer2.id, price);
    const ko = await request(app)
      .post(`/api/market/${listingId}/buy`)
      .set(authHeader(buyer2.token));
    assert.equal(ko.status, 409);
  });
});
