// StockDex — card data
// Real ticker symbols (publicly available), original abstract emblems & art.
// No copyrighted logos are reproduced.

const SECTORS = {
  energie:  { id: 'energie',  label: 'Énergie',  short: 'ENR', tint: '#ff7a3c', glyph: 'flame' },
  luxe:     { id: 'luxe',     label: 'Luxe',     short: 'LUX', tint: '#c084fc', glyph: 'diamond' },
  tech:     { id: 'tech',     label: 'Tech',     short: 'TEC', tint: '#38bdf8', glyph: 'grid' },
  pharma:   { id: 'pharma',   label: 'Pharma',   short: 'PHA', tint: '#4ade80', glyph: 'cross' },
  finance:  { id: 'finance',  label: 'Finance',  short: 'FIN', tint: '#818cf8', glyph: 'column' },
};

// Rarity tiers
const RARITY = {
  C:  { id: 'C',  label: 'Commun',      stars: 1, weight: 60, color: '#8a8170', holo: 0.0 },
  R:  { id: 'R',  label: 'Rare',        stars: 2, weight: 25, color: '#c9b27a', holo: 0.3 },
  UR: { id: 'UR', label: 'Ultra-Rare',  stars: 3, weight: 12, color: '#e6c878', holo: 0.7 },
  L:  { id: 'L',  label: 'Légendaire',  stars: 4, weight: 3,  color: '#fff1b8', holo: 1.0 },
};

