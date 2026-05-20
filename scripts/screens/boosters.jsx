// Booster shop — set picker grid.
(() => {
  const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useCb } = React;

  function BoostersScreen({ dataset, openBoosterFlow }) {
    const PACK_GRADIENTS = {
      energie:  'linear-gradient(165deg, #ffd24a 0%, #ff7a3c 50%, #ff3c6e 100%)',
      luxe:     'linear-gradient(165deg, #fbd1ff 0%, #c084fc 50%, #7e3af2 100%)',
      tech:     'linear-gradient(165deg, #a7f3d0 0%, #38bdf8 50%, #3b5bff 100%)',
      pharma:   'linear-gradient(165deg, #d9f99d 0%, #4ade80 50%, #0ea36c 100%)',
      finance:  'linear-gradient(165deg, #c7d2fe 0%, #818cf8 50%, #4338ca 100%)',
    };
    return (
      <div className="boosters-screen">
        <div className="page-head">
          <div className="overline">Booster Shop</div>
          <h2 className="display sm">Choisissez votre secteur</h2>
          <p className="lede sm">5 cartes par booster. Au moins une rare garantie. Carte légendaire 18%.</p>
        </div>
        <div className="booster-grid">
          {StockDex.SETS.map(s => {
            const top = dataset.filter(c => c.sector === s.id).sort((a,b) => b.mcap - a.mcap).slice(0,2);
            return (
              <div key={s.id} className="booster-pack" onClick={()=>openBoosterFlow(s.id)}>
                <div className="pack-foil" style={{ background: PACK_GRADIENTS[s.id] }}/>
                <PackOrnament tone="#ffffff" />
                <div className="pack-content">
                  <div className="overline">{s.short} · Édition Première</div>
                  <div>
                    <div className="pack-name">{s.label.replace('Set ','')}</div>
                    <div className="pack-divider"/>
                    <div className="pack-tags">
                      {top.map(c => <span key={c.ticker} className="pack-tag">{c.ticker}</span>)}
                    </div>
                  </div>
                  <div className="pack-foot">
                    <div className="pack-price">◉ 1 200 CR</div>
                    <button className="btn btn-gold sm">Ouvrir →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function PackOrnament({ tone }) {
    return (
      <svg className="pack-ornament" viewBox="0 0 200 280" preserveAspectRatio="none">
        <defs>
          <pattern id={`po-${tone.replace('#','')}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 4 L8 4" stroke={tone} strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="200" height="280" fill={`url(#po-${tone.replace('#','')})`} opacity="0.25" />
        <g fill="none" stroke={tone} strokeWidth="0.6" opacity="0.4">
          <circle cx="100" cy="140" r="60"/><circle cx="100" cy="140" r="40"/><circle cx="100" cy="140" r="80"/>
        </g>
      </svg>
    );
  }

  Object.assign(window, { BoostersScreen, PackOrnament });

})();
