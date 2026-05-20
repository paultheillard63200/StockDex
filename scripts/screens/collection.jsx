// Collection screen — owned cards grid with filters & sort.
(() => {
  const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useCb } = React;

  function CollectionScreen({ dataset, owned, recentlyOpened = {}, setRoute, openBoosterFlow, onSell }) {
    const [filterSet, setFilterSet] = useS('all');
    const [filterRarity, setFilterRarity] = useS('all');
    const [sort, setSort] = useS('value-desc');
    const [view, setView] = useS('owned'); // owned | all (shows silhouettes)
    const [detailCard, setDetailCard] = useS(null);

    let cards = dataset.slice();
    if (filterSet !== 'all') cards = cards.filter(c => c.sector === filterSet);
    if (filterRarity !== 'all') cards = cards.filter(c => c.rarity === filterRarity);
    if (view === 'owned') cards = cards.filter(c => owned[c.ticker]);
    if (sort === 'value-desc') cards.sort((a,b)=>b.value-a.value);
    if (sort === 'value-asc') cards.sort((a,b)=>a.value-b.value);
    if (sort === 'rarity') cards.sort((a,b)=> (b.rarityMeta.stars - a.rarityMeta.stars) || (b.value - a.value));
    if (sort === 'variation') cards.sort((a,b)=>b.variation-a.variation);

    const ownedCount = Object.keys(owned).length;
    const totalValue = Object.keys(owned).reduce((acc, t) => {
      const c = dataset.find(c=>c.ticker===t); return acc + (c ? c.value : 0) * owned[t];
    }, 0);

    return (
      <div className="collection-screen">
        <div className="page-head row">
          <div>
            <div className="overline">Ma Collection</div>
            <h2 className="display sm">Mon portefeuille de cartes</h2>
          </div>
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-num">{ownedCount}<span className="kpi-tot">/{StockDex.COMPANIES.length}</span></div>
              <div className="kpi-lbl">Cartes uniques</div>
            </div>
            <div className="kpi">
              <div className="kpi-num">{totalValue.toLocaleString('fr-FR')}</div>
              <div className="kpi-lbl">Valeur totale (pts)</div>
            </div>
            <div className="kpi">
              <div className="kpi-num">{Math.round(ownedCount/StockDex.COMPANIES.length*100)}<span className="kpi-tot">%</span></div>
              <div className="kpi-lbl">Complétion globale</div>
            </div>
          </div>
        </div>

        <div className="filters">
          <div className="filter-grp">
            <div className="filter-lbl">Set</div>
            <div className="chips">
              <button className={`chip ${filterSet==='all'?'on':''}`} onClick={()=>setFilterSet('all')}>Tous</button>
              {StockDex.SETS.map(s => (
                <button key={s.id} className={`chip ${filterSet===s.id?'on':''}`} onClick={()=>setFilterSet(s.id)}>
                  <span className="chip-dot" style={{background:s.tint}}/>{s.label.replace('Set ','')}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-grp">
            <div className="filter-lbl">Rareté</div>
            <div className="chips">
              <button className={`chip ${filterRarity==='all'?'on':''}`} onClick={()=>setFilterRarity('all')}>Toutes</button>
              {Object.values(StockDex.RARITY).map(r => (
                <button key={r.id} className={`chip ${filterRarity===r.id?'on':''}`} onClick={()=>setFilterRarity(r.id)}>
                  <span style={{color:r.color, marginRight:6}}>{[...Array(r.stars)].map((_,i)=><span key={i}>✦</span>)}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-grp">
            <div className="filter-lbl">Trier</div>
            <select className="select" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="value-desc">Valeur ↓</option>
              <option value="value-asc">Valeur ↑</option>
              <option value="rarity">Rareté</option>
              <option value="variation">Variation jour</option>
            </select>
          </div>
          <div className="filter-grp end">
            <div className="seg">
              <button className={view==='owned'?'on':''} onClick={()=>setView('owned')}>Possédées</button>
              <button className={view==='all'?'on':''} onClick={()=>setView('all')}>Toutes</button>
            </div>
          </div>
        </div>

        <div className="collection-grid">
          {cards.length === 0 && (
            <div className="empty-state">
              <div className="overline">Vide</div>
              <h3 className="display sm">Aucune carte ne correspond.</h3>
              <p className="lede sm">Ouvrez un booster ou ajustez vos filtres.</p>
              <button className="btn btn-gold" onClick={()=>setRoute('boosters')}>Ouvrir un booster →</button>
            </div>
          )}
          {cards.map(c => {
            const own = owned[c.ticker] || 0;
            const isNew = !!recentlyOpened[c.ticker];
            return (
              <div key={c.ticker} className={`col-card-wrap ${own ? 'owned' : 'missing'}`}>
                <div onClick={() => own && setDetailCard(c)} style={{ opacity: own ? 1 : 0.18, filter: own ? 'none' : 'grayscale(1) brightness(0.7)' }}>
                  <StockCard card={c} size="sm" tilt={!!own} onClick={() => own && setDetailCard(c)} isNew={isNew} />
                </div>
                {own > 1 && <div className="dup-badge">×{own}</div>}
                {!own && <div className="missing-overlay">À découvrir</div>}
              </div>
            );
          })}
        </div>

        {detailCard && <CardDetail card={detailCard} owned={owned} onClose={() => setDetailCard(null)} onSell={onSell} />}
      </div>
    );
  }

  Object.assign(window, { CollectionScreen });

})();
