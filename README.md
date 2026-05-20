# StockDex

Une bourse fictive en application monopage : ouvrez des boosters, collectionnez les cartes, échangez sur le marketplace. Pas de build step — React + Babel standalone tournent directement dans le navigateur.

## Lancer en local

```bash
# Babel standalone refuse de fetch des `<script src>` depuis file://,
# il faut servir le dossier via HTTP. Au choix :
npx serve .
# ou
python -m http.server 8080
```

Puis ouvrir <http://localhost:8080>.

## Structure

```
index.html              Entrée — charge feuilles de style, vendor, scripts
README.md
styles/
  fonts.css             @font-face (Fraunces, Fredoka, JetBrains Mono, Nunito)
  variables.css         Custom properties (couleurs, polices, ombres)
  base.css              Reset, fond global, scrollbar
  typography.css        .display / .lede / .overline / .panel-title
  layout.css            Navbar, ticker strip, page wrapper
  buttons.css           Boutons or / rouge / fantôme
  home.css              Écran d'accueil (hero, movers, sets)
  boosters.css          Shop + animation d'ouverture + reveal fan
  collection.css        Filtres, grille, badges, vides
  detail.css            Overlay de détail d'une carte
  marketplace.css       Liste des annonces
  trade.css             Overlay de proposition d'échange
  toast.css             Notifications éphémères
  responsive.css        Breakpoints
scripts/
  data.js               SECTORS, RARITY, COMPANIES, buildDataset, rollBooster
  components/
    card.jsx            <StockCard>, <CardBack>, <Sparkline>, <TickerEmblem>
    chrome.jsx          <NavBar>, <MarketTicker>
  screens/
    home.jsx            Place — hero, top movers, raccourcis sets
    boosters.jsx        Booster shop
    collection.jsx      Ma collection (filtres, tri, vue)
    marketplace.jsx     Annonces (ventes & échanges)
  overlays/
    booster-open.jsx    Animation déchirement + fan reveal
    card-detail.jsx     Détail d'une carte (stats, historique 30j)
    trade.jsx           Proposer un échange
  app.jsx               <App> — routing & state, monte sur #root
vendor/
  react.development.js
  react-dom.development.js
  babel.standalone.js
assets/
  fonts/                Polices woff2 self-hostées
```

## Convention de chargement

Pas de bundler, pas d'`import`. Les fichiers `.jsx` sont des `<script type="text/babel">` ; Babel les transpile dans le navigateur. Chaque déclaration au top-level (`function`, `const`, `let`) devient accessible aux scripts qui suivent — c'est pour ça que l'ordre dans `index.html` compte : `card.jsx` avant `screens/*`, `app.jsx` en dernier.

`data.js` expose tout sous `window.StockDex` plutôt que de polluer le scope global.
