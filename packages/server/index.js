// Entrée du back-end StockDex.
// Démarre Express + Socket.IO sur un même httpServer, puis lance le ticker marché.

import http from 'node:http';
import express from 'express';
import cors from 'cors';

import db from './db/index.js';
import { attachSockets } from './sockets/index.js';
import { startMarketTicker } from './lib/market.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import cardsRoutes from './routes/cards.js';
import collectionRoutes from './routes/collection.js';
import boostersRoutes from './routes/boosters.js';
import marketRoutes from './routes/market.js';
import walletRoutes from './routes/wallet.js';

const PORT = Number(process.env.PORT) || 3001;

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

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

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = attachSockets(httpServer, corsOrigins.length ? corsOrigins : '*');

startMarketTicker(io);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[stockdex] Le port ${PORT} est déjà utilisé.`);
    console.error('[stockdex] Sur Windows, libère-le avec :');
    console.error(`[stockdex]   Get-NetTCPConnection -LocalPort ${PORT} | %{ Stop-Process -Id $_.OwningProcess -Force }\n`);
    process.exit(1);
  }
  throw err;
});

httpServer.listen(PORT, () => {
  console.log(`[stockdex] API + WS écoutent sur http://localhost:${PORT}`);
  console.log(`[stockdex] CORS origins: ${corsOrigins.join(', ') || '*'}`);
});

const shutdown = (signal) => {
  console.log(`\n[stockdex] ${signal} reçu, fermeture…`);
  httpServer.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
