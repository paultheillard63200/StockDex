// Tests unitaires de lib/auth.js — hash / verify / sign / verify token.

import { setupTestApp } from './helpers/setup.js';
await setupTestApp(); // garantit que JWT_SECRET est en place avant l'import.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from '../lib/auth.js';

describe('lib/auth — bcrypt', () => {
  test('hashPassword produit un hash différent du clair', async () => {
    const hash = await hashPassword('hello');
    assert.notEqual(hash, 'hello');
    assert.match(hash, /^\$2[aby]\$/); // signature bcrypt
  });

  test('verifyPassword reconnaît le bon mot de passe', async () => {
    const hash = await hashPassword('correct horse battery staple');
    assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  });

  test('verifyPassword refuse un mauvais mot de passe', async () => {
    const hash = await hashPassword('mdp-original');
    assert.equal(await verifyPassword('mdp-different', hash), false);
  });
});

describe('lib/auth — JWT', () => {
  test('signToken + verifyToken round-trip', () => {
    const token = signToken({ sub: 42, username: 'alice' });
    const payload = verifyToken(token);
    assert.equal(payload.sub, 42);
    assert.equal(payload.username, 'alice');
    assert.equal(typeof payload.exp, 'number');
  });

  test('verifyToken jette sur token forgé', () => {
    assert.throws(() => verifyToken('not.a.real.token'));
  });

  test('verifyToken jette sur signature invalide', () => {
    const token = signToken({ sub: 1 });
    const tampered = token.slice(0, -3) + 'xxx';
    assert.throws(() => verifyToken(tampered));
  });
});