// Companies — { ticker, name, sector, mcap (€B), basePts, rarity }
// Rarity mostly maps to market cap with some volatility flavor.
const COMPANIES = [
  // ENERGIE
  { ticker: 'TTE',  name: 'TotalEnergies',     sector: 'energie', mcap: 148, basePts: 2400, rarity: 'UR' },
  { ticker: 'SHEL', name: 'Shell',             sector: 'energie', mcap: 215, basePts: 2800, rarity: 'UR' },
  { ticker: 'BP',   name: 'BP',                sector: 'energie', mcap:  88, basePts: 1600, rarity: 'R'  },
  { ticker: 'ENI',  name: 'Eni',               sector: 'energie', mcap:  48, basePts:  900, rarity: 'R'  },
  { ticker: 'ENGI', name: 'Engie',             sector: 'energie', mcap:  37, basePts:  720, rarity: 'C'  },
  { ticker: 'EDF',  name: 'Électricité de Fr.',sector: 'energie', mcap:  52, basePts:  960, rarity: 'R'  },
  { ticker: 'EQNR', name: 'Equinor',           sector: 'energie', mcap:  82, basePts: 1500, rarity: 'R'  },
  { ticker: 'REP',  name: 'Repsol',            sector: 'energie', mcap:  18, basePts:  420, rarity: 'C'  },

  // LUXE
  { ticker: 'MC',   name: 'LVMH',              sector: 'luxe',    mcap: 372, basePts: 4800, rarity: 'L'  },
  { ticker: 'RMS',  name: 'Hermès',            sector: 'luxe',    mcap: 235, basePts: 3900, rarity: 'L'  },
  { ticker: 'KER',  name: 'Kering',            sector: 'luxe',    mcap:  44, basePts: 1100, rarity: 'R'  },
  { ticker: 'CFR',  name: 'Richemont',         sector: 'luxe',    mcap:  82, basePts: 1700, rarity: 'UR' },
  { ticker: 'MONC', name: 'Moncler',           sector: 'luxe',    mcap:  16, basePts:  520, rarity: 'C'  },
  { ticker: 'BRBY', name: 'Burberry',          sector: 'luxe',    mcap:   9, basePts:  340, rarity: 'C'  },
  { ticker: 'OR',   name: 'L\u2019Oréal',      sector: 'luxe',    mcap: 218, basePts: 3200, rarity: 'UR' },
  { ticker: 'EL',   name: 'EssilorLuxottica',  sector: 'luxe',    mcap:  98, basePts: 1900, rarity: 'R'  },

  // TECH
  { ticker: 'ASML', name: 'ASML Holding',      sector: 'tech',    mcap: 310, basePts: 4400, rarity: 'L'  },
  { ticker: 'SAP',  name: 'SAP',               sector: 'tech',    mcap: 232, basePts: 3500, rarity: 'UR' },
  { ticker: 'DSY',  name: 'Dassault Systèmes', sector: 'tech',    mcap:  46, basePts: 1200, rarity: 'R'  },
  { ticker: 'CAP',  name: 'Capgemini',         sector: 'tech',    mcap:  29, basePts:  680, rarity: 'C'  },
  { ticker: 'STM',  name: 'STMicroelectronics',sector: 'tech',    mcap:  22, basePts:  560, rarity: 'C'  },
  { ticker: 'NXI',  name: 'Nexi',              sector: 'tech',    mcap:   7, basePts:  280, rarity: 'C'  },
  { ticker: 'ATCO', name: 'Atlas Copco',       sector: 'tech',    mcap:  68, basePts: 1400, rarity: 'R'  },
  { ticker: 'WCH',  name: 'Wacker Chemie',     sector: 'tech',    mcap:  12, basePts:  380, rarity: 'C'  },

  // PHARMA
  { ticker: 'NOVN', name: 'Novartis',          sector: 'pharma',  mcap: 230, basePts: 3300, rarity: 'UR' },
  { ticker: 'ROG',  name: 'Roche Holding',     sector: 'pharma',  mcap: 245, basePts: 3500, rarity: 'L'  },
  { ticker: 'AZN',  name: 'AstraZeneca',       sector: 'pharma',  mcap: 198, basePts: 2900, rarity: 'UR' },
  { ticker: 'SAN',  name: 'Sanofi',            sector: 'pharma',  mcap: 122, basePts: 2100, rarity: 'R'  },
  { ticker: 'GSK',  name: 'GSK',               sector: 'pharma',  mcap:  72, basePts: 1400, rarity: 'R'  },
  { ticker: 'BAYN', name: 'Bayer',             sector: 'pharma',  mcap:  28, basePts:  640, rarity: 'C'  },
  { ticker: 'NOVO', name: 'Novo Nordisk',      sector: 'pharma',  mcap: 415, basePts: 5200, rarity: 'L'  },
  { ticker: 'MRK',  name: 'Merck KGaA',        sector: 'pharma',  mcap:  68, basePts: 1300, rarity: 'R'  },

  // FINANCE
  { ticker: 'BNP',  name: 'BNP Paribas',       sector: 'finance', mcap:  78, basePts: 1500, rarity: 'R'  },
  { ticker: 'CS',   name: 'AXA',               sector: 'finance', mcap:  74, basePts: 1450, rarity: 'R'  },
  { ticker: 'GLE',  name: 'Société Générale',  sector: 'finance', mcap:  20, basePts:  480, rarity: 'C'  },
  { ticker: 'ACA',  name: 'Crédit Agricole',   sector: 'finance', mcap:  42, basePts:  920, rarity: 'C'  },
  { ticker: 'DBK',  name: 'Deutsche Bank',     sector: 'finance', mcap:  31, basePts:  720, rarity: 'C'  },
  { ticker: 'UBS',  name: 'UBS Group',         sector: 'finance', mcap: 106, basePts: 1900, rarity: 'UR' },
  { ticker: 'HSBA', name: 'HSBC Holdings',     sector: 'finance', mcap: 160, basePts: 2600, rarity: 'UR' },
  { ticker: 'INGA', name: 'ING Groep',         sector: 'finance', mcap:  48, basePts: 1050, rarity: 'R'  },
];

