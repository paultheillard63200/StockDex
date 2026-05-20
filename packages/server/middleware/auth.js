// Middleware Express : vérifie le JWT et attache req.user = { id, username }.

import { verifyToken } from '../lib/auth.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
