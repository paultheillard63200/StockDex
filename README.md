# StockDex

> Bourse fictive, ouverture de boosters, collection et marketplace — un proto web qui mélange trading card game et marché boursier.

StockDex transforme 40 sociétés cotées (TTE, MC, ASML, …) en cartes à collectionner. Chaque carte porte le **ticker** réel et un **cours** qui fluctue en continu côté serveur. Les joueurs ouvrent des boosters, revendent leurs cartes sur un marketplace interne et constituent leur collection par famille (énergie, luxe, tech, pharma, finance) et par rareté (C, R, UR, L).

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture du dépôt](#architecture-du-dépôt)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage en local](#démarrage-en-local)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts utiles](#scripts-utiles)
- [API](#api)
- [Modèle de données](#modèle-de-données)

---

## Fonctionnalités

- **Place (accueil)** — vue d'ensemble du marché, top mouvements, sparklines temps réel.
- **Boosters** — ouverture animée d'un pack, tirage pondéré par rareté.
- **Collection** — l'inventaire du joueur, filtrable par famille et rareté.
- **Marketplace** — un joueur publie une instance de carte à un prix en CR, n'importe quel autre joueur peut l'acheter (pas d'échange, vente directe).
- **Wallet** — solde en **CR** (coins) et **gems**, historique des transactions.
- **Auth** — inscription / connexion par mot de passe (`bcrypt`) + session **JWT** stateless.
- **Ticker marché** — un job `node-cron` met à jour les cours toutes les 30 s (volatilité ±4 % par défaut) et **pousse** les nouveaux prix aux clients via **Socket.IO**.

---

## Stack technique

| Couche | Choix |
| --- | --- |
| Frontend | React 18 + Babel Standalone (JSX transpilé dans le navigateur, **zéro build step**), CSS vanilla avec custom properties, SVG inline pour les sparklines, polices self-hostées (woff2) |
| Backend | Node.js ≥ 20, Express 5, Socket.IO 4, `node-cron`, `jsonwebtoken`, `bcrypt` |
| Base de données | SQLite via `better-sqlite3` (fichier `packages/server/data/stockdex.db`) |
| Outillage | npm workspaces (monorepo), `npx serve` pour servir le front statique |

Détails de design : voir `stack_technique.txt` à la racine.

---

## Architecture du dépôt

```
StockDex/
├── package.json            # monorepo root (npm workspaces)
├── index.html              # point d'entrée du frontend (SPA)
├── stack_technique.txt     # notes de design (choix techniques détaillés)
├── StockDex V2.html        # ancienne version monofichier (legacy, non utilisée)
├── scripts/                # code React (chargé via <script type="text/babel">)
│   ├── app.jsx             # composant racine
│   ├── api.js              # client HTTP + socket.io
│   ├── data.js             # données statiques (catalogue, libellés)
│   ├── components/         # card.jsx, chrome.jsx
│   ├── screens/            # auth, home, boosters, collection, marketplace, wallet
│   └── overlays/           # booster-open, card-detail, sell
├── styles/                 # CSS découpé par zone fonctionnelle
├── assets/fonts/           # Fraunces, Fredoka, JetBrains Mono, Nunito (woff2)
├── vendor/                 # react.development.js, react-dom, babel.standalone
└── packages/
    └── server/             # @stockdex/server
        ├── index.js        # bootstrap Express + Socket.IO + ticker
        ├── routes/         # auth, me, cards, collection, boosters, market, wallet
        ├── middleware/     # auth (JWT), error
        ├── lib/            # market (fluctuation), booster (tirage), auth (helpers)
        ├── sockets/        # broadcast des updates de cours
        ├── db/             # schema.sql, seed.js, index.js (connexion)
        └── data/           # stockdex.db (versionnée, le .db-wal/-shm sont ignorés)
```

---

## Prérequis

- **Node.js ≥ 20** (le projet utilise les flags `--watch` et `--env-file`)
- **npm ≥ 10** (pour les workspaces)
- Sur Windows, `better-sqlite3` compile une dépendance native au premier `npm install` ; les outils de build C/C++ sont gérés automatiquement par les binaires prébuildés dans la plupart des cas.

---

## Installation

```bash
git clone https://github.com/paultheillard63200/StockDex
cd StockDex
npm install
```

Ensuite, on prépare le backend :

```bash
# 1. Copier l'exemple d'env
cp packages/server/.env.example packages/server/.env
#   (sous PowerShell : Copy-Item packages\server\.env.example packages\server\.env)

# 2. Seed de la base SQLite (crée packages/server/data/stockdex.db et insère les 40 sociétés)
npm run db:seed --workspace @stockdex/server
```

Pour repartir d'une base vierge à tout moment :

```bash
npm run db:reset --workspace @stockdex/server
```

---

## Démarrage en local

L'application tourne en **deux process** : le front statique et l'API.

### 1. Backend — API + WebSocket (port 3001)

```bash
npm run dev
# équivalent à : npm run dev --workspace @stockdex/server
```

Sortie attendue :

```
[stockdex] API + WS écoutent sur http://localhost:3001
[stockdex] CORS origins: http://localhost:3000, ...
```

> Si le port 3001 est occupé sous Windows, le serveur affiche la commande PowerShell pour libérer le port.

### 2. Frontend — SPA statique (port 3000)

Depuis la racine du dépôt, dans un **second terminal** :

```bash
npx serve .
```

L'application est alors disponible sur **http://localhost:3000/**.

> Aucune étape de build n'est nécessaire : `index.html` charge React + Babel Standalone depuis `vendor/`, puis les fichiers `.jsx` sont transpilés à la volée dans le navigateur.

Le `.env.example` autorise déjà `http://localhost:3000` dans `CORS_ORIGIN` : si tu changes de port (ex. `npx serve . -l 8080`), pense à l'ajouter à la liste dans `packages/server/.env`.

---

## Variables d'environnement

Fichier `packages/server/.env` :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `3001` | Port d'écoute de l'API + Socket.IO |
| `JWT_SECRET` | `change-me-in-production` | Clé de signature des JWT (**à changer**) |
| `JWT_EXPIRES_IN` | `7d` | Durée de vie d'un token |
| `CORS_ORIGIN` | — | Origines autorisées, séparées par des virgules |
| `MARKET_TICK_CRON` | `*/30 * * * * *` | Fréquence du ticker (pattern cron, secondes incluses) |
| `MARKET_TICK_VOLATILITY` | `0.04` | Amplitude maximale d'un tick (±4 %) |

---

## Scripts utiles

À la racine :

| Commande | Action |
| --- | --- |
| `npm run dev` | Démarre l'API en mode watch (recharge sur édition) |
| `npm run start` | Démarre l'API en mode production |
| `npm run server` | Alias de `npm run dev` |

Côté `packages/server` :

| Commande | Action |
| --- | --- |
| `npm run dev --workspace @stockdex/server` | API en watch mode |
| `npm run start --workspace @stockdex/server` | API en mode prod |
| `npm run db:seed --workspace @stockdex/server` | Applique `schema.sql` et insère les 40 sociétés |
| `npm run db:reset --workspace @stockdex/server` | Supprime puis recrée la base depuis zéro |

---

## API

Toutes les routes sont préfixées par `/api`. Le healthcheck reste sur `/health`.

| Méthode | Endpoint | Description |
| --- | --- | --- |
| `GET`  | `/health` | Statut du serveur + heure SQLite |
| `POST` | `/api/auth/register` | Inscription (`username`, `password`) |
| `POST` | `/api/auth/login` | Connexion → renvoie un JWT |
| `GET`  | `/api/me` | Profil du joueur courant (auth) |
| `GET`  | `/api/me/collection` | Cartes possédées par le joueur (auth) |
| `GET`  | `/api/cards` | Catalogue complet des 40 sociétés |
| `POST` | `/api/boosters/open` | Ouvre un booster, débite des coins, crédite des cartes (auth) |
| `GET`  | `/api/market` | Listings ouverts du marketplace |
| `POST` | `/api/market` | Met en vente une instance de carte (auth) |
| `POST` | `/api/market/:id/buy` | Achète un listing (auth) |
| `DELETE` | `/api/market/:id` | Annule son propre listing (auth) |
| `GET`  | `/api/wallet` | Solde CR + gems (auth) |

**WebSocket** : `socket.io` est exposé sur le même port (3001). Les clients reçoivent les mises à jour de cours au fil des ticks (rooms par famille).

---

## Modèle de données

Schéma SQLite (`packages/server/db/schema.sql`) :

- `users` — `id`, `username`, `password_hash`, `coins`, `gems`, `created_at`
- `cards` — catalogue des 40 sociétés (`ticker` unique, `family`, `rarity`, `base_price`, `current_price`, `mcap`)
- `owned_cards` — instances possédées par les joueurs (`user_id`, `card_id`, `acquired_price`)
- `market_listings` — annonces de vente (`seller_id`, `card_instance_id`, `price_cr`, `status` ∈ {`open`, `sold`, `cancelled`}) ; un index partiel unique garantit qu'une même instance ne peut être listée qu'**une seule fois** en statut `open`
- `price_history` — historique des cours pour les sparklines

Le `ticker` est la **clé fonctionnelle** côté frontend ; l'`id` numérique reste la clé primaire interne.
