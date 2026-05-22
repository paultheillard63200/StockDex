import { setupTestApp } from './helpers/setup.js';
const { app, db } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { registerUser, authHeader } from './helpers/factory.js';

describe('GET /api/wallet/packs', () => {
  test('liste publique des packs disponibles', async () => {
    const res = await request(app).get('/api/wallet/packs');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.packs));
    assert.ok(res.body.packs.length >= 1);

    const ids = res.body.packs.map((p) => p.id);
    for (const expected of ['discovery', 'standard', 'serious', 'mega']) {
      assert.ok(ids.includes(expected), `pack ${expected} attendu`);
    }
    for (const p of res.body.packs) {
      assert.equal(typeof p.coins, 'number');
      assert.ok(p.coins > 0);
    }
  });
});

describe('POST /api/wallet/claim', () => {
  test('refuse sans token', async () => {
    const res = await request(app).post('/api/wallet/claim').send({ pack: 'discovery' });
    assert.equal(res.status, 401);
  });

  test('refuse un pack inconnu', async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .post('/api/wallet/claim')
      .set(authHeader(user.token))
      .send({ pack: 'inexistant' });
    assert.equal(res.status, 400);
  });

  test('crédite le solde du joueur', async () => {
    const user = await registerUser(app);
    const before = user.coins;

    const res = await request(app)
      .post('/api/wallet/claim')
      .set(authHeader(user.token))
      .send({ pack: 'standard' });

    assert.equal(res.status, 200);
    assert.equal(res.body.granted, 2000);
    assert.equal(res.body.user.coins, before + 2000);

    const { coins } = db.prepare('SELECT coins FROM users WHERE id = ?').get(user.id);
    assert.equal(coins, before + 2000);
  });
});
