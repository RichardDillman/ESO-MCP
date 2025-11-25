/**
 * ESO DPS Calculator
 * Based on ESO_DPS_Math.md
 */

export interface CharacterStats {
  weaponDamage?: number;
  spellDamage?: number;
  maxMagicka?: number;
  maxStamina?: number;
  maxHealth?: number;
  weaponCritical?: number;
  spellCritical?: number;
  criticalDamage?: number; // TOTAL multiplier as percentage (e.g., 180 for 1.80x crit damage)
  penetration?: number;
  damageDoneBonus?: number; // Sum of additive %damage bonuses (as decimal, e.g., 0.25 for 25%)
}

export interface TargetStats {
  resistance?: number; // Default 18200
}

export interface AbilityInfo {
  coefficient: number; // e.g., 0.94 for light attack, 0.168 for Fatecarver per tick
  resourceScaling?: 'magicka' | 'stamina' | 'health'; // Which max resource to use
  isDOT?: boolean;
  tickCount?: number; // For DOTs
  duration?: number; // In seconds
  castTime?: number; // In seconds
  isLightAttack?: boolean;
  isHeavyAttack?: boolean;
}

export interface DamageResult {
  baseDamage: number;
  withAdditive: number;
  withPenetration: number;
  withCrit: number;
  finalDamage: number;
  dps?: number;
  breakdown: {
    baseValue: number;
    coefficient: number;
    additiveBonuses: number;
    penetrationFactor: number;
    critFactor: number;
    vulnerabilityFactor: number;
  };
}

/**
 * Calculate penetration factor based on target resistance and character penetration
 * Formula: Mitigation = Resistance / (50000 + Resistance)
 * DamageTakenMultiplier = 1 − Mitigation
 */
export function calculatePenetrationFactor(
  targetResistance: number,
  characterPenetration: number
): number {
  const effectiveResistance = Math.max(0, targetResistance - characterPenetration);
  const mitigation = effectiveResistance / (50000 + effectiveResistance);
  return 1 - mitigation;
}

/**
 * Calculate expected critical strike factor
 * CritChance = WeaponCritical / 2190
 * CritDamageMultiplier = provided criticalDamagePercent as total multiplier (e.g., 180 for 1.80x)
 * ExpectedCritFactor = (1 − CritChance) × 1 + CritChance × CritDamageMultiplier
 *
 * Note: criticalDamagePercent should be the TOTAL multiplier as percentage
 * e.g., 180 for 1.80x crit multiplier (which is base 1.5 + 30% bonus)
 */
export function calculateCritFactor(
  criticalRating: number,
  criticalDamagePercent: number
): number {
  // CritChance = WeaponCritical / 2190
  // Example: 1095 rating = 50% crit chance = 0.5
  const critChance = Math.min(1.0, criticalRating / 2190);
  // criticalDamagePercent is the total multiplier (e.g., 180 = 1.80x damage)
  const critDamageMultiplier = criticalDamagePercent / 100;
  return (1 - critChance) * 1 + critChance * critDamageMultiplier;
}

/**
 * Calculate base ability damage
 * AbilityDamage = (Coefficient × Weapon/Spell Damage) + (MaxResource / 10.5)
 */
export function calculateAbilityBaseDamage(
  ability: AbilityInfo,
  stats: CharacterStats
): number {
  // Determine which damage stat to use
  const damageSource = ability.resourceScaling === 'stamina'
    ? (stats.weaponDamage || 0)
    : (stats.spellDamage || 0);

  // Determine max resource
  let maxResource = 0;
  if (ability.resourceScaling === 'magicka') {
    maxResource = stats.maxMagicka || 0;
  } else if (ability.resourceScaling === 'stamina') {
    maxResource = stats.maxStamina || 0;
  } else if (ability.resourceScaling === 'health') {
    maxResource = stats.maxHealth || 0;
  }

  const baseDamage = (ability.coefficient * damageSource) + (maxResource / 10.5);

  // For DOTs, multiply by tick count
  if (ability.isDOT && ability.tickCount) {
    return baseDamage * ability.tickCount;
  }

  return baseDamage;
}

/**
 * Calculate final damage for an ability
 * FinalDamage = (Base × Coef × (1 + additive bonuses)) × (Pen factor) × (Crit factor) × (Vulnerability) × (Special multipliers)
 */
