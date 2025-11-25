# ESO DPS Math (Concise Reference)

## 1. Core Damage Formula
Damage = BaseValue × Coefficient × (1 + Sum of %Damage Bonuses)

## 2. Penetration & Mitigation
- Resist cap: 18,200
Mitigation = Resistance / (50000 + Resistance)
DamageTakenMultiplier = 1 − Mitigation

## 3. Critical Damage
CritChance = WeaponCritical / 2190
CritDamageMultiplier = 1.5 + (Sum of crit dmg bonuses)
ExpectedCritFactor = (1 − CritChance) × 1 + CritChance × CritDamageMultiplier

## 4. Ability Scaling
AbilityDamage = (Coefficient × Weapon/Spell Damage) + (MaxResource / 10.5)

- Light Attack (DW): ~0.94
- Fatecarver (per tick): 0.168
- Stampede: ~1.05 + DOT

DOTs apply coefficient per tick.

## 5. Additive vs Multiplicative
- Additive: class passives, Slayer, %Damage Done CP
- Multiplicative: Penetration, Crit, Vulnerability

FinalDamage =
(Base × Coef × (1 + additive bonuses))
× (Pen factor)
× (Crit factor)
× (Vulnerability)
× (Special multipliers)

## 6. Fatecarver (Arcanist)
TickDamage = (0.168 × Weapon/Spell Damage) + (MaxResource / 10.5)
TotalTicks ≈ 15–17 (Empower / cast speed dependent)

## 7. Penetration Example
Target resist: 18,200
Your pen: 10,000
EffectiveResist = 8,200
Mitigation ≈ 14%
You deal ≈ 86% damage

## 8. Crit Example
50% crit, 80% crit damage → ExpectedCritFactor = 1.40

## 9. DPS Verification Sources
- Combat Metrics (addon)
- UESP Build Editor
- Community theory spreadsheets
