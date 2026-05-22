// Petites fabriques pour les tests d'intégration : créer un utilisateur,
// récupérer un token, donner une carte directement (sans passer par un booster).

import request from 'supertest';

let userSeq = 0;

export function uniqueUsername(prefix = 'user') {
  userSeq += 1;
  return `${prefix}_${process.pid}_${userSeq}`;
}

// Crée un user via l'API et renvoie { id, username, token, coins, gems }.
export async function registerUser(app, overrides = {}) {
  const username = overrides.username || uniqueUsername();
  const password = overrides.password || 'secret123';

  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, password });

  if (res.status !== 201) {
    throw new Error(`registerUser a échoué (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { ...res.body.user, password, token: res.body.token };
}

// Crédite un user d'un montant de CR (utile pour ne pas passer par /wallet/claim).
export function giveCoins(db, userId, amount) {
  db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(amount, userId);
}

// Insère directement une instance possédée pour `userId` et renvoie l'instance_id.
export function giveCardInstance(db, userId, ticker, acquiredPrice = 1000) {
  const card = db.prepare('SELECT id, current_price FROM cards WHERE ticker = ?').get(ticker);
  if (!card) throw new Error(`Carte ${ticker} absente du seed de test`);
  const info = db.prepare(
    'INSERT INTO owned_cards (user_id, card_id, acquired_price) VALUES (?, ?, ?)'
  ).run(userId, card.id, acquiredPrice);
  return { instanceId: info.lastInsertRowid, cardId: card.id, currentPrice: card.current_price };
}

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
