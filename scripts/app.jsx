// StockDex — App shell, routing, top-level state.
(() => {
  const { useState, useEffect, useMemo, useCallback } = React;
  const api = window.StockDex.api;

  // Visual defaults — these used to live in a runtime Tweaks panel during
  // design; they're inlined here so the app stays self-contained.
  const VISUAL_DEFAULTS = {
    accent: '#c9a35a',
    holoIntensity: 1.0,
    tiltOnGrid: true,
    tickerSpeed: 1.0,
    dense: false,
  };

  // ---------------------------------------------------------------------
  // <Root> : gère l'authentification. Tant qu'aucun user n'est en mémoire,
  // on rend <AuthScreen>. Sinon on rend <App>, qui contient toute la logique
  // de jeu existante.
  //
  // Au démarrage, si un user/token est en localStorage on tente de le
  // valider en arrière-plan via /api/me — un token expiré déclenche
  // 'stockdex:logout' depuis api.js et on retombe sur l'écran de connexion.
  // ---------------------------------------------------------------------
  function Root() {
    const [user, setUser] = useState(() => api.getCachedUser());

    useEffect(() => {
      if (!api.getToken()) return;
      api.me().then(setUser).catch(() => { /* le 401 a déjà purgé le token */ });
    }, []);

    useEffect(() => {
      const onLogout = () => setUser(null);
      window.addEventListener('stockdex:logout', onLogout);
      return () => window.removeEventListener('stockdex:logout', onLogout);
    }, []);

    if (!user) return <AuthScreen onAuth={setUser} />;
    return <App initialUser={user} onLogout={() => { api.logout(); }} />;
  }

  function App({ initialUser, onLogout }) {
    const [route, setRoute] = useState('home');
    const [seed]            = useState('day1');
    const [tweaks]          = useState(VISUAL_DEFAULTS);

    const dataset = useMemo(() => StockDex.buildDataset(seed), [seed]);

    // owned : { TICKER: count }. Hydraté depuis /api/me/collection au boot.
    // Un nouveau joueur commence avec un dict vide — pas de cartes offertes.
    const [owned, setOwned] = useState({});
    // collectionDetail : { TICKER: { count, card, instances: [{instance_id, acquired_price}] } }
    // — utile pour la mise en vente (on doit envoyer l'instance_id précise).
    const [collectionDetail, setCollectionDetail] = useState({});
    const [coins, setCoins] = useState(initialUser.coins);
    const [gems]            = useState(initialUser.gems);

    // Marketplace : listings brutes du backend
    const [marketListings, setMarketListings] = useState([]);

    const [boosterPack,    setBoosterPack]    = useState(null);
    const [sellSubject,    setSellSubject]    = useState(null); // { ticker, instances, card }
    const [toast,          setToast]          = useState(null);
    const [recentlyOpened, setRecentlyOpened] = useState({});

    const refreshCollection = useCallback(async () => {
      try {
        const { byTicker, instances } = await api.getCollection();
        const ownedNext = {};
        const detailNext = {};
        for (const ticker in byTicker) {
          ownedNext[ticker] = byTicker[ticker].count;
          detailNext[ticker] = {
            count: byTicker[ticker].count,
            card:  byTicker[ticker].card,
            instances: instances.filter(i => i.ticker === ticker)
              .map(i => ({ instance_id: i.instance_id, acquired_price: i.acquired_price })),
          };
        }
        setOwned(ownedNext);
        setCollectionDetail(detailNext);
      } catch (_) { /* 401 déjà géré par api.js */ }
    }, []);

    const refreshMarket = useCallback(async () => {
      try {
        const { listings } = await api.listMarket();
        setMarketListings(listings);
      } catch (_) {}
    }, []);

    useEffect(() => { refreshCollection(); refreshMarket(); }, [refreshCollection, refreshMarket]);

    const showToast = (msg, kind = 'ok') => {
      setToast({ msg, kind });
      setTimeout(() => setToast(null), 2800);
    };

    // Le serveur fait autorité : tirage + déduction de coins + insertion dans
    // owned_cards arrivent en une seule transaction. On reflète localement
    // ce qu'il renvoie. Les cartes sont enrichies depuis `dataset` (qui
    // contient les helpers UI : sparkline, variation%, rarityMeta…) en
    // matchant par ticker.
    const openBoosterFlow = useCallback(async (setId) => {
      try {
        const { cards, user } = await api.openBooster(setId);
        const enriched = cards.map(serverCard =>
          dataset.find(c => c.ticker === serverCard.ticker) || serverCard
        );
        const setMeta = StockDex.SECTORS[setId];
        setBoosterPack({
          setId,
          setShort: setMeta.short,
          setLabel: setMeta.label,
          tint: setMeta.tint,
          cards: enriched,
        });
        setCoins(user.coins);
        stashNewCards(cards);
        // On rafraîchit owned + collectionDetail (avec instance_ids) depuis
        // le backend : sans ça, on aurait owned[ticker] mis à jour mais
        // collectionDetail vide, et la mise en vente échouerait faute
        // d'instance_id à publier.
        await refreshCollection();
      } catch (err) {
        if (err.status === 402) {
          showToast('Crédits insuffisants. Il vous faut 1 200 CR.', 'warn');
        } else {
          showToast(err.message || 'Impossible d\'ouvrir le booster.', 'warn');
        }
      }
    }, [dataset, refreshCollection]);

    // After a successful booster open, tag the new tickers so the collection
    // screen can show a "NEW" badge until the next batch supersedes them.
    const stashNewCards = (cards) => {
      setRecentlyOpened(() => {
        const next = {};
        cards.forEach(c => { next[c.ticker] = Date.now(); });
        return next;
      });
    };

    // Les cartes sont déjà persistées et ajoutées à `owned` au moment de
    // l'ouverture. Les handlers ne font plus que fermer l'overlay.
    const collectBooster = () => {
      if (!boosterPack) return;
      setBoosterPack(null);
      setRoute('collection');
      showToast('Cartes ajoutées à votre collection.');
    };

    const closeBooster = () => {
      setBoosterPack(null);
    };

    // --- Marketplace : achat CR ---------------------------------------------
    const buyListing = async (listing) => {
      try {
        const { user } = await api.buyListing(listing.id);
        setCoins(user.coins);
        await Promise.all([refreshCollection(), refreshMarket()]);
        showToast(`${listing.card.ticker} acheté à ${listing.seller.username}.`);
      } catch (err) {
        if (err.status === 402)      showToast('Crédits insuffisants.', 'warn');
        else if (err.status === 409) showToast('Cette annonce vient d\'être prise.', 'warn');
        else                          showToast(err.message || 'Achat impossible.', 'warn');
        await refreshMarket();
      }
    };

    // --- Marketplace : créer / annuler une annonce --------------------------
    const openSellOverlay = (card) => {
      const detail = collectionDetail[card.ticker];
      if (!detail || detail.instances.length === 0) {
        showToast('Vous ne possédez pas cette carte.', 'warn');
        return;
      }
      setSellSubject({ ticker: card.ticker, instances: detail.instances, card });
    };

    const submitSellListing = async ({ instanceId, price }) => {
      await api.createListing(instanceId, price);
      setSellSubject(null);
      await Promise.all([refreshCollection(), refreshMarket()]);
      showToast('Annonce publiée.');
    };

    const cancelMyListing = async (listingId) => {
      try {
        await api.cancelListing(listingId);
        await Promise.all([refreshCollection(), refreshMarket()]);
        showToast('Annonce retirée.');
      } catch (err) {
        showToast(err.message || 'Impossible de retirer l\'annonce.', 'warn');
      }
    };

    // --- Boutique : réclamer un pack de CR (gratuit) ------------------------
    const claimWalletPack = async (packId) => {
      try {
        const { granted, user } = await api.claimWalletPack(packId);
        setCoins(user.coins);
        showToast(`+${granted.toLocaleString('fr-FR')} CR crédités.`);
      } catch (err) {
        showToast(err.message || 'Impossible de créditer le compte.', 'warn');
      }
    };

    // Push visual tweaks onto CSS custom properties so cards & ticker can read
    // them without prop drilling. window.__sdxTweaks is consumed by card.jsx.
    useEffect(() => {
      window.__sdxTweaks = tweaks;
      document.documentElement.style.setProperty('--accent', tweaks.accent);
      document.documentElement.style.setProperty('--grid-gap', tweaks.dense ? '14px' : '22px');
    }, [tweaks]);

    return (
      <div className="app" data-route={route}>
        <NavBar route={route} setRoute={setRoute} coins={coins} gems={gems} user={initialUser} onLogout={onLogout} />
        <MarketTicker dataset={dataset} speed={tweaks.tickerSpeed} />

        <div className="page-wrap">
          {route === 'home'       && <HomeScreen       dataset={dataset} owned={owned} setRoute={setRoute} openBoosterFlow={openBoosterFlow} />}
          {route === 'boosters'   && <BoostersScreen   dataset={dataset} openBoosterFlow={openBoosterFlow} />}
          {route === 'collection' && <CollectionScreen dataset={dataset} owned={owned} recentlyOpened={recentlyOpened} setRoute={setRoute} openBoosterFlow={openBoosterFlow} onSell={openSellOverlay} />}
          {route === 'market'     && (
            <MarketScreen
              dataset={dataset}
              listings={marketListings}
              currentUserId={initialUser.id}
              onBuy={buyListing}
              onCancelListing={cancelMyListing}
              onRefresh={refreshMarket}
            />
          )}
          {route === 'wallet'     && <WalletScreen coins={coins} onClaim={claimWalletPack} />}
        </div>

        {boosterPack && <BoosterOpenOverlay pack={boosterPack} onClose={closeBooster} onCollect={collectBooster} />}
        {sellSubject && <SellOverlay sale={sellSubject} onClose={() => setSellSubject(null)} onSubmit={submitSellListing} />}

        {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
})();
