// Card visual — StockCard, CardBack, Sparkline, TickerEmblem.
(() => {
  const { useRef, useState, useEffect, useMemo } = React;

  // Vibrant sector gradients
  const SECTOR_GRADIENTS = {
    energie:  ['#ffd24a', '#ff7a3c', '#ff3c6e'],   // sun → fire
    luxe:     ['#fbd1ff', '#c084fc', '#7e3af2'],   // rose → violet
    tech:     ['#a7f3d0', '#38bdf8', '#3b5bff'],   // teal → blue
    pharma:   ['#d9f99d', '#4ade80', '#0ea36c'],   // lime → green
    finance:  ['#c7d2fe', '#818cf8', '#4338ca'],   // periwinkle → indigo
  };

  const RARITY_FRAME = {
    C:  { border: '#ffffff', stripes: false, halo: 'rgba(255,255,255,0.6)', stars: 1, label: '◆' },
    R:  { border: '#cfe8ff', stripes: true,  halo: 'rgba(56,189,248,0.8)',  stars: 2, label: '◆◆' },
    UR: { border: '#fff2a6', stripes: true,  halo: 'rgba(255,215,54,0.9)',  stars: 3, label: '★' },
    L:  { border: '#ffd2ff', stripes: true,  halo: 'rgba(255,90,170,0.95)', stars: 4, label: '★★' },
  };

  // Abstract emblem — same as before, kept original (no real logos)
  function TickerEmblem({ ticker, sector, size = 88, tone = '#fff' }) {
    let h = 0; for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
    const variant = h % 6;
    const rot = (h % 24) * 15;
    const id = `gly-${ticker}`;
    const initials = ticker.slice(0, ticker.length > 3 ? 4 : ticker.length);
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id={`${id}-bg`} cx="50%" cy="50%" r="55%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor={tone} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill={`url(#${id}-bg)`} />
        <g transform={`rotate(${rot} 60 60)`} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.7">
          {[...Array(8)].map((_, i) => (
            <circle key={i} cx="60" cy="60" r={20 + i * 4} />
          ))}
        </g>
        <g transform={`rotate(${-rot/3} 60 60)`} stroke={`url(#${id}-stroke)`} strokeWidth="2" fill="none">
          {variant === 0 && <polygon points="60,18 102,60 60,102 18,60" />}
          {variant === 1 && <g>
            <circle cx="60" cy="60" r="36" />
            <circle cx="60" cy="60" r="22" />
          </g>}
          {variant === 2 && <g>
            <path d="M30 30 L90 90 M90 30 L30 90" />
            <rect x="30" y="30" width="60" height="60" />
          </g>}
          {variant === 3 && <g>
            <polygon points="60,22 96,82 24,82" />
            <polygon points="60,98 24,38 96,38" opacity="0.65" />
          </g>}
          {variant === 4 && <g>
            <path d="M60 18 L90 60 L60 102 L30 60 Z" />
            <path d="M60 36 L74 60 L60 84 L46 60 Z" />
          </g>}
          {variant === 5 && <g>
            <circle cx="60" cy="60" r="36" />
            <path d="M24 60 L96 60 M60 24 L60 96" />
          </g>}
        </g>
        <text x="60" y="69" textAnchor="middle"
          style={{
            font: '700 26px "Fredoka", "Baloo 2", system-ui, sans-serif',
            fill: '#ffffff',
            letterSpacing: initials.length > 3 ? '0.2px' : '1.5px',
            paintOrder: 'stroke',
            stroke: 'rgba(0,0,0,0.18)',
            strokeWidth: 1,
          }}>{initials}</text>
      </svg>
    );
  }

  // Sparkline
  function Sparkline({ data, color, width = 120, height = 30, fill = true }) {
    if (!data || !data.length) return null;
    const lo = Math.min(...data), hi = Math.max(...data);
    const span = hi - lo || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - lo) / span) * (height - 4) - 2;
      return [x, y];
    });
    const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    const area = d + ` L${width},${height} L0,${height} Z`;
    const up = data[data.length - 1] >= data[0];
    const stroke = color || (up ? '#16a34a' : '#dc2626');
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {fill && <path d={area} fill={stroke} fillOpacity="0.15" />}
        <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }

  // Sparkle accents
  function SparkleDots({ count = 6, color = '#fff' }) {
    const dots = useMemo(() => {
      return [...Array(count)].map((_, i) => ({
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        r: 0.5 + Math.random() * 1.4,
        d: Math.random() * 2,
      }));
    }, [count]);
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {dots.map((d, i) => (
          <g key={i} style={{ animation: `twinkle ${1.6 + d.d}s ease ${d.d}s infinite` }}>
            <circle cx={d.x} cy={d.y} r={d.r} fill={color} opacity="0.9" />
          </g>
        ))}
      </svg>
    );
  }

  // THE CARD
  function StockCard({ card, size = 'md', tilt = true, holo = 1, onClick, faceDown = false, isNew = false }) {
    const ref = useRef(null);
    const [t, setT] = useState({ rx: 0, ry: 0, mx: 50, my: 50, hover: false });
    const sizes = {
      sm: { w: 168, h: 250, padding: 10, name: 11, ticker: 18, radius: 14 },
      md: { w: 232, h: 348, padding: 14, name: 13, ticker: 24, radius: 18 },
      lg: { w: 320, h: 480, padding: 18, name: 17, ticker: 32, radius: 24 },
      xl: { w: 380, h: 568, padding: 22, name: 20, ticker: 38, radius: 28 },
    };
    const s = sizes[size] || sizes.md;
    const rarity = card.rarityMeta;
    const frame = RARITY_FRAME[card.rarity];
    const sector = card.sectorMeta;
    const gradient = SECTOR_GRADIENTS[card.sector] || ['#fff', '#aaa', '#555'];
    const globalHolo = (typeof window !== 'undefined' && window.__sdxTweaks && window.__sdxTweaks.holoIntensity != null) ? window.__sdxTweaks.holoIntensity : 1;
    // Holo now scales with rarity (commons get a hint, legendaries get full chase)
    const baseHolo = card.rarity === 'C' ? 0.18 : card.rarity === 'R' ? 0.55 : card.rarity === 'UR' ? 0.85 : 1.1;
    const holoFactor = baseHolo * holo * globalHolo;

    const handleMove = (e) => {
      if (!tilt) return;
      const r = ref.current.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top)  / r.height;
      setT({ rx: (py - 0.5) * -14, ry: (px - 0.5) * 16, mx: px * 100, my: py * 100, hover: true });
    };
    const handleLeave = () => setT({ rx: 0, ry: 0, mx: 50, my: 50, hover: false });

    const up = card.variation >= 0;

    return (
      <div
        className="card-tilt-wrap"
        style={{ perspective: '900px', width: s.w, height: s.h, flexShrink: 0, position: 'relative' }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onClick}
        ref={ref}
      >
        {/* Rarity halo */}
        {card.rarity !== 'C' && (
          <div style={{
            position: 'absolute', inset: -8, borderRadius: s.radius + 4,
            background: `radial-gradient(circle at 50% 50%, ${frame.halo}, transparent 70%)`,
            opacity: t.hover ? 0.9 : 0.55,
            filter: 'blur(8px)',
            transition: 'opacity 200ms ease',
            pointerEvents: 'none',
          }}/>
        )}
        <div
          className="card-tilt"
          style={{
            width: '100%', height: '100%',
            transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
            transition: t.hover ? 'transform 80ms linear, box-shadow 200ms ease' : 'transform 400ms cubic-bezier(.2,.7,.2,1), box-shadow 400ms ease',
            transformStyle: 'preserve-3d',
            position: 'relative',
            borderRadius: s.radius,
            boxShadow: t.hover
              ? `0 30px 60px -20px rgba(14,37,87,.4), 0 0 0 1px rgba(255,255,255,.6)`
              : `0 14px 30px -16px rgba(14,37,87,.4)`,
            cursor: onClick ? 'pointer' : 'default',
          }}
        >
          {faceDown ? (
            <CardBack tint={gradient[1]} />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: s.radius, overflow: 'hidden',
              background: `linear-gradient(165deg, ${gradient[0]} 0%, ${gradient[1]} 55%, ${gradient[2]} 100%)`,
              border: `4px solid ${frame.border}`,
            }}>
              {/* Sparkle confetti on all but commons */}
              {card.rarity !== 'C' && <SparkleDots count={size === 'sm' ? 6 : 14} color="#fff" />}

              {/* Top strip: rarity stars + sector label */}
              <div style={{
                position: 'absolute', top: s.padding, left: s.padding, right: s.padding,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, zIndex: 3,
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.92)', padding: '4px 9px', borderRadius: 999,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[2]})`,
                  }}/>
                  <span style={{
                    fontFamily: '"Fredoka","Nunito",sans-serif', fontWeight: 700, fontSize: 9,
                    letterSpacing: 1, color: '#0e2557', textTransform: 'uppercase',
                  }}>{sector.label}</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.92)', padding: '4px 9px', borderRadius: 999,
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  color: card.rarity === 'L' ? '#d72e2e' : card.rarity === 'UR' ? '#c08300' : card.rarity === 'R' ? '#1c54b8' : '#5d6f9c',
                  fontSize: size === 'sm' ? 9 : 11, fontWeight: 700, letterSpacing: 1,
                  fontFamily: '"Fredoka","Nunito",sans-serif',
                }}>
                  {[...Array(frame.stars)].map((_, i) => <span key={i} style={{fontSize: size==='sm'?9:11}}>★</span>)}
                </div>
              </div>

              {/* Ticker title block */}
              <div style={{
                position: 'absolute', top: s.padding + 30, left: s.padding, right: s.padding, zIndex: 3, textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: '"Fredoka","Nunito",sans-serif', fontWeight: 700, fontSize: s.ticker,
                  color: '#fff', letterSpacing: 1, lineHeight: 1,
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}>{card.ticker}</div>
                <div style={{
                  marginTop: 4, fontFamily: '"Fredoka","Nunito",sans-serif', fontWeight: 600, fontSize: size==='sm'?9:11,
                  color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textTransform: 'uppercase',
                }}>
                  Cap. {card.mcap >= 100 ? card.mcap.toFixed(0) : card.mcap.toFixed(1)} Mrd €
                </div>
              </div>

              {/* Emblem panel */}
              <div style={{
                position: 'absolute',
                top: s.padding + s.ticker + 50,
                left: s.padding + 4, right: s.padding + 4,
                height: s.h * 0.40,
                borderRadius: 12,
                background: `linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))`,
                border: `2px solid rgba(255,255,255,0.7)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.12)',
                zIndex: 2,
              }}>
                {/* Burst rays for rare+ */}
                {card.rarity !== 'C' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `repeating-conic-gradient(from 0deg at 50% 50%,
                      rgba(255,255,255,0.18) 0deg, transparent 14deg, rgba(255,255,255,0.18) 28deg)`,
                    opacity: 0.6,
                  }}/>
                )}
                <TickerEmblem ticker={card.ticker} sector={card.sector} size={s.h * 0.34} tone="#ffffff" />
              </div>

              {/* Name */}
              <div style={{
                position: 'absolute',
                top: s.padding + s.ticker + 50 + s.h * 0.40 + 8,
                left: s.padding + 8, right: s.padding + 8,
                textAlign: 'center', zIndex: 3,
              }}>
                <div style={{
                  fontFamily: '"Fraunces","Cormorant Garamond",serif',
                  fontStyle: 'italic',
                  fontSize: s.name + 2, lineHeight: 1.1, color: '#fff', fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}>{card.name}</div>
              </div>

              {/* Bottom: value pill + variation */}
              <div style={{
                position: 'absolute', left: s.padding, right: s.padding, bottom: s.padding,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6, zIndex: 3,
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: size==='sm'?'5px 10px':'7px 13px',
                  borderRadius: 12,
                  boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
                  minWidth: 0, flex: 1,
                }}>
                  <div style={{
                    fontFamily: '"Fredoka",sans-serif', fontWeight: 600, fontSize: 8,
                    letterSpacing: 1.4, color: '#5d6f9c', textTransform: 'uppercase',
                  }}>Valeur</div>
                  <div style={{
                    fontFamily: '"Fredoka",sans-serif', fontWeight: 700, fontSize: s.ticker - 6, lineHeight: 1,
                    color: '#0e2557', fontVariantNumeric: 'tabular-nums', marginTop: 2,
                  }}>{card.value.toLocaleString('fr-FR')}</div>
                </div>
                <div style={{
                  background: up ? 'rgba(22,163,74,0.96)' : 'rgba(220,38,38,0.96)',
                  padding: size==='sm'?'5px 9px':'7px 12px',
                  borderRadius: 12,
                  color: '#fff',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                }}>
                  <div style={{
                    fontFamily: '"Fredoka",sans-serif', fontWeight: 700, fontSize: size==='sm'?10:12,
                    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                  }}>
                    {up ? '▲' : '▼'} {Math.abs(card.variation).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Sparkline strip behind everything */}
              <div style={{
                position: 'absolute', left: 0, right: 0, top: s.h - s.padding - 60,
                height: 16, opacity: 0.45, pointerEvents: 'none', zIndex: 2,
              }}>
                <Sparkline data={card.history.slice(-20)} color="#ffffff" width={s.w} height={16} fill={false} />
              </div>

              {/* HOLO LAYERS */}
              {holoFactor > 0 && (
                <>
                  {/* Diagonal rainbow stripes (always visible on rares, very visible on hover) */}
                  {frame.stripes && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: s.radius, pointerEvents: 'none',
                      background:
                        `repeating-linear-gradient(${(t.mx - 50) * 1.5 + 110}deg,
                          rgba(255,90,140,${0.18*holoFactor}) 0px,
                          rgba(255,210,90,${0.18*holoFactor}) 14px,
                          rgba(90,220,180,${0.18*holoFactor}) 28px,
                          rgba(90,180,255,${0.18*holoFactor}) 42px,
                          rgba(210,90,255,${0.18*holoFactor}) 56px,
                          rgba(255,90,140,${0.18*holoFactor}) 70px)`,
                      mixBlendMode: 'screen',
                      opacity: t.hover ? 1 : 0.7,
                      transition: 'opacity 200ms',
                    }}/>
                  )}
                  {/* Spot conic rainbow for UR+ */}
                  {holoFactor >= 0.7 && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: s.radius, pointerEvents: 'none',
                      background: `conic-gradient(from ${t.mx * 3.6}deg at ${t.mx}% ${t.my}%,
                        rgba(255,90,90,.55), rgba(255,215,54,.55), rgba(74,222,128,.55),
                        rgba(56,189,248,.55), rgba(192,132,252,.55), rgba(255,90,90,.55))`,
                      mixBlendMode: 'overlay',
                      opacity: (t.hover ? 0.55 : 0.28) * Math.min(1, holoFactor),
                      filter: 'blur(8px)',
                      transition: 'opacity 200ms',
                    }}/>
                  )}
                  {/* Glossy highlight */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: s.radius, pointerEvents: 'none',
                    background: `radial-gradient(160px circle at ${t.mx}% ${t.my}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)`,
                    mixBlendMode: 'soft-light',
                    opacity: (t.hover ? 0.9 : 0.6) * Math.min(1, holoFactor),
                  }}/>
                </>
              )}

              {/* Inner foil frame */}
              <div style={{
                position: 'absolute', inset: 4, borderRadius: s.radius - 4,
                border: '1px solid rgba(255,255,255,0.55)',
                pointerEvents: 'none',
              }}/>
            </div>
          )}
        </div>

        {/* NEW! badge */}
        {isNew && <div className="new-badge">NEW</div>}
      </div>
    );
  }

  function CardBack({ tint = '#6b7cff' }) {
    return (
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        background: `linear-gradient(160deg, ${tint} 0%, #0e2557 100%)`,
        border: '4px solid #fff', overflow: 'hidden',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
      }}>
        <svg viewBox="0 0 200 300" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
          <defs>
            <pattern id="back-pat" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M 0 10 L 20 10" stroke="#fff" strokeWidth="1" />
              <circle cx="10" cy="10" r="2" fill="#fff" />
            </pattern>
          </defs>
          <rect width="200" height="300" fill="url(#back-pat)" />
        </svg>
        <div style={{
          position: 'absolute', inset: 14, border: '2px solid rgba(255,255,255,0.7)', borderRadius: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
        }}>
          <svg viewBox="0 0 120 120" width="58%" height="auto" style={{ overflow: 'visible' }}>
            <g fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.85">
              {[...Array(6)].map((_, i) => <circle key={i} cx="60" cy="60" r={18 + i * 6} opacity={0.6 - i*0.07} />)}
            </g>
            <text x="60" y="69" textAnchor="middle"
              style={{ font: '700 30px "Fredoka","Baloo 2",system-ui,sans-serif', fill: '#fff', letterSpacing: 3 }}>SDX</text>
          </svg>
          <div style={{
            fontFamily: '"Fredoka","Baloo 2",system-ui,sans-serif', fontWeight: 700,
            color: '#fff', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase',
          }}>StockDex</div>
        </div>
      </div>
    );
  }

  Object.assign(window, { StockCard, CardBack, Sparkline, TickerEmblem });

})();
