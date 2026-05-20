// Card detail overlay — large card + stats + 30-day chart.
(() => {
  const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useCb } = React;

  function CardDetail({ card, owned, onClose, onSell }) {
    const own = owned[card.ticker] || 0;
    const canSell = own > 0 && typeof onSell === 'function';
    return (
      <div className="detail-overlay" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
        <button className="overlay-close" onClick={onClose}>✕</button>
        <div className="detail-panel">
          <div className="detail-left">
            <StockCard card={card} size="xl" />
          </div>
          <div className="detail-right">
            <div className="overline" style={{color:card.sectorMeta.tint}}>{card.sectorMeta.label} · Édition Première</div>
            <h2 className="display sm" style={{marginTop:4}}>{card.name}</h2>
            <div className="detail-ticker">
              <span className="detail-sym">{card.ticker}</span>
              <span className="detail-rarity">
                <span style={{color:card.rarityMeta.color}}>{[...Array(card.rarityMeta.stars)].map((_,i)=><span key={i}>✦</span>)}</span>
                {card.rarityMeta.label}
              </span>
            </div>

            <div className="detail-stats">
              <div className="ds">
                <div className="ds-lbl">Valeur</div>
                <div className="ds-val">{card.value.toLocaleString('fr-FR')}<span className="ds-unit"> pts</span></div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Variation J</div>
                <div className={`ds-val ${card.variation>=0?'up':'down'}`}>{card.variation>=0?'▲':'▼'} {Math.abs(card.variation).toFixed(2)}%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Variation 7J</div>
                <div className={`ds-val ${card.variation7d>=0?'up':'down'}`}>{card.variation7d>=0?'▲':'▼'} {Math.abs(card.variation7d).toFixed(2)}%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Cap. boursière</div>
                <div className="ds-val">{card.mcap.toFixed(1)} Mrd €</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Plus haut 7J</div>
                <div className="ds-val">{card.high.toLocaleString('fr-FR')}</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Plus bas 7J</div>
                <div className="ds-val">{card.low.toLocaleString('fr-FR')}</div>
              </div>
            </div>

            <div className="detail-chart">
              <div className="detail-chart-head">
                <div className="overline">Historique 30 jours</div>
                <div className="chart-legend">
                  <span className="leg-dot" style={{background:card.sectorMeta.tint}}/>
                  <span>{card.ticker} · pts</span>
                </div>
              </div>
              <Sparkline data={card.history} width={460} height={140} color={card.sectorMeta.tint} />
            </div>

            <div className="detail-foot">
              <div className="detail-owned">
                <div className="overline">Possédées</div>
                <div className="detail-owned-num">{own}<span className="ds-unit"> exemplaires</span></div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-gold sm"
                  disabled={!canSell}
                  onClick={() => { if (canSell) { onSell(card); onClose(); } }}
                >Mettre en vente</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { CardDetail });

})();
