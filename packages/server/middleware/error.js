// Handler d'erreur final. Express 5 propage automatiquement les rejections
// async vers ici — pas besoin de wrapper.

export function notFound(req, res) {
  res.status(404).json({ error: 'Route inconnue', path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = { error: err.message || 'Erreur interne' };

  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, err);
  }

  res.status(status).json(payload);
}

// Petite classe utilitaire pour throw une 4xx propre depuis n'importe quelle route.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
