-- Schéma de référence — la base réelle vit dans data/stockdex.db.
-- Le fichier db/seed.js applique ce schéma puis injecte les 40 sociétés.
--
-- Le champ `ticker` est la clé fonctionnelle utilisée par le frontend
-- (TTE, MC, ASML…). L'id numérique reste la clé primaire en interne.

CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    coins           INTEGER NOT NULL DEFAULT 0,
    gems            INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker          TEXT    NOT NULL UNIQUE,
    name            TEXT    NOT NULL,
    family          TEXT    NOT NULL CHECK (family IN ('energie', 'luxe', 'tech', 'pharma', 'finance')),
    rarity          TEXT    NOT NULL CHECK (rarity IN ('C', 'R', 'UR', 'L')),
    base_price      INTEGER NOT NULL,
    current_price   INTEGER NOT NULL,
    mcap            INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS owned_cards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    card_id         INTEGER NOT NULL,
    acquired_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    acquired_price  INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Marketplace : un joueur publie UNE carte (une instance précise de
-- owned_cards) à un prix en CR. N'importe quel autre joueur peut l'acheter.
-- Pas de système d'échange — uniquement vente directe en CR.
CREATE TABLE IF NOT EXISTS market_listings (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id           INTEGER NOT NULL,
    card_instance_id    INTEGER NOT NULL,
    price_cr            INTEGER NOT NULL CHECK (price_cr >= 0),
    status              TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sold', 'cancelled')),
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    resolved_at         TEXT,
    FOREIGN KEY (seller_id)        REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (card_instance_id) REFERENCES owned_cards(id) ON DELETE CASCADE
);

-- Une carte ne peut être listée qu'UNE seule fois en statut 'open' à la fois.
-- L'index partiel permet d'annuler puis re-lister la même carte (un seul
-- statut 'open' par instance).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_market_listings_open
    ON market_listings(card_instance_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS price_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id         INTEGER NOT NULL,
    price           INTEGER NOT NULL,
    recorded_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cards_family             ON cards(family);
CREATE INDEX IF NOT EXISTS idx_cards_rarity             ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_owned_cards_user         ON owned_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_owned_cards_card         ON owned_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_seller   ON market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_status   ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_price_history_card_time  ON price_history(card_id, recorded_at);
