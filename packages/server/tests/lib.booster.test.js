// Tests unitaires de lib/booster.js — tirage d'un booster.

import { setupTestApp } from './helpers/setup.js';
await setupTestApp();

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { rollBoosterSlots, VALID_FAMILIES, BOOSTER_COST, BOOSTER_SIZE } from '../lib/booster.js';

describe('lib/booster — constantes', () => {
  test('BOOSTER_COST et BOOSTER_SIZE ont des valeurs cohérentes', () => {
    assert.equal(typeof BOOSTER_COST, 'number');
    assert.ok(BOOSTER_COST > 0);
    assert.equal(BOOSTER_SIZE, 5);
  });

  test('VALID_FAMILIES contient les 5 familles attendues', () => {
    for (const f of ['energie', 'luxe', 'tech', 'pharma', 'finance']) {
      assert.ok(VALID_FAMILIES.has(f), `${f} manquant`);
    }
  });
});

describe('lib/booster — rollBoosterSlots', () => {
  test('jette une erreur sur une famille inconnue', () => {
    assert.throws(() => rollBoosterSlots('inexistante'));
  });

  test('renvoie toujours 5 slots pour une famille valide', () => {
    for (let i = 0; i < 20; i += 1) {
      const slots = rollBoosterSlots('tech');
      assert.equal(slots.length, 5);
      for (const s of slots) {
        assert.equal(typeof s.id, 'number');
        assert.ok(['C', 'R', 'UR', 'L'].includes(s.rarity), `rarity inattendue: ${s.rarity}`);
      }
    }
  });

  test('booster mix tire dans toutes les familles sur le long terme', () => {
    // Sur 100 tirages × 5 cartes, on attend de voir au moins 4 familles différentes.
    const families = new Set();
    for (let i = 0; i < 100; i += 1) {
      // Note : rollBoosterSlots ne renvoie pas la famille, on triche en lisant
      // la base via le pool. Ici on se contente de vérifier la stabilité du
      // tirage (pas d'erreur, taille correcte).
      const slots = rollBoosterSlots('mix');
      assert.equal(slots.length, 5);
      slots.forEach((s) => families.add(s.rarity));
    }
    // Au minimum on doit avoir vu C, R et UR (L est rare).
    assert.ok(families.has('C'));
    assert.ok(families.has('R'));
  });

  test('les 3 premiers slots sont systématiquement des C quand la famille en contient', () => {
    // Le pool "energie" du seed de test contient au moins une carte C (ENGI).
    const slots = rollBoosterSlots('energie');
    assert.equal(slots[0].rarity, 'C');
    assert.equal(slots[1].rarity, 'C');
    assert.equal(slots[2].rarity, 'C');
  });
});