export function calculateAbilityDamage(
  ability: AbilityInfo,
  characterStats: CharacterStats,
  targetStats: TargetStats = {},
  options: {
    vulnerabilityMultiplier?: number; // Default 1.0
    specialMultipliers?: number[]; // Additional multiplicative factors
  } = {}
): DamageResult {
  const {
    vulnerabilityMultiplier = 1.0,
    specialMultipliers = [],
  } = options;

  // Step 1: Calculate base damage
  const baseDamage = calculateAbilityBaseDamage(ability, characterStats);

  // Step 2: Apply additive bonuses
  const additiveBonuses = characterStats.damageDoneBonus || 0;
  const withAdditive = baseDamage * (1 + additiveBonuses);

  // Step 3: Apply penetration
  const targetResistance = targetStats.resistance || 18200;
  const characterPenetration = characterStats.penetration || 0;
  const penetrationFactor = calculatePenetrationFactor(targetResistance, characterPenetration);
  const withPenetration = withAdditive * penetrationFactor;

  // Step 4: Apply critical strike
  const criticalRating = ability.resourceScaling === 'stamina'
    ? (characterStats.weaponCritical || 0)
    : (characterStats.spellCritical || 0);
  const critFactor = calculateCritFactor(criticalRating, characterStats.criticalDamage || 0);
  const withCrit = withPenetration * critFactor;

  // Step 5: Apply vulnerability and special multipliers
  let finalDamage = withCrit * vulnerabilityMultiplier;
  for (const multiplier of specialMultipliers) {
    finalDamage *= multiplier;
  }

  // Calculate DPS if duration is provided
  let dps: number | undefined;
  if (ability.duration && ability.duration > 0) {
    dps = finalDamage / ability.duration;
  } else if (ability.castTime && ability.castTime > 0) {
    dps = finalDamage / ability.castTime;
  }

  return {
    baseDamage,
    withAdditive,
    withPenetration,
    withCrit,
    finalDamage,
    dps,
    breakdown: {
      baseValue: baseDamage,
      coefficient: ability.coefficient,
      additiveBonuses,
      penetrationFactor,
      critFactor,
      vulnerabilityFactor: vulnerabilityMultiplier,
    },
  };
}

/**
 * Rotation step for DPS calculation
 */
export interface RotationStep {
  skillId?: string;
  abilityInfo: AbilityInfo;
  castTime: number; // Time to cast in seconds
  cooldown?: number; // Cooldown in seconds (if applicable)
}

/**
 * Calculate DPS for a full rotation
 */
export function calculateRotationDPS(
  rotation: RotationStep[],
  characterStats: CharacterStats,
  targetStats: TargetStats = {},
  options: {
    vulnerabilityMultiplier?: number;
    specialMultipliers?: number[];
    rotationDuration?: number; // Total rotation time in seconds
  } = {}
): {
  totalDamage: number;
  rotationTime: number;
  dps: number;
  stepBreakdown: Array<{
    step: number;
    damage: number;
    time: number;
  }>;
} {
  let totalDamage = 0;
  let totalTime = 0;
  const stepBreakdown: Array<{ step: number; damage: number; time: number }> = [];

  for (let i = 0; i < rotation.length; i++) {
    const step = rotation[i];
    const result = calculateAbilityDamage(
      step.abilityInfo,
      characterStats,
      targetStats,
      options
    );

    totalDamage += result.finalDamage;
    totalTime += step.castTime;

    stepBreakdown.push({
      step: i + 1,
      damage: result.finalDamage,
      time: step.castTime,
    });
  }

  // Use provided rotation duration or calculated time
  const rotationTime = options.rotationDuration || totalTime;
  const dps = rotationTime > 0 ? totalDamage / rotationTime : 0;

  return {
    totalDamage,
    rotationTime,
    dps,
    stepBreakdown,
  };
}

/**
 * Compare two rotations
 */
export function compareRotations(
  rotation1: RotationStep[],
  rotation2: RotationStep[],
  characterStats: CharacterStats,
  targetStats: TargetStats = {},
  options: {
    vulnerabilityMultiplier?: number;
    specialMultipliers?: number[];
  } = {}
): {
  rotation1DPS: number;
  rotation2DPS: number;
  difference: number;
  percentChange: number;
} {
  const result1 = calculateRotationDPS(rotation1, characterStats, targetStats, options);
  const result2 = calculateRotationDPS(rotation2, characterStats, targetStats, options);

  const difference = result2.dps - result1.dps;
  const percentChange = result1.dps > 0 ? (difference / result1.dps) * 100 : 0;

  return {
    rotation1DPS: result1.dps,
    rotation2DPS: result2.dps,
    difference,
    percentChange,
  };
}

/**
 * Helper: Calculate damage per cast for light/heavy attacks
 */
export const LIGHT_ATTACK_DUAL_WIELD: AbilityInfo = {
  coefficient: 0.94,
  resourceScaling: 'stamina',
  isLightAttack: true,
  castTime: 1.0,
};

export const FATECARVER_TICK: AbilityInfo = {
  coefficient: 0.168,
  resourceScaling: 'magicka',
  isDOT: false, // Handle per-tick
  castTime: 0.2, // Per tick
};

export const STAMPEDE_INITIAL: AbilityInfo = {
  coefficient: 1.05,
  resourceScaling: 'stamina',
  castTime: 1.0,
};
