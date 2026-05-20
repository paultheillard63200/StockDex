// GET /api/me — infos du joueur connecté (coins, gems, taille de collection)

import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, username, coins, gems, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    throw new HttpError(404, 'utilisateur introuvable');
  }

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM owned_cards WHERE user_id = ?')
    .get(req.user.id);

  res.json({ ...user, collection_size: count });
});

export default router;
