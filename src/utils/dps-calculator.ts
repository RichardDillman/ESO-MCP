/**
 * ESO DPS Calculator
 *
 * Formulas verified from Skinnycheeks and Hyperioxes calculators (current as of 2024/2025)
 * Sources:
 * - https://www.skinnycheeks.gg/simple-damage-calculator
 * - https://www.skinnycheeks.gg/status-effect-calculator
 * - https://hyperioxes.com/eso/tools/penetration-calculator
 * - https://hyperioxes.com/eso/dps/beam-build
 */

// =============================================================================
// CONSTANTS - Verified current values
// =============================================================================

/** Rating required for 1% Critical Chance */
export const CRIT_CHANCE_RATING_PER_PERCENT = 219.12;

/** Rating required for 1% Penetration effectiveness (500 pen = 1% more damage vs 18200 target) */
export const PENETRATION_RATING_PER_PERCENT = 500;

/** Base Critical Damage bonus (before any additional sources) */
export const BASE_CRIT_DAMAGE_BONUS = 50; // 50% bonus = 1.5x multiplier

/** Hard cap on Critical Damage bonus (NOT the multiplier, the bonus portion) */
export const CRIT_DAMAGE_BONUS_HARD_CAP = 125; // 125% bonus = 2.25x multiplier max

/** Base Critical Chance (before any rating) */
export const BASE_CRIT_CHANCE = 10; // 10%

/** Resource to Damage conversion ratio */
export const RESOURCE_TO_DAMAGE_RATIO = 10.5; // 105 max resource ≈ 10 weapon/spell damage

/** Standard enemy resistance values by content type */
export const ENEMY_RESISTANCE = {
  OVERLAND: 9100,        // Overland mobs, delves, public dungeons
  MAELSTROM: 12100,      // Veteran Maelstrom Arena
  DUNGEON_TRIAL: 18200,  // Dungeons, trials, world bosses (PvE cap)
  DRAGON: 13650,         // Overland dragons
} as const;

/** Standard group-provided penetration (from tanks/supports) */
export const GROUP_PENETRATION = {
  MAJOR_BREACH: 5948,
  MINOR_BREACH: 2974,
  CRUSHER_ENCHANT: 2108,
  ALKOSH: 6000,
  CRIMSON_OATH: 3541,
  TREMORSCALE: 2640,
} as const;

/** Total group penetration in a well-organized group */
export const TYPICAL_GROUP_PEN =
  GROUP_PENETRATION.MAJOR_BREACH +
  GROUP_PENETRATION.MINOR_BREACH +
  GROUP_PENETRATION.CRUSHER_ENCHANT +
  GROUP_PENETRATION.ALKOSH; // ~17,030

// =============================================================================
// INTERFACES
// =============================================================================

