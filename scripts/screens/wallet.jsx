// <WalletScreen> — boutique de CR gratuits (contexte d'exercice).
//
// La liste des packs vient du serveur (source de vérité). Un clic appelle
// /api/wallet/claim, le solde dans la navbar se met à jour à la réponse.
(() => {
  const { useState, useEffect } = React;
  const api = window.StockDex.api;

  function WalletScreen({ coins, onClaim }) {
    const [packs, setPacks]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(null); // packId en cours

    useEffect(() => {
      api.getWalletPacks()
        .then(({ packs }) => setPacks(packs))
        .catch(() => { /* swallow — affichera juste une grille vide */ })
        .finally(() => setLoading(false));
    }, []);

    const handleClaim = async (packId) => {
      setClaiming(packId);
      try {
        await onClaim(packId);
      } finally {
        setClaiming(null);
      }
    };

    return (
      <div className="wallet-screen">
        <div className="page-head row">
          <div>
            <div className="overline">Boutique · Recharger</div>
            <h2 className="display sm">Ajoutez des CR à votre portefeuille</h2>
          </div>
          <div className="wallet-balance">
            Solde actuel : <strong>{coins.toLocaleString('fr-FR')}</strong> CR
          </div>
        </div>

        {loading && (
          <div className="trade-empty" style={{ padding: 32, textAlign: 'center' }}>
            Chargement des packs…
          </div>
        )}

        <div className="wallet-grid">
          {packs.map((p) => (
            <div key={p.id} className={`wallet-pack ${claiming === p.id ? 'loading' : ''}`}>
              <div className="wallet-pack-coin">◉</div>
              <h3 className="wallet-pack-label">{p.label}</h3>
              <div className="wallet-pack-amount">
                +{p.coins.toLocaleString('fr-FR')}
                <span className="wallet-pack-amount-unit">CR</span>
              </div>
              <p className="wallet-pack-blurb">{p.blurb}</p>
              <button
                className="btn btn-gold"
                disabled={claiming !== null}
                onClick={() => handleClaim(p.id)}
              >
                {claiming === p.id ? 'Crédit en cours…' : 'Réclamer'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  window.WalletScreen = WalletScreen;
})();
