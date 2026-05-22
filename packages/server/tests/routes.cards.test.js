import { setupTestApp } from './helpers/setup.js';
const { app, db } = await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

describe('GET /api/cards', () => {
  test('renvoie le catalogue complet', async () => {
    const res = await request(app).get('/api/cards');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 16); // taille du seed de test

    const sample = res.body[0];
    for (const k of ['id', 'name', 'family', 'rarity', 'base_price', 'current_price']) {
      assert.ok(k in sample, `clé ${k} manquante`);
    }
  });

  test('filtre par famille', async () => {
    const res = await request(app).get('/api/cards?family=tech');
    assert.equal(res.status, 200);
    assert.ok(res.body.every((c) => c.family === 'tech'));
    assert.ok(res.body.length >= 3);
  });

  test('filtre par rareté', async () => {
    const res = await request(app).get('/api/cards?rarity=L');
    assert.equal(res.status, 200);
    assert.ok(res.body.every((c) => c.rarity === 'L'));
  });

  test('filtre combiné famille + rareté', async () => {
    const res = await request(app).get('/api/cards?family=luxe&rarity=L');
    assert.equal(res.status, 200);
    assert.ok(res.body.every((c) => c.family === 'luxe' && c.rarity === 'L'));
  });
});

describe('GET /api/cards/:id', () => {
  test('renvoie le détail d\'une carte existante', async () => {
    const { id } = db.prepare('SELECT id FROM cards WHERE ticker = ?').get('TTE');
    const res = await request(app).get(`/api/cards/${id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, id);
    assert.equal(res.body.name, 'TotalEnergies');
  });

  test('404 sur id inexistant', async () => {
    const res = await request(app).get('/api/cards/999999');
    assert.equal(res.status, 404);
  });

  test('400 sur id non numérique', async () => {
    const res = await request(app).get('/api/cards/abc');
    assert.equal(res.status, 400);
  });
});

describe('GET /api/cards/:id/history', () => {
  test('renvoie un historique de prix (au moins 1 point après seed)', async () => {
    const { id } = db.prepare('SELECT id FROM cards WHERE ticker = ?').get('MC');
    const res = await request(app).get(`/api/cards/${id}/history`);
    assert.equal(res.status, 200);
    assert.equal(res.body.card_id, id);
    assert.ok(Array.isArray(res.body.points));
    assert.ok(res.body.points.length >= 1);
  });

  test('respecte le paramètre limit (bornes 1..500)', async () => {
    const { id } = db.prepare('SELECT id FROM cards WHERE ticker = ?').get('MC');
    const res = await request(app).get(`/api/cards/${id}/history?limit=1`);
    assert.equal(res.status, 200);
    assert.ok(res.body.points.length <= 1);
  });
});
