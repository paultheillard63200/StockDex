// Boutique de CR — packs gratuits dans le contexte de l'exercice.
//
// Les montants sont fixés côté serveur (source de vérité) ; le client envoie
// uniquement un identifiant de pack. Ça évite qu'un joueur trafique le body
// pour s'accorder 999 999 CR.

import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

const PACKS = [
  { id: 'discovery', label: 'Découverte', coins:    500, blurb: 'Un peu de monnaie pour ouvrir un booster.' },
  { id: 'standard',  label: 'Standard',   coins:  2000, blurb: 'De quoi compléter votre première vague.' },
  { id: 'serious',   label: 'Sérieux',    coins: 10000, blurb: 'Pour ceux qui visent la collection complète.' },
  { id: 'mega',      label: 'Mégalo',     coins: 50000, blurb: 'Tradez sans compter.' },
];

const PACK_BY_ID = Object.fromEntries(PACKS.map((p) => [p.id, p]));

const sql = {
  credit: db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?'),
  fresh:  db.prepare('SELECT id, username, coins, gems FROM users WHERE id = ?'),
};

router.get('/packs', (_req, res) => {
  res.json({ packs: PACKS });
});

router.post('/claim', requireAuth, (req, res) => {
  const pack = PACK_BY_ID[req.body?.pack];
  if (!pack) throw new HttpError(400, 'pack invalide');

  sql.credit.run(pack.coins, req.user.id);
  const user = sql.fresh.get(req.user.id);

  res.json({
    pack: pack.id,
    granted: pack.coins,
    user,
  });
});

export default router;
