// Home / "Place" screen — hero, movers, sets quick-view.
(() => {
  const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useCb } = React;

  function HomeScreen({ dataset, owned, openBoosters, setRoute, openBoosterFlow }) {
    const top = useM(() => [...dataset].sort((a,b) => b.variation - a.variation).slice(0, 5), [dataset]);
    const bottom = useM(() => [...dataset].sort((a,b) => a.variation - b.variation).slice(0, 5), [dataset]);
    const ownedCount = Object.keys(owned).length;
    return (
      <div className="home">
        <div className="home-hero">
          <div className="home-hero-text">
            <div className="overline">Édition Première · Mai 2026</div>
            <h1 className="display">Une bourse.<br/><em>Une collection.</em></h1>
            <p className="lede">
              Cinq secteurs, quarante émetteurs, valorisation au cours du jour.
              Chaque carte est cotée — chaque ouverture est un petit IPO.
            </p>
            <div className="home-ctas">
              <button className="btn btn-gold" onClick={() => setRoute('boosters')}>
                Ouvrir un Booster <span style={{opacity:.5,marginLeft:8}}>→</span>
              </button>
              <button className="btn btn-ghost" onClick={() => setRoute('collection')}>
                Ma Collection · {ownedCount}/{StockDex.COMPANIES.length}
              </button>
            </div>
          </div>
          <div className="home-hero-cards">
            {[dataset.find(c=>c.ticker==='MC'), dataset.find(c=>c.ticker==='ASML'), dataset.find(c=>c.ticker==='NOVO')].map((c,i)=>(
              <div key={c.ticker} style={{
                transform: `translateY(${i*-22}px) rotate(${(i-1)*-4}deg)`,
                zIndex: 10 - i,
                marginLeft: i ? -110 : 0,
              }}>
                <StockCard card={c} size="md" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel-row">
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="overline">Plus fortes hausses</div>
                <div className="panel-title">Bull Run du jour</div>
              </div>
              <div className="panel-sub">7 j. — 30 j.</div>
            </div>
            <div className="movers">
              {top.map(c => (
                <MoverRow key={c.ticker} card={c} />
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="overline">Plus fortes baisses</div>
                <div className="panel-title">Sous pression</div>
              </div>
              <div className="panel-sub">7 j. — 30 j.</div>
            </div>
            <div className="movers">
              {bottom.map(c => (
                <MoverRow key={c.ticker} card={c} />
              ))}
            </div>
          </div>
        </div>

        <div className="panel-row">
          <div className="panel sets-panel">
            <div className="panel-head">
              <div>
                <div className="overline">Cinq sets disponibles</div>
                <div className="panel-title">Sets thématiques</div>
              </div>
              <button className="link-btn" onClick={()=>setRoute('boosters')}>Tout voir →</button>
            </div>
            <div className="sets-grid">
              {StockDex.SETS.map(s => {
                const cardsInSet = StockDex.COMPANIES.filter(c=>c.sector===s.id).length;
                const ownedInSet = StockDex.COMPANIES.filter(c=>c.sector===s.id && owned[c.ticker]).length;
                const pct = (ownedInSet / cardsInSet) * 100;
                return (
                  <div key={s.id} className="set-card" onClick={() => openBoosterFlow(s.id)}>
                    <div className="set-card-bg" style={{ background:`radial-gradient(circle at 20% 20%, ${s.tint}30, transparent 70%)` }}/>
                    <div className="set-short">{s.short}</div>
                    <div className="set-name">{s.label.replace('Set ','')}</div>
                    <div className="set-stats">
                      <div className="set-stat-num">{ownedInSet}<span className="set-stat-tot">/{cardsInSet}</span></div>
                      <div className="set-bar"><div className="set-bar-fill" style={{ width: `${pct}%`, background: s.tint }}/></div>
                    </div>
                    <button className="set-cta">Ouvrir →</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function MoverRow({ card }) {
    const up = card.variation >= 0;
    return (
      <div className="mover-row">
        <div className="mover-emblem"><TickerEmblem ticker={card.ticker} sector={card.sector} size={36} tone={card.sectorMeta.tint} /></div>
        <div className="mover-id">
          <div className="mover-tic">{card.ticker}</div>
          <div className="mover-name">{card.name}</div>
        </div>
        <Sparkline data={card.history.slice(-15)} width={92} height={28} color={up?'#9bcfa3':'#e08a8a'} />
        <div className="mover-val">
          <div className="mover-px">{card.value.toLocaleString('fr-FR')}</div>
          <div className={`mover-var ${up?'up':'down'}`}>{up?'▲':'▼'} {Math.abs(card.variation).toFixed(2)}%</div>
        </div>
      </div>
    );
  }

  Object.assign(window, { HomeScreen, MoverRow });

})();
