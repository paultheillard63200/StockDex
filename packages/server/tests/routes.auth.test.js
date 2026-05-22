import { setupTestApp } from './helpers/setup.js';
const { app } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { uniqueUsername } from './helpers/factory.js';

describe('POST /api/auth/register', () => {
  test('crée un compte avec capital de départ et renvoie un JWT', async () => {
    const username = uniqueUsername('reg');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'motdepasse' });

    assert.equal(res.status, 201);
    assert.ok(typeof res.body.token === 'string' && res.body.token.length > 20);
    assert.equal(res.body.user.username, username);
    assert.equal(res.body.user.coins, 2500); // STARTER_COINS
    assert.equal(res.body.user.gems, 5);
  });

  test('refuse un username trop court (< 3 caractères)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'motdepasse' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /username/i);
  });

  test('refuse un username avec caractères interdits', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob smith!', password: 'motdepasse' });
    assert.equal(res.status, 400);
  });

  test('refuse un password trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: uniqueUsername('shortpw'), password: '12345' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /password/i);
  });

  test('refuse un username déjà pris (409)', async () => {
    const username = uniqueUsername('dup');
    const first = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'motdepasse' });
    assert.equal(first.status, 201);

    const second = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'autre-password' });
    assert.equal(second.status, 409);
  });
});

describe('POST /api/auth/login', () => {
  test('renvoie un token sur identifiants valides', async () => {
    const username = uniqueUsername('login-ok');
    await request(app).post('/api/auth/register').send({ username, password: 'monsupermdp' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'monsupermdp' });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.username, username);
    assert.equal(typeof res.body.token, 'string');
  });

  test('renvoie 401 sur mot de passe incorrect', async () => {
    const username = uniqueUsername('login-bad');
    await request(app).post('/api/auth/register').send({ username, password: 'goodpwd' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'wrongpwd' });
    assert.equal(res.status, 401);
  });

  test('renvoie 401 sur utilisateur inexistant', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'fantome_jamais_cree_42', password: 'whatever' });
    assert.equal(res.status, 401);
  });

  test('renvoie 400 si champs manquants', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    assert.equal(res.status, 400);
  });
});
