// Entrée du back-end StockDex.
// Démarre Express + Socket.IO sur un même httpServer, puis lance le ticker marché.

import http from 'node:http';

import db from './db/index.js';
import { buildApp } from './app.js';
import { attachSockets } from './sockets/index.js';
import { startMarketTicker } from './lib/market.js';

const PORT = Number(process.env.PORT) || 3001;

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// En prod mono-service (Fly.io, Docker), STATIC_DIR pointe vers la racine
// du repo où vivent index.html, scripts/, styles/, vendor/, assets/.
// En dev, on ne le définit pas → le front est servi par `npx serve` sur :3000.
const staticDir = process.env.STATIC_DIR || null;

const app = buildApp({ corsOrigins, staticDir });

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
