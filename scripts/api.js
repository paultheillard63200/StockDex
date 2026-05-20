// StockDex — client HTTP minimal vers le back-end.
// Pas de bundler : on expose tout sous window.StockDex.api.
//
// Stratégie : le JWT vit dans localStorage et est ajouté en Bearer à chaque
// requête. Sur un 401 on purge le token et on émet un événement DOM
// `stockdex:logout` que <App> écoute pour basculer sur l'écran de connexion.

(() => {
  const API_BASE = window.STOCKDEX_API_BASE || 'http://localhost:3001';
  const TOKEN_KEY = 'stockdex_token';
  const USER_KEY  = 'stockdex_user';

  // --- token / user persistés ---------------------------------------------

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
  }
  function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch (_) {}
  }
  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_) {}
  }

  function getCachedUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function setCachedUser(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (_) {}
  }

  // --- requête générique ---------------------------------------------------

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Un 401 = token absent/expiré/invalide. On purge et on prévient l'app.
    if (res.status === 401) {
      clearToken();
      window.dispatchEvent(new CustomEvent('stockdex:logout', { detail: { reason: 'unauthorized' } }));
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    }

    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // --- endpoints auth ------------------------------------------------------

  async function register({ username, password }) {
    const data = await request('POST', '/api/auth/register', { username, password });
    setToken(data.token);
    setCachedUser(data.user);
    return data.user;
  }

  async function login({ username, password }) {
    const data = await request('POST', '/api/auth/login', { username, password });
    setToken(data.token);
    setCachedUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    window.dispatchEvent(new CustomEvent('stockdex:logout', { detail: { reason: 'manual' } }));
  }

  async function me() {
    const user = await request('GET', '/api/me');
    setCachedUser(user);
    return user;
  }

  // --- endpoints lecture catalogue (utile pour brancher l'app plus tard) ---

  function listCards(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request('GET', '/api/cards' + (qs ? '?' + qs : ''));
  }

  function cardHistory(cardId, limit = 30) {
    return request('GET', `/api/cards/${cardId}/history?limit=${limit}`);
  }

  // --- collection + boosters ----------------------------------------------

  function getCollection() {
    return request('GET', '/api/me/collection');
  }

  // Ouvre un booster pour la famille donnée (ou 'mix').
  // Renvoie { cost, family, cards, user } — `user.coins` reflète le solde
  // après débit, à utiliser pour mettre à jour le state local.
  function openBooster(family) {
    return request('POST', '/api/boosters/open', { family });
  }

  // --- marketplace ---------------------------------------------------------

  function listMarket() {
    return request('GET', '/api/market');
  }

  function createListing(cardInstanceId, priceCr) {
    return request('POST', '/api/market', {
      card_instance_id: cardInstanceId,
      price_cr: priceCr,
    });
  }

  function cancelListing(listingId) {
    return request('DELETE', `/api/market/${listingId}`);
  }

  // Achat direct : { listing_id, price_cr, user } — `user.coins` reflète le débit
  function buyListing(listingId) {
    return request('POST', `/api/market/${listingId}/buy`);
  }

  // --- wallet (boutique de CR gratuits) -----------------------------------

  function getWalletPacks() {
    return request('GET', '/api/wallet/packs');
  }

  // Renvoie { pack, granted, user } — `user.coins` reflète le crédit
  function claimWalletPack(packId) {
    return request('POST', '/api/wallet/claim', { pack: packId });
  }

  window.StockDex = window.StockDex || {};
  window.StockDex.api = {
    base: API_BASE,
    getToken, setToken, clearToken,
    getCachedUser, setCachedUser,
    request,
    register, login, logout, me,
    listCards, cardHistory,
    getCollection, openBooster,
    listMarket, createListing, cancelListing, buyListing,
    getWalletPacks, claimWalletPack,
  };
})();