// Deterministic pseudo-random from string seed
function seedRand(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

// Generate a 30-point sparkline normalized to a base price
function makeHistory(ticker, basePts, volatility = 0.025) {
  const rand = seedRand(ticker + 'hist');
  const pts = [];
  let v = basePts;
  for (let i = 0; i < 30; i++) {
    const drift = (rand() - 0.48) * volatility * v;
    v = Math.max(basePts * 0.5, v + drift);
    pts.push(v);
  }
  return pts;
}

// Build the live card dataset with prices, variations, history
function buildDataset(seed = 'today') {
  return COMPANIES.map(c => {
    const rand = seedRand(c.ticker + seed);
    const vol = c.sector === 'tech' ? 0.035 : c.sector === 'pharma' ? 0.018 : c.sector === 'energie' ? 0.028 : c.sector === 'finance' ? 0.022 : 0.020;
    const history = makeHistory(c.ticker, c.basePts, vol);
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    const variation = ((last - prev) / prev) * 100;
    const variation7d = ((last - history[history.length - 8]) / history[history.length - 8]) * 100;
    return {
      ...c,
      history,
      value: Math.round(last),
      variation,            // daily %
      variation7d,
      high: Math.round(Math.max(...history.slice(-7))),
      low:  Math.round(Math.min(...history.slice(-7))),
      sectorMeta: SECTORS[c.sector],
      rarityMeta: RARITY[c.rarity],
    };
  });
}

// Pre-built sets (one per sector)
const SETS = Object.values(SECTORS).map(s => ({
  id: s.id,
  label: `Set ${s.label}`,
  short: s.short,
  edition: 'Édition Première',
  totalCards: COMPANIES.filter(c => c.sector === s.id).length,
  tint: s.tint,
}));

// Booster open — return 5 cards from a given set (or mixed) following weighted rarities.
function rollBooster(allCards, setId) {
  const pool = setId === 'mix' ? allCards : allCards.filter(c => c.sector === setId);
  // Slot strategy: 3 commons (or fillers), 1 rare-or-better, 1 hit (UR/L preferred)
  const byRarity = {
    C:  pool.filter(c => c.rarity === 'C'),
    R:  pool.filter(c => c.rarity === 'R'),
    UR: pool.filter(c => c.rarity === 'UR'),
    L:  pool.filter(c => c.rarity === 'L'),
  };
  const pick = arr => arr.length ? arr[Math.floor(Math.random() * arr.length)] : pool[Math.floor(Math.random() * pool.length)];
  const slots = [
    pick(byRarity.C),
    pick(byRarity.C),
    pick(byRarity.C),
    pick(Math.random() < 0.35 ? byRarity.UR : byRarity.R),
    pick(Math.random() < 0.18 ? byRarity.L : (Math.random() < 0.5 ? byRarity.UR : byRarity.R)),
  ];
  return slots.map((c, i) => ({ ...c, _slot: i }));
}

// Marketplace listings — synthesized
const PLAYERS = ['lévy_quant', 'mme_pinault', 'oda_67', 'bourse_addict', 'gold.heir', 'rive_droite', 'msr.beta', 'la_bourgeoise', 'k_alpha', 'mille_feuille', 'volatility.fan', 'parquet_88'];

function buildMarket(dataset) {
  const rand = seedRand('market');
  const listings = [];
  for (let i = 0; i < 14; i++) {
    const c = dataset[Math.floor(rand() * dataset.length)];
    const mult = 0.82 + rand() * 0.45; // pricing variance
    const price = Math.round(c.value * mult);
    listings.push({
      id: 'L' + (1000 + i),
      card: c,
      seller: PLAYERS[Math.floor(rand() * PLAYERS.length)],
      price,
      mode: rand() < 0.55 ? 'sale' : 'trade',
      wants: rand() < 0.55 ? null : ['Pharma', 'Finance', 'Tech', 'Luxe', 'Énergie'][Math.floor(rand() * 5)],
      time: ['il y a 2 min', 'il y a 14 min', 'il y a 1 h', 'il y a 3 h', 'il y a 6 h', 'il y a 12 h'][Math.floor(rand() * 6)],
    });
  }
  return listings;
}

window.StockDex = { SECTORS, RARITY, COMPANIES, SETS, buildDataset, rollBooster, buildMarket, PLAYERS };
