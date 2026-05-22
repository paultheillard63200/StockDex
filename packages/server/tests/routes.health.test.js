import { setupTestApp } from './helpers/setup.js';
const { app } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

describe('GET /health', () => {
  test('répond 200 avec un statut OK et un timestamp SQLite', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(typeof res.body.db_time, 'string');
  });
});

describe('Route inconnue', () => {
  test('renvoie 404 JSON', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Route inconnue');
  });
});
