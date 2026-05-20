// <SellOverlay> — met une carte en vente.
//
// On laisse le joueur choisir l'instance précise à vendre (s'il en possède
// plusieurs exemplaires du même ticker) et le prix en CR.
// Suggestion par défaut : current_price de la carte.
(() => {
  const { useState, useMemo } = React;

  function SellOverlay({ sale, onClose, onSubmit }) {
    // sale = { ticker, instances: [{ instance_id, acquired_price }], card (enriched dataset entry) }
    const [instanceId, setInstanceId] = useState(sale.instances[0]?.instance_id ?? null);
    const [price, setPrice]           = useState(() => Math.max(1, Math.round(sale.card.value || 100)));
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);

    const submit = async (e) => {
      e.preventDefault();
      setError(null);
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        setError('Prix invalide.');
        return;
      }
      if (!instanceId) {
        setError('Aucune instance sélectionnée.');
        return;
      }
      setLoading(true);
      try {
        await onSubmit({ instanceId, price: Math.round(priceNum) });
      } catch (err) {
        setError(err.message || 'Impossible de créer l\'annonce.');
        setLoading(false);
      }
    };

    const c = sale.card;
    const suggested = Math.round(c.value || 100);
    const setQuick = (mult) => setPrice(Math.max(1, Math.round(suggested * mult)));

    return (
      <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <button className="overlay-close" onClick={onClose}>✕</button>
        <div className="trade-panel" style={{ maxWidth: 720 }}>
          <div className="trade-head">
            <div className="overline">Mettre en vente</div>
            <h2 className="display sm">{c.ticker} — {c.name}</h2>
            <p className="lede sm">Votre annonce sera visible par tous les autres joueurs. Vous pouvez la retirer à tout moment.</p>
          </div>

          <div className="trade-body" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="trade-col">
              <div className="overline">La carte</div>
              <div className="trade-offer-slots single">
                <StockCard card={c} size="md" tilt={true} />
              </div>
              <div className="trade-wanted-meta">
                <div className="ds"><div className="ds-lbl">Valeur</div><div className="ds-val">{(c.value || 0).toLocaleString('fr-FR')}</div></div>
                <div className="ds"><div className="ds-lbl">Rareté</div><div className="ds-val">{c.rarityMeta.label}</div></div>
                {c.mcap && <div className="ds"><div className="ds-lbl">Cap.</div><div className="ds-val">{c.mcap.toFixed(1)} Mrd €</div></div>}
              </div>
            </div>

            <div className="trade-col">
              <form className="auth-form" onSubmit={submit}>
                {sale.instances.length > 1 && (
                  <div className="auth-field">
                    <label htmlFor="sell-instance">Exemplaire à vendre</label>
                    <select
                      id="sell-instance"
                      value={instanceId ?? ''}
                      onChange={(e) => setInstanceId(Number(e.target.value))}
                      disabled={loading}
                      style={{ font: 'inherit', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--hair-strong)' }}
                    >
                      {sale.instances.map((inst, i) => (
                        <option key={inst.instance_id} value={inst.instance_id}>
                          Exemplaire #{i + 1} (acquis à {inst.acquired_price.toLocaleString('fr-FR')} CR)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="sell-price">Prix de vente (CR)</label>
                  <input
                    id="sell-price"
                    type="number"
                    min={0}
                    step={10}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                  />
                  <span className="hint">Valeur de marché actuelle : <strong>{suggested.toLocaleString('fr-FR')} CR</strong></span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-ghost sm" onClick={() => setQuick(0.85)} disabled={loading}>-15%</button>
                  <button type="button" className="btn btn-ghost sm" onClick={() => setQuick(1.00)} disabled={loading}>Valeur</button>
                  <button type="button" className="btn btn-ghost sm" onClick={() => setQuick(1.15)} disabled={loading}>+15%</button>
                  <button type="button" className="btn btn-ghost sm" onClick={() => setQuick(1.30)} disabled={loading}>+30%</button>
                </div>

                {error && <div className="auth-error" role="alert">{error}</div>}

                <div className="trade-foot" style={{ marginTop: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Annuler</button>
                  <button type="submit" className="btn btn-gold" disabled={loading || !instanceId}>
                    {loading ? 'Publication…' : 'Mettre en vente →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.SellOverlay = SellOverlay;
})();
