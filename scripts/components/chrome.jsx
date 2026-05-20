// Shared chrome — top navbar and the live market ticker strip.
(() => {
  const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useCb } = React;

  function NavBar({ route, setRoute, coins, gems, user, onLogout }) {
    const items = [
      { id: 'home', label: 'Place' },
      { id: 'boosters', label: 'Boosters' },
      { id: 'collection', label: 'Collection' },
      { id: 'market', label: 'Marketplace' },
      { id: 'wallet', label: 'Boutique' },
    ];
    return (
      <div className="navbar">
        <div className="navbar-brand">
          <div className="brand-mark">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 23 L13 14 L18 19 L25 8"/>
                <circle cx="25" cy="8" r="2" fill="#fff"/>
              </g>
            </svg>
          </div>
          <div>
            <div className="brand-name">Stock<span className="brand-px">Dex</span></div>
            <div className="brand-sub">Trading Card · Bourse</div>
          </div>
        </div>
        <div className="nav-items">
          {items.map(it => (
            <button key={it.id}
              className={`nav-item ${route === it.id ? 'active' : ''}`}
              onClick={() => setRoute(it.id)}>{it.label}</button>
          ))}
        </div>
        <div className="wallet">
          <div className="wallet-pill">
            <span className="wallet-glyph">✦</span>
            <span className="wallet-amt">{gems.toLocaleString('fr-FR')}</span>
            <span className="wallet-cur">GEM</span>
          </div>
          <div className="wallet-pill gold">
            <span className="wallet-glyph">◉</span>
            <span className="wallet-amt">{coins.toLocaleString('fr-FR')}</span>
            <span className="wallet-cur">CR</span>
          </div>
          {user && (
            <div className="user-pill" title={`Connecté en tant que ${user.username}`}>
              <span className="user-pill-avatar">{(user.username || '?').slice(0, 1).toUpperCase()}</span>
              <span>{user.username}</span>
              <button
                type="button"
                className="user-pill-logout"
                onClick={onLogout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >⏻</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function MarketTicker({ dataset, speed = 1 }) {
    const items = useM(() => dataset.slice().sort(() => Math.random() - 0.5).slice(0, 28), [dataset]);
    const duration = 80 / speed;
    return (
      <div className="ticker-strip">
        <div className="ticker-track" style={{ animationDuration: `${duration}s` }}>
          {[...items, ...items].map((c, i) => {
            const up = c.variation >= 0;
            return (
              <div key={i} className="ticker-item">
                <span className="ticker-sym">{c.ticker}</span>
                <span className="ticker-px">{c.value.toLocaleString('fr-FR')}</span>
                <span className={`ticker-var ${up?'up':'down'}`}>{up?'▲':'▼'} {Math.abs(c.variation).toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  Object.assign(window, { NavBar, MarketTicker });

})();
