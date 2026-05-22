import { setupTestApp } from './helpers/setup.js';
const { app, db } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { registerUser, giveCoins, authHeader } from './helpers/factory.js';
import { BOOSTER_COST } from '../lib/booster.js';

describe('POST /api/boosters/open', () => {
  test('refuse sans token', async () => {
    const res = await request(app).post('/api/boosters/open').send({ family: 'tech' });
    assert.equal(res.status, 401);
  });

  test('refuse une famille invalide', async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .post('/api/boosters/open')
      .set(authHeader(user.token))
      .send({ family: 'pizzas' });
    assert.equal(res.status, 400);
  });

  test('ouvre un booster mix : 5 cartes, débit du coût, collection mise à jour', async () => {
    const user = await registerUser(app);

    const before = user.coins;
    const res = await request(app)
      .post('/api/boosters/open')
      .set(authHeader(user.token))
      .send({ family: 'mix' });

    assert.equal(res.status, 200);
    assert.equal(res.body.cost, BOOSTER_COST);
    assert.equal(res.body.cards.length, 5);
    for (const c of res.body.cards) {
      assert.ok(['C', 'R', 'UR', 'L'].includes(c.rarity));
      assert.equal(typeof c.ticker, 'string');
    }

    assert.equal(res.body.user.coins, before - BOOSTER_COST);

    // Les 5 cartes ont bien été ajoutées à owned_cards.
    const { count } = db
      .prepare('SELECT COUNT(*) AS count FROM owned_cards WHERE user_id = ?')
      .get(user.id);
    assert.equal(count, 5);
  });

  test('ouvre un booster ciblé sur une famille → toutes les cartes sont de cette famille', async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .post('/api/boosters/open')
      .set(authHeader(user.token))
      .send({ family: 'pharma' });

    assert.equal(res.status, 200);
    for (const c of res.body.cards) {
      assert.equal(c.family, 'pharma');
    }
  });

  test('renvoie 402 si solde insuffisant et n\'altère ni le solde ni la collection', async () => {
    const user = await registerUser(app);
    // Vider le solde.
    db.prepare('UPDATE users SET coins = 0 WHERE id = ?').run(user.id);

    const res = await request(app)
      .post('/api/boosters/open')
      .set(authHeader(user.token))
      .send({ family: 'tech' });

    assert.equal(res.status, 402);

    const { coins } = db.prepare('SELECT coins FROM users WHERE id = ?').get(user.id);
    assert.equal(coins, 0);
    const { count } = db
      .prepare('SELECT COUNT(*) AS count FROM owned_cards WHERE user_id = ?')
      .get(user.id);
    assert.equal(count, 0);
  });

  test('plusieurs ouvertures successives accumulent les cartes', async () => {
    const user = await registerUser(app);
    giveCoins(db, user.id, BOOSTER_COST * 3); // de quoi ouvrir 3 boosters de plus

    for (let i = 0; i < 3; i += 1) {
      const res = await request(app)
        .post('/api/boosters/open')
        .set(authHeader(user.token))
        .send({ family: 'mix' });
      assert.equal(res.status, 200);
    }

    const { count } = db
      .prepare('SELECT COUNT(*) AS count FROM owned_cards WHERE user_id = ?')
      .get(user.id);
    assert.equal(count, 15); // 3 boosters × 5 cartes
  });
});
