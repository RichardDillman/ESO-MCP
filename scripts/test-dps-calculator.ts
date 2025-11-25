import {
  calculateAbilityDamage,
  calculatePenetrationFactor,
  calculateCritFactor,
  LIGHT_ATTACK_DUAL_WIELD,
  FATECARVER_TICK,
  type CharacterStats,
  type AbilityInfo,
} from '../src/utils/dps-calculator.js';

console.log('=== ESO DPS Calculator Tests ===\n');

// Test 1: Penetration Example from ESO_DPS_Math.md
console.log('Test 1: Penetration Calculation');
console.log('Target resist: 18,200, Your pen: 10,000');
const penFactor = calculatePenetrationFactor(18200, 10000);
console.log(`Penetration Factor: ${(penFactor * 100).toFixed(2)}%`);
console.log(`Expected: ~86% damage (from docs)`);
console.log(`Match: ${Math.abs(penFactor - 0.86) < 0.01 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Crit Example from ESO_DPS_Math.md
console.log('Test 2: Critical Strike Calculation');
console.log('50% crit, 180% crit damage (1.80x multiplier)');
const critFactor = calculateCritFactor(2190 * 0.50, 180); // 1095 rating = 50% crit
console.log(`Crit Factor: ${critFactor.toFixed(2)}`);
console.log(`Expected: 1.40 (from docs)`);
console.log(`Match: ${Math.abs(critFactor - 1.40) < 0.01 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: Light Attack Damage (Dual Wield)
console.log('Test 3: Light Attack Damage');
const testStats: CharacterStats = {
  weaponDamage: 3000,
  maxStamina: 30000,
  weaponCritical: 3000, // ~13.7% crit chance (3000/2190 = 1.37)
  criticalDamage: 175, // 1.75x total multiplier (base 1.5 + 25% bonus)
  penetration: 10000,
  damageDoneBonus: 0.20, // 20% damage done
};

const lightAttackResult = calculateAbilityDamage(
  LIGHT_ATTACK_DUAL_WIELD,
  testStats,
  { resistance: 18200 }
);

console.log(`Base Damage: ${lightAttackResult.baseDamage.toFixed(2)}`);
console.log(`With Additive (${(testStats.damageDoneBonus! * 100).toFixed(0)}%): ${lightAttackResult.withAdditive.toFixed(2)}`);
console.log(`With Penetration (86%): ${lightAttackResult.withPenetration.toFixed(2)}`);
console.log(`With Crit: ${lightAttackResult.withCrit.toFixed(2)}`);
console.log(`Final Damage: ${lightAttackResult.finalDamage.toFixed(2)}\n`);

// Test 4: Fatecarver Tick
console.log('Test 4: Fatecarver Tick Damage');
const mageStats: CharacterStats = {
  spellDamage: 4000,
  maxMagicka: 42000,
  spellCritical: 2500,
  criticalDamage: 180, // 1.80x total multiplier
  penetration: 15000,
  damageDoneBonus: 0.25,
};

const fatecarverResult = calculateAbilityDamage(
  FATECARVER_TICK,
  mageStats,
  { resistance: 18200 }
);

console.log(`Base Damage per Tick: ${fatecarverResult.baseDamage.toFixed(2)}`);
console.log(`Final Damage per Tick: ${fatecarverResult.finalDamage.toFixed(2)}`);
console.log(`DPS (if 1 tick per second): ${fatecarverResult.dps?.toFixed(2) || 'N/A'}`);
console.log();

// Test 5: Full calculation breakdown
console.log('Test 5: Full Damage Breakdown');
console.log('Breakdown:', JSON.stringify(lightAttackResult.breakdown, null, 2));
console.log();

// Test 6: Verify formulas match ESO_DPS_Math.md
console.log('Test 6: Formula Verification');
console.log('Ability Scaling: AbilityDamage = (Coefficient × Weapon/Spell Damage) + (MaxResource / 10.5)');
const manualBase = (LIGHT_ATTACK_DUAL_WIELD.coefficient * testStats.weaponDamage!) + (testStats.maxStamina! / 10.5);
console.log(`Manual calculation: ${manualBase.toFixed(2)}`);
console.log(`Calculator result: ${lightAttackResult.baseDamage.toFixed(2)}`);
console.log(`Match: ${Math.abs(manualBase - lightAttackResult.baseDamage) < 0.01 ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('=== All Tests Complete ===');