export interface CharacterStats {
  weaponDamage?: number;
  spellDamage?: number;
  maxMagicka?: number;
  maxStamina?: number;
  maxHealth?: number;
  weaponCritical?: number;      // Critical rating (not percentage)
  spellCritical?: number;       // Critical rating (not percentage)
  criticalDamage?: number;      // Bonus crit damage as percentage (e.g., 75 for 75% bonus). Hard cap: 125%
  penetration?: number;
  damageDoneBonus?: number;     // Sum of additive %damage bonuses (as decimal, e.g., 0.25 for 25%)
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

// =============================================================================
// PENETRATION CALCULATIONS
// =============================================================================

/**
 * Calculate penetration factor based on target resistance and character penetration
 *
 * Formula (from Skinnycheeks): PenMultiplier = 1 - ((TargetResistance - Penetration) / 50000)
 * - Every 500 penetration = 1% more damage (when under cap)
 * - Cannot reduce enemy resistance below 0
 *
 * @param targetResistance - Enemy's armor/spell resistance (default: 18200 for dungeon/trial)
 * @param characterPenetration - Your total penetration (personal + group debuffs)
 * @returns Damage multiplier (1.0 = no mitigation, 0.636 = 36.4% mitigation at 0 pen vs 18200)
 */
export function calculatePenetrationFactor(
  targetResistance: number,
  characterPenetration: number
): number {
  const effectiveResistance = Math.max(0, targetResistance - characterPenetration);
  // Skinnycheeks formula: 1 - (effectiveResistance / 50000)
  return 1 - (effectiveResistance / 50000);
}

/**
 * Calculate damage lost due to incomplete penetration
 * Formula: DamageLost% = (TargetResistance - TotalPenetration) / 500
 *
 * @returns Percentage of damage being lost (0-36.4% for 18200 resistance)
 */
export function calculateDamageLostFromPenetration(
  targetResistance: number,
  characterPenetration: number
): number {
  const effectiveResistance = Math.max(0, targetResistance - characterPenetration);
  return effectiveResistance / PENETRATION_RATING_PER_PERCENT;
}

/**
 * Calculate how much penetration you need to reach the cap
 *
 * @param targetResistance - Enemy resistance to overcome
 * @param currentPenetration - Your current total penetration
 * @param groupPenetration - Penetration provided by group (debuffs, etc.)
 * @returns Penetration needed to cap, or negative if over-penetrating
 */
export function calculatePenetrationNeeded(
  targetResistance: number = ENEMY_RESISTANCE.DUNGEON_TRIAL,
  currentPenetration: number = 0,
  groupPenetration: number = 0
): number {
  const totalPenetration = currentPenetration + groupPenetration;
  return targetResistance - totalPenetration;
}

// =============================================================================
// CRITICAL STRIKE CALCULATIONS
// =============================================================================

/**
 * Convert critical rating to critical chance percentage
 *
 * Formula: CritChance% = BaseCritChance + (CritRating / 219.12)
 * - Base crit chance is 10%
 * - 219.12 rating = 1% additional crit chance
 * - No hard cap on crit chance (goal: 100%)
 *
 * @param criticalRating - Your critical rating from gear/buffs
 * @returns Critical chance as decimal (0.0 to 1.0+)
 */
export function calculateCritChance(criticalRating: number): number {
  const bonusCritChance = criticalRating / CRIT_CHANCE_RATING_PER_PERCENT;
  return (BASE_CRIT_CHANCE + bonusCritChance) / 100;
}

/**
 * Calculate effective critical damage multiplier
 *
 * Formula: CritMultiplier = 1 + (BaseCritBonus + BonusCritDamage) / 100
 * - Base crit damage bonus is 50% (making crits do 1.5x damage)
 * - HARD CAP: 125% bonus (making crits do 2.25x damage max)
 * - Total crit damage = 100% + 50% base + bonus (capped at 125%)
 *
 * @param bonusCritDamage - Additional crit damage bonus from sources (0-125)
 * @returns Crit damage multiplier (1.5 to 2.25)
 */
export function calculateCritDamageMultiplier(bonusCritDamage: number): number {
  // Apply hard cap to bonus crit damage
  const cappedBonus = Math.min(bonusCritDamage, CRIT_DAMAGE_BONUS_HARD_CAP);
  // Total = 100% base + 50% base crit bonus + bonus (up to 125%)
  // But the multiplier is: 1 + (total bonus / 100)
  const totalBonus = BASE_CRIT_DAMAGE_BONUS + cappedBonus;
  return 1 + (totalBonus / 100);
}

/**
 * Calculate expected damage multiplier from critical strikes
 *
 * Formula: ExpectedCritFactor = (1 - CritChance) × 1 + CritChance × CritMultiplier
 * Simplified: 1 + CritChance × (CritMultiplier - 1)
 *
 * @param criticalRating - Your critical rating
 * @param bonusCritDamage - Bonus crit damage percentage (not including base 50%)
 * @returns Expected damage multiplier accounting for crit probability
 */
export function calculateCritFactor(
  criticalRating: number,
  bonusCritDamage: number
): number {
  const critChance = Math.min(1.0, calculateCritChance(criticalRating));
  const critMultiplier = calculateCritDamageMultiplier(bonusCritDamage);
  // Expected value: (1 - critChance) × 1 + critChance × critMultiplier
  return (1 - critChance) + (critChance * critMultiplier);
}

/**
 * Calculate how much crit damage bonus is wasted due to the cap
 *
 * @param bonusCritDamage - Your total bonus crit damage from all sources
 * @returns Amount of crit damage being wasted (0 if under cap)
 */
export function calculateWastedCritDamage(bonusCritDamage: number): number {
  return Math.max(0, bonusCritDamage - CRIT_DAMAGE_BONUS_HARD_CAP);
}

// =============================================================================
// BASE DAMAGE CALCULATIONS
// =============================================================================

/**
 * Calculate base ability damage
 *
 * Formula (from Skinnycheeks): Base = (MaxResource / 10.5) + WeaponDamage
 * With coefficient: AbilityDamage = Coefficient × ((MaxResource / 10.5) + WeaponDamage)
 *
 * The 10.5 ratio means: 105 max resource ≈ 10 weapon/spell damage in contribution
 *
 * @param ability - Ability info with coefficient and scaling
 * @param stats - Character stats
 * @returns Base damage before multipliers
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

  // Skinnycheeks formula: (maxResource / 10.5) + weaponDamage, then × coefficient
  const baseDamage = ability.coefficient * ((maxResource / RESOURCE_TO_DAMAGE_RATIO) + damageSource);

  // For DOTs, multiply by tick count
  if (ability.isDOT && ability.tickCount) {
    return baseDamage * ability.tickCount;
  }

  return baseDamage;
}

/**
 * Calculate "effective damage stat" for build comparison
 * This combines max resource and weapon/spell damage into one comparable number
 *
 * Formula: EffectiveDamage = WeaponDamage + (MaxResource / 10.5)
 */
export function calculateEffectiveDamageStat(
  damageRating: number,
  maxResource: number
): number {
  return damageRating + (maxResource / RESOURCE_TO_DAMAGE_RATIO);
}

// =============================================================================
// FULL DAMAGE CALCULATIONS
// =============================================================================

/**
 * Calculate final damage for an ability
 *
 * Full formula (from Skinnycheeks):
 * FinalDamage = Base × (1 + DamageDone) × (1 + DamageToMonsters) × (1 + DamageTaken) × PenMultiplier × CritFactor
 *
 * Multiplier categories (multiplicative between categories, additive within):
 * 1. Damage Done - your buffs (Major/Minor Berserk, Empower, etc.)
 * 2. Damage to Monsters - CP passives, specific monster bonuses
 * 3. Damage Taken - target debuffs (Minor Vulnerability, etc.)
 * 4. Penetration - armor bypass
 * 5. Critical - crit chance × crit multiplier
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
