// Marketplace screen — listings réels venant du backend.
// Affiche toutes les listings ouvertes, regroupées par vendeur si on veut.
// Actions : Acheter (CR) — ou Proposer (échange, branché au tour suivant).
(() => {
  const { useState: useS, useMemo: useM } = React;

  function MarketScreen({ dataset, listings, currentUserId, onBuy, onCancelListing, onRefresh }) {
    const [secFilter, setSecFilter] = useS('all');
    const [scope, setScope]         = useS('all');  // 'all' | 'mine' | 'others'

    // On enrichit chaque listing avec les métadonnées UI de la carte
    // (sectorMeta, rarityMeta, value, variation%) en matchant par ticker
    // dans le dataset existant.
    const enriched = useM(() => listings.map((l) => {
      const fromDataset = dataset.find((c) => c.ticker === l.card.ticker);
      const merged = fromDataset
        ? { ...fromDataset, current_price: l.card.current_price }
        : { ...l.card, sectorMeta: { label: l.card.family, tint: '#9aa3b2' }, rarityMeta: { label: l.card.rarity, color: '#9aa3b2', stars: 1 }, value: l.card.current_price, variation: 0 };
      return { ...l, mergedCard: merged };
    }), [listings, dataset]);

    const filtered = enriched.filter((l) => {
      if (secFilter !== 'all' && l.mergedCard.sector !== secFilter) return false;
      if (scope === 'mine'   && l.seller.id !== currentUserId)      return false;
      if (scope === 'others' && l.seller.id === currentUserId)      return false;
      return true;
    });

    return (
      <div className="market-screen">
        <div className="page-head row">
          <div>
            <div className="overline">Marketplace · Live</div>
            <h2 className="display sm">Échanges & ventes du parquet</h2>
          </div>
          <div className="market-tabs">
            <button className={scope === 'all'    ? 'on' : ''} onClick={() => setScope('all')}>Tout</button>
            <button className={scope === 'others' ? 'on' : ''} onClick={() => setScope('others')}>Autres joueurs</button>
            <button className={scope === 'mine'   ? 'on' : ''} onClick={() => setScope('mine')}>Mes annonces</button>
          </div>
        </div>

        <div className="filters compact">
          <div className="chips">
            <button className={`chip ${secFilter === 'all' ? 'on' : ''}`} onClick={() => setSecFilter('all')}>Tous secteurs</button>
            {StockDex.SETS.map((s) => (
              <button key={s.id} className={`chip ${secFilter === s.id ? 'on' : ''}`} onClick={() => setSecFilter(s.id)}>
                <span className="chip-dot" style={{ background: s.tint }} />
                {s.label.replace('Set ', '')}
              </button>
            ))}
          </div>
          <button className="link-btn" onClick={onRefresh} title="Recharger">⟳ Actualiser</button>
        </div>

        <div className="listings">
          <div className="listings-header">
            <div>Carte</div>
            <div>Vendeur</div>
            <div>Valeur</div>
            <div>Prix</div>
            <div></div>
          </div>
          {filtered.length === 0 && (
            <div className="trade-empty" style={{ padding: '32px 0', textAlign: 'center' }}>
              Aucune annonce pour ces filtres. Mettez vos cartes en vente depuis l'écran <strong>Collection</strong>.
            </div>
          )}
          {filtered.map((l) => {
            const c       = l.mergedCard;
            const isMine  = l.seller.id === currentUserId;
            const ratio   = c.value ? l.price_cr / c.value : 1;
            const goodDeal = ratio < 0.92;
            return (
              <div key={l.id} className="listing-row">
                <div className="lst-card-cell">
                  <div className="lst-mini"><StockCard card={c} size="sm" tilt={false} /></div>
                  <div>
                    <div className="lst-ticker">
                      {c.ticker}{' '}
                      <span className="lst-rarity" style={{ color: c.rarityMeta.color }}>
                        {[...Array(c.rarityMeta.stars)].map((_, i) => <span key={i}>✦</span>)}
                      </span>
                    </div>
                    <div className="lst-name">{c.name}</div>
                    <div className="lst-sector" style={{ color: c.sectorMeta.tint }}>{c.sectorMeta.label}</div>
                  </div>
                </div>
                <div className="lst-seller">
                  <div className="lst-avatar">{l.seller.username[0].toUpperCase()}</div>
                  <div>
                    <div className="lst-seller-name">{l.seller.username}{isMine && ' (vous)'}</div>
                    <div className="lst-time">{new Date(l.created_at + 'Z').toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </div>
                </div>
                <div className="lst-value">
                  <div className="ds-val">{c.value.toLocaleString('fr-FR')}</div>
                  {typeof c.variation === 'number' && (
                    <div className={`mover-var ${c.variation >= 0 ? 'up' : 'down'}`}>
                      {c.variation >= 0 ? '▲' : '▼'} {Math.abs(c.variation).toFixed(2)}%
                    </div>
                  )}
                </div>
                <div className="lst-price">
                  <div className="ds-val gold">◉ {l.price_cr.toLocaleString('fr-FR')}</div>
                  <div className={`lst-ratio ${goodDeal ? 'good' : 'normal'}`}>
                    {goodDeal && 'bonne affaire · '}{Math.round(ratio * 100)}% val.
                  </div>
                </div>
                <div>
                  {isMine
                    ? <button className="btn btn-ghost sm" onClick={() => onCancelListing(l.id)}>Retirer</button>
                    : <button className="btn btn-gold sm"  onClick={() => onBuy(l)}>Acheter</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  Object.assign(window, { MarketScreen });
})();
