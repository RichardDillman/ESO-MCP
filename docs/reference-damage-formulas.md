# ESO Damage Calculation Reference

> **Last Updated**: November 2024
> **Game Version**: Update 43+ (Gold Road)
> **Sources**: Skinnycheeks, Hyperioxes (actively maintained community calculators)

## Quick Reference

| Stat | Rating per 1% | Goal | Hard Cap |
|------|---------------|------|----------|
| Critical Chance | 219.12 | 100% | None |
| Critical Damage | N/A | 125% bonus | **125% bonus** (2.25x max) |
| Penetration | 500 | 18,200 (PvE) | Enemy resistance |

---

## Base Damage Formula

```
BaseDamage = Coefficient × ((MaxResource / 10.5) + WeaponDamage)
```

**The 10.5 Ratio**: 105 max resource contributes the same damage as 10 weapon/spell damage.

### Example
- 40,000 max magicka / 10.5 = 3,810 effective damage
- 5,000 spell damage = 5,000 effective damage
- Total effective damage: 8,810

---

## Critical Strike

### Critical Chance
```
CritChance% = 10 + (CritRating / 219.12)
```

- **Base**: 10% critical chance
- **Rating**: 219.12 rating = 1% additional crit chance
- **No cap**: Can exceed 100% (soft cap at 100% effective)
- **Goal**: 100% critical chance

### Critical Damage
```
CritMultiplier = 1 + (50 + BonusCritDamage) / 100
```

- **Base**: 50% bonus damage on crits (1.5x multiplier)
- **HARD CAP**: 125% bonus damage (2.25x multiplier maximum)
- Any bonus crit damage over 125% is **wasted**

### Expected Crit Factor
```
ExpectedCritFactor = (1 - CritChance) + (CritChance × CritMultiplier)
```

Example at 60% crit chance with 75% bonus crit damage:
- CritMultiplier = 1 + (50 + 75) / 100 = 1.75
- ExpectedCritFactor = 0.4 + (0.6 × 1.75) = 1.45 (45% more damage on average)

---

## Penetration

### Formula
```
PenetrationMultiplier = 1 - ((TargetResistance - Penetration) / 50000)
DamageLost% = (TargetResistance - Penetration) / 500
```

- **500 penetration = 1% more damage** (when under cap)
- Cannot reduce enemy resistance below 0

### Enemy Resistance Values

| Content Type | Resistance |
|--------------|------------|
| Overland (delves, public dungeons) | 9,100 |
| Veteran Maelstrom Arena | 12,100 |
| Dungeons, Trials, World Bosses | **18,200** |
| Overland Dragons | 13,650 |

### Group-Provided Penetration

In organized groups, tanks/supports provide:

| Source | Penetration |
|--------|-------------|
| Major Breach | 5,948 |
| Minor Breach | 2,974 |
| Crusher Enchant | 2,108 |
| Alkosh | 6,000 |
| **Typical Group Total** | ~17,030 |

**DPS Personal Pen Needed**: ~1,170 to cap in a well-organized group

---

## Full Damage Formula

```
FinalDamage = Base × (1 + DamageDone) × (1 + DamageToMonsters) × (1 + DamageTaken) × PenMultiplier × CritFactor
```

### Multiplier Categories

Buffs are **additive within categories** but **multiplicative between categories**:

1. **Damage Done** (your buffs)
   - Major Berserk (+10%)
   - Minor Berserk (+5%)
   - Empower (+80% light/heavy attacks)

2. **Damage to Monsters** (CP passives)
   - Fighter's Finesse
   - Biting Aura
   - Etc.

3. **Damage Taken** (target debuffs)
   - Minor Vulnerability (+5%)
   - Major Vulnerability (+10%)
   - Cephaliarch's Flail (+5%)

4. **Penetration** (armor bypass)

5. **Critical** (crit chance × crit multiplier)

---

## Status Effect Proc Chance

```
ProcChance = BaseChance × (1 + TotalBonus / 100)
```

Capped at 100%. Modifiers include:
- Champion Points: +60%
- Charged trait
- Elemental Force passive
- Class-specific bonuses

---

## Verified Sources

These formulas are from actively maintained community resources:

- [Skinnycheeks Simple Damage Calculator](https://www.skinnycheeks.gg/simple-damage-calculator)
- [Skinnycheeks Status Effect Calculator](https://www.skinnycheeks.gg/status-effect-calculator)
- [Skinnycheeks Crit/Penetration Guide](https://www.skinnycheeks.gg/crit-damage-and-penetration)
- [Hyperioxes Penetration Calculator](https://hyperioxes.com/eso/tools/penetration-calculator)
- [Hyperioxes Beam Build Guide](https://hyperioxes.com/eso/dps/beam-build)
- [UESP Wiki - Penetration](https://en.uesp.net/wiki/Online:Penetration) (updated Jan 2025)

---

## Implementation

These formulas are implemented in `src/utils/dps-calculator.ts`:

```typescript
import {
  // Constants
  CRIT_CHANCE_RATING_PER_PERCENT,  // 219.12
  PENETRATION_RATING_PER_PERCENT,   // 500
  BASE_CRIT_DAMAGE_BONUS,           // 50
  CRIT_DAMAGE_BONUS_HARD_CAP,       // 125
  RESOURCE_TO_DAMAGE_RATIO,         // 10.5
  ENEMY_RESISTANCE,                 // { OVERLAND, DUNGEON_TRIAL, etc. }
  GROUP_PENETRATION,                // { MAJOR_BREACH, MINOR_BREACH, etc. }

  // Functions
  calculatePenetrationFactor,
  calculateDamageLostFromPenetration,
  calculatePenetrationNeeded,
  calculateCritChance,
  calculateCritDamageMultiplier,
  calculateCritFactor,
  calculateWastedCritDamage,
  calculateAbilityBaseDamage,
  calculateEffectiveDamageStat,
  calculateAbilityDamage,
} from './utils/dps-calculator';
```
