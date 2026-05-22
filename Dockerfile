# StockDex — image mono-service (API + Socket.IO + front statique)
# Pensée pour Fly.io free tier (256 Mo RAM, volume SQLite monté sur /data).

# -------- Stage 1 : build des dépendances (better-sqlite3 = natif C++) -----
FROM node:20-bookworm-slim AS deps

# Outils nécessaires à la compilation de better-sqlite3 si aucun prébuild
# n'est disponible pour l'archi (ex. linux/arm64 sur Fly.io).
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# On copie d'abord les manifests pour profiter du cache Docker.
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/package.json

RUN npm ci --omit=dev --workspaces

# -------- Stage 2 : runtime léger ----------------------------------------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3001 \
    STATIC_DIR=/app \
    STOCKDEX_DB_PATH=/data/stockdex.db

WORKDIR /app

# Récupère uniquement les node_modules déjà compilés
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Code applicatif (front + back)
COPY package.json package-lock.json ./
COPY index.html ./
COPY assets ./assets
COPY scripts ./scripts
COPY styles ./styles
COPY vendor ./vendor
COPY packages/server ./packages/server

# Le volume Fly est monté sur /data au runtime ; pour les builds locaux
# on s'assure que le dossier existe.
RUN mkdir -p /data

EXPOSE 3001

# Au boot : seed idempotent puis lancement du serveur (le seed ne touche
# pas aux users/collections existants, juste au catalogue de cartes).
CMD ["sh", "-c", "node packages/server/db/seed.js && node packages/server/index.js"]
