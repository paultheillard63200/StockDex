// Configuration Socket.IO.
// Convention de rooms :
//   - "prices"          → tous les updates de cours
//   - "family:{Tech…}"  → updates filtrés par famille de cartes
//
// Le client peut s'abonner sélectivement via socket.emit('subscribe', { family })

import { Server } from 'socket.io';

export function attachSockets(httpServer, corsOrigins) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.join('prices');

    socket.on('subscribe', ({ family } = {}) => {
      if (typeof family === 'string') socket.join(`family:${family}`);
    });

    socket.on('unsubscribe', ({ family } = {}) => {
      if (typeof family === 'string') socket.leave(`family:${family}`);
    });
  });

  return io;
}
