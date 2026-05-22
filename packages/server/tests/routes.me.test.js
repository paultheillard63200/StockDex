import { setupTestApp } from './helpers/setup.js';
const { app, db } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { registerUser, giveCardInstance, authHeader } from './helpers/factory.js';

describe('GET /api/me', () => {
  test('refuse sans token (401)', async () => {
    const res = await request(app).get('/api/me');
    assert.equal(res.status, 401);
  });

  test('refuse avec un token invalide (401)', async () => {
    const res = await request(app).get('/api/me').set(authHeader('not-a-jwt'));
    assert.equal(res.status, 401);
  });

  test('renvoie les infos du user connecté et la taille de la collection', async () => {
    const user = await registerUser(app);
    giveCardInstance(db, user.id, 'TTE');
    giveCardInstance(db, user.id, 'MC');

    const res = await request(app).get('/api/me').set(authHeader(user.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.id, user.id);
    assert.equal(res.body.username, user.username);
    assert.equal(res.body.coins, 2500);
    assert.equal(res.body.gems, 5);
    assert.equal(res.body.collection_size, 2);
  });
});
