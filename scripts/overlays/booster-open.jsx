// Booster opening overlay — pack ripping, fanned reveal, summary.
(() => {
  const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useCb } = React;

  function BoosterOpenOverlay({ pack, onClose, onCollect }) {
    // phases: ready, ripping, fanning, revealing[idx], done
    const [phase, setPhase] = useS('ready');
    const [revealed, setRevealed] = useS([]); // indices flipped
    const [focusIdx, setFocusIdx] = useS(null);
    const cards = pack.cards;

    const rip = () => {
      if (phase !== 'ready') return;
      setPhase('ripping');
      setTimeout(() => setPhase('fanning'), 900);
      setTimeout(() => setPhase('revealing'), 1500);
    };

    const flip = (i) => {
      if (revealed.includes(i)) return;
      setRevealed(prev => [...prev, i]);
      setFocusIdx(i);
      if (revealed.length + 1 === cards.length) {
        setTimeout(() => setPhase('done'), 1200);
      }
    };

    const allFlipped = revealed.length === cards.length;
    const hasHit = cards.some(c => c.rarity === 'UR' || c.rarity === 'L');

    return (
      <div className="booster-overlay" onClick={(e)=>{ if (e.target === e.currentTarget && phase==='ready') onClose(); }}>
        <button className="overlay-close" onClick={onClose} aria-label="Fermer">✕</button>

        <div className="stars-bg"/>

        {/* Ambient glow */}
        <div className="booster-glow" style={{
          background: `radial-gradient(circle at 50% 40%, ${pack.tint}55, transparent 65%)`,
          opacity: phase === 'ready' ? 0.9 : phase === 'ripping' ? 1 : 0.65,
        }}/>

        {/* PHASE: READY — pack sitting */}
        {phase === 'ready' && (
          <div className="open-stage">
            <div className="open-title">
              <div className="overline" style={{color:pack.tint}}>{pack.setLabel} · Booster scellé</div>
              <h2 className="display sm">Toucher pour ouvrir</h2>
              <p className="lede sm">5 cartes — au moins une rare. Bonne chance.</p>
            </div>
            <div className="big-pack" onClick={rip}>
              <BigPack tint={pack.tint} setShort={pack.setShort} setLabel={pack.setLabel} />
              <div className="big-pack-hint">touchez</div>
            </div>
          </div>
        )}

        {/* PHASE: RIPPING */}
        {phase === 'ripping' && (
          <div className="open-stage">
            <div className="rip-pack">
              <BigPack tint={pack.tint} setShort={pack.setShort} setLabel={pack.setLabel} ripping />
              <div className="rip-flash"/>
            </div>
          </div>
        )}

        {/* PHASE: FAN / REVEAL */}
        {(phase === 'fanning' || phase === 'revealing' || phase === 'done') && (
          <div className="open-stage reveal">
            <div className="reveal-title">
              <div className="overline" style={{color:pack.tint}}>{pack.setLabel}</div>
              {phase !== 'done' && <h2 className="display sm">Touchez les cartes pour révéler</h2>}
              {phase === 'done' && <h2 className="display sm">{hasHit ? 'Bravo. Un trésor.' : 'Belle main.'}</h2>}
              <div className="reveal-counter">
                {revealed.length} / {cards.length} révélée{revealed.length>1?'s':''}
              </div>
            </div>

            <div className="reveal-fan">
              {cards.map((c, i) => {
                const isRevealed = revealed.includes(i);
                const isFocused = focusIdx === i && !allFlipped;
                const angle = (i - 2) * 7;
                return (
                  <div key={i} className={`fan-slot ${isRevealed?'revealed':''} ${isFocused?'focused':''}`}
                    style={{ '--angle': `${angle}deg`, '--idx': i }}
                    onClick={() => flip(i)}>
                    <div className="fan-flipper" style={{ transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                      <div className="fan-face fan-back">
                        <CardBack tone={pack.tint} />
                        <div className="fan-shimmer" style={{
                          background: `linear-gradient(110deg, transparent 0%, ${pack.tint}66 50%, transparent 100%)`,
                          animationDelay: `${i*0.15}s`,
                        }}/>
                      </div>
                      <div className="fan-face fan-front">
                        <StockCard card={c} size="md" tilt={true} />
                        {c.rarity !== 'C' && <div className="fan-burst" data-rarity={c.rarity}/>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {phase === 'done' && (
              <div className="reveal-summary">
                <div className="reveal-summary-stats">
                  {['C','R','UR','L'].map(r => {
                    const count = cards.filter(c => c.rarity === r).length;
                    if (!count) return null;
                    const meta = StockDex.RARITY[r];
                    return (
                      <div key={r} className="summary-pill">
                        <span style={{color: meta.color}}>{[...Array(meta.stars)].map((_,j)=><span key={j}>✦</span>)}</span>
                        <span>{count} × {meta.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="reveal-actions">
                  <button className="btn btn-ghost" onClick={onCollect}>Voir ma collection</button>
                  <button className="btn btn-gold" onClick={onClose}>Ouvrir un autre booster</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function BigPack({ tint, setShort, setLabel, ripping }) {
    const PACK_GRADIENTS = {
      energie:  'linear-gradient(165deg, #ffd24a 0%, #ff7a3c 50%, #ff3c6e 100%)',
      luxe:     'linear-gradient(165deg, #fbd1ff 0%, #c084fc 50%, #7e3af2 100%)',
      tech:     'linear-gradient(165deg, #a7f3d0 0%, #38bdf8 50%, #3b5bff 100%)',
      pharma:   'linear-gradient(165deg, #d9f99d 0%, #4ade80 50%, #0ea36c 100%)',
      finance:  'linear-gradient(165deg, #c7d2fe 0%, #818cf8 50%, #4338ca 100%)',
    };
    const setIdGuess = { '#ff7a3c': 'energie', '#c084fc': 'luxe', '#38bdf8': 'tech', '#4ade80': 'pharma', '#818cf8': 'finance' }[tint];
    const grad = PACK_GRADIENTS[setIdGuess] || `linear-gradient(165deg, #fff, ${tint})`;
    return (
      <div className={`pack-3d ${ripping?'ripping':''}`}>
        <div className="pack-foil-3d" style={{
          background: grad,
        }}>
          <svg viewBox="0 0 240 360" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none' }}>
            <defs>
              <pattern id={`bigpat-${setIdGuess}`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <path d="M0 10 L20 10" stroke="#fff" strokeWidth="0.8" />
                <circle cx="10" cy="10" r="2" fill="#fff" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="240" height="360" fill={`url(#bigpat-${setIdGuess})`} />
          </svg>
          <div className="pack-3d-inner">
            <div className="overline" style={{color: 'rgba(255,255,255,0.95)', marginBottom: 16}}>StockDex · {setShort}</div>
            <svg viewBox="0 0 120 120" width="130" height="130">
              <g fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.95">
                {[...Array(5)].map((_,i)=><circle key={i} cx="60" cy="60" r={18+i*8} opacity={0.8-i*0.13}/>)}
              </g>
              <text x="60" y="70" textAnchor="middle"
                style={{font:'700 32px "Fredoka","Baloo 2",system-ui,sans-serif', fill: '#fff', letterSpacing: 4}}>SDX</text>
            </svg>
            <div className="pack-3d-name">{setLabel}</div>
            <div className="overline" style={{color: 'rgba(255,255,255,0.9)'}}>Édition Première · 5 cartes</div>
          </div>
        </div>
        <div className="pack-3d-shine" />
      </div>
    );
  }

  Object.assign(window, { BoosterOpenOverlay, BigPack });

})();
