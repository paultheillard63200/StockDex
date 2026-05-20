// POST /api/auth/register — crée un compte
// POST /api/auth/login    — vérifie le mot de passe et retourne un JWT

import { Router } from 'express';
import db from '../db/index.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

// Capital de départ d'un nouveau joueur — assez pour ouvrir 2 boosters
// (1200 CR pièce) et découvrir le jeu sans se sentir bloqué.
const STARTER_COINS = 2500;
const STARTER_GEMS = 5;

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

router.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!USERNAME_RE.test(username || '')) {
    throw new HttpError(400, 'username invalide (3-24 caractères, alphanumérique)');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'password doit faire au moins 6 caractères');
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    throw new HttpError(409, 'username déjà pris');
  }

  const passwordHash = await hashPassword(password);
  const info = db
    .prepare(
      'INSERT INTO users (username, password_hash, coins, gems) VALUES (?, ?, ?, ?)'
    )
    .run(username, passwordHash, STARTER_COINS, STARTER_GEMS);

  const userId = info.lastInsertRowid;
  const token = signToken({ sub: userId, username });

  res.status(201).json({
    token,
    user: {
      id: userId,
      username,
      coins: STARTER_COINS,
      gems: STARTER_GEMS,
    },
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'username et password requis');
  }

  const row = db
    .prepare(
      'SELECT id, username, password_hash, coins, gems FROM users WHERE username = ?'
    )
    .get(username);

  if (!row) {
    throw new HttpError(401, 'identifiants invalides');
  }

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) {
    throw new HttpError(401, 'identifiants invalides');
  }

  const token = signToken({ sub: row.id, username: row.username });
  res.json({
    token,
    user: {
      id: row.id,
      username: row.username,
      coins: row.coins,
      gems: row.gems,
    },
  });
});

export default router;
