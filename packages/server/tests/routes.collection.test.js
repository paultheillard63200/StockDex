import { setupTestApp } from './helpers/setup.js';
const { app, db } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { registerUser, giveCardInstance, authHeader } from './helpers/factory.js';

describe('GET /api/me/collection', () => {
  test('refuse sans token', async () => {
    const res = await request(app).get('/api/me/collection');
    assert.equal(res.status, 401);
  });

  test('renvoie une collection vide pour un nouveau joueur', async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .get('/api/me/collection')
      .set(authHeader(user.token));

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.instances, []);
    assert.deepEqual(res.body.byTicker, {});
  });

  test('regroupe par ticker et compte les doublons', async () => {
    const user = await registerUser(app);
    giveCardInstance(db, user.id, 'TTE');
    giveCardInstance(db, user.id, 'TTE'); // doublon
    giveCardInstance(db, user.id, 'MC');

    const res = await request(app)
      .get('/api/me/collection')
      .set(authHeader(user.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.instances.length, 3);

    assert.equal(res.body.byTicker.TTE.count, 2);
    assert.equal(res.body.byTicker.MC.count, 1);
    assert.equal(res.body.byTicker.TTE.card.name, 'TotalEnergies');
  });

  test('isole les collections entre joueurs', async () => {
    const alice = await registerUser(app);
    const bob = await registerUser(app);
    giveCardInstance(db, alice.id, 'SAP');
    giveCardInstance(db, bob.id, 'ASML');

    const a = await request(app).get('/api/me/collection').set(authHeader(alice.token));
    const b = await request(app).get('/api/me/collection').set(authHeader(bob.token));

    assert.ok('SAP' in a.body.byTicker);
    assert.ok(!('ASML' in a.body.byTicker));
    assert.ok('ASML' in b.body.byTicker);
    assert.ok(!('SAP' in b.body.byTicker));
  });
});
