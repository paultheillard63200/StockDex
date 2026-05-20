# @stockdex/server

Back-end Express + Socket.IO + SQLite (better-sqlite3).

## Lancer en local

```bash
# Depuis la racine du monorepo
npm run dev
# ou explicitement
npm run dev --workspace @stockdex/server
```

Le serveur écoute sur `http://localhost:3001` (configurable via `.env`).

## Structure

```
packages/server/
  index.js               Entrée — Express + Socket.IO + ticker marché
  .env                   Variables d'env (non versionné)
  .env.example           Modèle
  data/
    stockdex.db          Base SQLite (déjà seedée : 49 cartes, 2 users)
  db/
    index.js             Connexion better-sqlite3 (WAL, FK on)
    schema.sql           Schéma de référence
  lib/
    auth.js              JWT (jsonwebtoken) + bcrypt
    market.js            Ticker de fluctuation (node-cron + transaction)
  middleware/
    auth.js              requireAuth — vérifie le Bearer JWT
    error.js             notFound + errorHandler + HttpError
  routes/
    auth.js              POST /api/auth/register, /api/auth/login
    me.js                GET  /api/me
    cards.js             GET  /api/cards, /:id, /:id/history
  sockets/
    index.js             Socket.IO — rooms "prices" et "family:{X}"
```

## Endpoints actuels

| Méthode | URL                              | Auth | Description                     |
| ------- | -------------------------------- | ---- | ------------------------------- |
| GET     | `/health`                        | non  | Healthcheck (lit la DB)         |
| POST    | `/api/auth/register`             | non  | Crée un compte (1000 coins, 5 gems) |
| POST    | `/api/auth/login`                | non  | Retourne `{ token, user }`       |
| GET     | `/api/me`                        | oui  | Profil du joueur connecté       |
| GET     | `/api/cards`                     | non  | Catalogue (filtre `family`, `rarity`) |
| GET     | `/api/cards/:id`                 | non  | Détail d'une carte              |
| GET     | `/api/cards/:id/history`         | non  | Historique de prix (`?limit=30`) |

## Socket.IO

- `connection` → join automatique de la room `prices`
- `subscribe { family }` → join `family:{family}`
- `unsubscribe { family }` → leave
- Émis par le serveur : `price_update { card_id, family, price, previous, at }`

## À implémenter ensuite

- `routes/boosters.js` — `POST /api/boosters/open` (déduit coins, roll 5 cartes, insère dans `owned_cards`)
- `routes/collection.js` — `GET /api/me/collection`
- `routes/trades.js` — CRUD `trade_listings` + `trade_items`
- (optionnel) Validation Zod ou Joi sur les bodies
