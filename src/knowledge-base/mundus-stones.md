# Mundus Stones Knowledge Base

## Overview

Mundus Stones provide passive buffs to characters. The effectiveness of these buffs scales based on the Divines armor trait.

## Data Structure Complexity

### Key Learnings

1. **Base Effect**: Each mundus stone provides a base effect value (when wearing 0 Divines pieces)
2. **Divines Scaling**: The Divines armor trait **on your gear** increases mundus stone effects
3. **Quality Matters**: The **armor piece quality** (not stone quality) affects the scaling
4. **Multiple Pieces**: You can wear 0-8 pieces of Divines armor (8 if using a shield)

### Divines Trait Mechanics

The Divines trait on armor increases mundus stone effects by a percentage based on armor quality:

| Quality | Divines Bonus Per Piece |
|---------|------------------------|
| Normal | 5.1% |
| Fine | 6.1% |
| Superior | 7.1% |
| Epic | 8.1% |
| Legendary | 9.1% |

### Example: The Apprentice

Base effect: 238 Spell Damage (with 0 Divines pieces)

With 7 pieces of Legendary Divines armor:
- Each piece adds 9.1% to the mundus effect
- Total bonus: 7 × 9.1% = 63.7%
- Final value: 238 × 1.637 = 389 Spell Damage

### Multi-Effect Stones

Some mundus stones provide multiple effects (e.g., The Steed provides both Health Recovery and Movement Speed). Each effect:
- Has its own base value
- Scales independently with Divines
- May use different units (flat values vs percentages)

## Data Structure

```typescript
interface MundusStone {
  name: string;
  effects: MundusEffect[];
  locations: {
    aldmeriDominion: string;
    daggerfallCovenant: string;
    ebonheartPact: string;
    cyrodiil: string;
  };
  url: string;
}

interface MundusEffect {
  type: string; // e.g., "Spell Damage", "Health Recovery"
  baseValue: string | number; // Base value with 0 Divines
  isPercentage: boolean;
  divinesScaling: DivinesScaling[];
}

interface DivinesScaling {
  pieces: number; // 0-8
  normal: number;
  fine: number;
  superior: number;
  epic: number;
  legendary: number;
}
```

## All Mundus Stones

### Single Effect Stones

1. **The Apprentice** - Spell Damage (238 base → 389 with 7 Legendary)
2. **The Atronach** - Magicka Recovery (310 base → 507 with 7 Legendary)
3. **The Lady** - Physical & Spell Resistance (2744 base → 4491 with 7 Legendary)
4. **The Lord** - Maximum Health (2225 base → 3642 with 7 Legendary)
5. **The Lover** - Physical & Spell Penetration (2744 base → 4491 with 7 Legendary)
6. **The Mage** - Maximum Magicka (2023 base → 3311 with 7 Legendary)
7. **The Ritual** - Healing Done (8% base → 13% with 7 Legendary)
8. **The Serpent** - Stamina Recovery (310 base → 507 with 7 Legendary)
9. **The Shadow** - Critical Damage & Healing (11% base → 18% with 7 Legendary)
10. **The Thief** - Critical Chance (1212 base → 1984 with 7 Legendary)
11. **The Tower** - Maximum Stamina (2023 base → 3311 with 7 Legendary)
12. **The Warrior** - Weapon Damage (238 base → 389 with 7 Legendary)

### Multi-Effect Stone

13. **The Steed** - Health Recovery (238 → 389) AND Movement Speed (10% → 16%)

## Scraping Challenges

### Challenge 1: Complex Table Structure
The UESP wiki presents this data in multiple formats:
- Summary table with all stones and base values
- Individual stone pages with full Divines scaling tables
- Tables show 0-8 Divines pieces × 5 quality tiers = 45 values per effect

### Challenge 2: Percentage vs Flat Values
- Most effects are flat numbers (238, 2744, etc.)
- Some are percentages (8%, 11%, 10%)
- Percentages still scale with Divines but display differently

### Challenge 3: The 8-Piece Edge Case
- Most builds use 7 armor pieces
- 8 pieces only possible with a shield
- Must store all 0-8 values for completeness

### Challenge 4: Multi-Effect Stones
- The Steed is the only stone with 2 separate effects
- Each effect has its own scaling table
- Effects use different units (flat number + percentage)

## Scraping Strategy

1. **Main Summary Table**: Extract stone names, base effects, and locations
2. **Individual Pages**: Visit each stone's page for full Divines scaling data
3. **Parse Scaling Tables**: Extract all 45 values (9 pieces × 5 qualities) per effect
4. **Handle Special Cases**: Detect percentage values, multi-effect stones
5. **Validate**: Ensure 7-piece Legendary values match the summary table

## URLs

- Main Page: https://en.uesp.net/wiki/Online:Mundus_Stones
- Individual Stones: https://en.uesp.net/wiki/Online:The_{Stone_Name}_(Mundus_Stone)

## Notes

- Character sheet may display rounded values (9.0% instead of 9.1%) for visual purposes
- Players receive the full exact bonus despite display rounding
- The Divines bonus calculation is multiplicative, not additive
