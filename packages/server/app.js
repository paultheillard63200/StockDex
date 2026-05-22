// Construction de l'application Express isolée du bootstrap HTTP.
// `index.js` se contente d'instancier l'app, d'y greffer Socket.IO et
// le ticker marché, puis d'écouter sur un port. Les tests, eux, importent
// directement `buildApp()` et passent l'instance à supertest — pas besoin
// d'ouvrir un socket réseau ni de lancer le cron.

import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import db from './db/index.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import cardsRoutes from './routes/cards.js';
import collectionRoutes from './routes/collection.js';
import boostersRoutes from './routes/boosters.js';
import marketRoutes from './routes/market.js';
import walletRoutes from './routes/wallet.js';

export function buildApp({ corsOrigins = [], staticDir = null } = {}) {
  const app = express();

  app.use(cors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true }));
  app.use(express.json({ limit: '256kb' }));

  // Healthcheck — pratique pour Render et pour vérifier que la DB répond.
  app.get('/health', (_req, res) => {
    const { now } = db.prepare("SELECT datetime('now') AS now").get();
    res.json({ status: 'ok', db_time: now });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/me/collection', collectionRoutes);
  app.use('/api/cards', cardsRoutes);
  app.use('/api/boosters', boostersRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/wallet', walletRoutes);

  // Mode mono-service (Fly.io, Docker, VPS…) : le même process sert
  // l'API ET les fichiers statiques du SPA. Doit être enregistré APRÈS
  // les routes /api/* pour que notFound() s'applique aux endpoints
  // inconnus (et pas à des URLs frontales).
  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(resolve(staticDir), {
      extensions: ['html'],
      setHeaders: (res, path) => {
        if (path.endsWith('.jsx')) res.setHeader('Content-Type', 'text/babel; charset=utf-8');
      },
    }));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
