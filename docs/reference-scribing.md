# ESO Scribing System

Complete scribing system for validating and managing scribed skills in ESO.

## Overview

The Scribing system in ESO allows players to customize skills by combining:
1. **Grimoire** - The base skill (11 total)
2. **Focus Script** - Modifies the primary effect (11 total)
3. **Affix Script** - Adds secondary effects (22 total)
4. **Signature Script** - Defines the execution/delivery method (19 total)

Each combination has strict compatibility rules based on skill type, class, weapon, and armor requirements.

## MCP Tools

### validate_scribed_skill
Validates a scribed skill combination and reports any errors.

```json
{
  "name": "validate_scribed_skill",
  "arguments": {
    "grimoire": "Vault",
    "focus": "agility_focus",
    "affix": "stormlash",
    "signature": "piercing_stride",
    "playerClass": "arcanist"
  }
}
```

**Returns**:
```json
{
  "grimoire": "Vault",
  "focus": "agility_focus",
  "affix": "stormlash",
  "signature": "piercing_stride",
  "isValid": true,
  "errors": []
}
```

### list_scribing_options
List all available scribing components.

```json
{
  "name": "list_scribing_options",
  "arguments": {
    "type": "grimoires"  // or "focus", "affix", "signature", "all"
  }
}
```

### describe_scribed_skill
Get a detailed description of a scribed skill.

```json
{
  "name": "describe_scribed_skill",
  "arguments": {
    "grimoire": "Elemental Explosion",
    "focus": "elemental_focus",
    "affix": "flame_sigil",
    "signature": "explosive_finale"
  }
}
```

**Returns**:
```
Elemental Explosion (Scribed)
Base: Point-blank explosion with delay
Focus: adds flame/shock/frost/magic type
Affix: flame_damage
Signature: large_delayed_aoe
```

## Grimoires

### Damage Grimoires
- **Soul Burst** - Utility damage with flexible options
- **Elemental Explosion** - Point-blank AoE explosion
- **Torchbearer** - DoT-focused burning damage
- **Trample** - Mobility + physical damage charge
- **Starfall** - Delayed meteor-like AoE
- **Stonespike** - Ranged physical/bleed DoT

### Support Grimoires
- **Grand Healing** - Ground-targeted heal over time
- **Warding Glyph** - Defensive shield with buffs

### Utility Grimoires
- **Vault** - Teleport/dash mobility
- **Shield Throw** - Ricochet ranged physical
- **Rune of Displacement** - Pull and DoT placement

## Focus Scripts

| Focus | Role | Effect | Class Restriction |
|-------|------|--------|-------------------|
| fell_focus | damage | Weapon/spell damage buff | None |
| mending_focus | healing | Healing conversion/boost | None |
| bulwark_focus | tank | Minor Resolve/mitigation | None |
| stealth_focus | stealth | Invisibility/detection removal | None |
| agility_focus | stamina | Stamina cost/restore | None |
| sorcery_focus | magicka | Magicka cost/restore | None |
| compulsion_focus | cc | Stun/snare/offbalance | None |
| elemental_focus | elemental | Flame/shock/frost/magic type | None |
| rage_focus | berserk | Minor Berserk/scaling damage | None |
| cycle_focus | execute | Bonus damage to low health | None |
| arcanist_focus | class | Crux generation | **Arcanist only** |

## Affix Scripts

### Damage Affixes
- **bleeding_edge** - Bleed DoT
- **shocking_burst** - Shock AoE
- **flame_sigil** - Flame damage
- **chilling_rune** - Frost damage + snare
- **darkened_soul** - Magic DoT
- **corrosive_spores** - Armor reduction
- **stormlash** - Chain lightning

### Healing Affixes
- **restorative_grace** - HoT
- **purifying_light** - Cleanse or burst heal
- **guardians_boon** - Minor Protection + heal
- **redeemers_touch** - Damage to heal conversion

### Utility Affixes
- **challengers_mark** - Taunt (tank only)
- **defiant_ward** - Shield
- **siphoning_shade** - Resource drain
- **immovable_stone** - CC immunity
- **crushing_gravity** - Pull/knockdown

### Class-Specific Affixes
- **cephaliarch_flare** - Generate 1 Crux (Arcanist)
- **tomebearers_lash** - Bonus damage at 3 Crux (Arcanist)
- **draconic_fortitude** - DK heal/armor (Dragonknight)
- **stormcalling_tether** - Shock tether (Sorcerer)
- **frost_guardian_bite** - Frost animal proc (Warden)
- **shadowed_precision** - Crit buff/Minor Berserk (Nightblade)

## Signature Scripts

### Universal Signatures
- **explosive_finale** - Large delayed AoE
- **healing_chorus** - Group AoE heal
- **rebounding_frost** - Ricochet projectile

### Weapon-Specific Signatures
- **piercing_stride** - Gap closer with penetration (2H/DW/1H+Shield)
- **crushing_sweep** - Cone cleave (melee)
- **windstep_retreat** - Dodge backwards + cleanse (bow)
- **rending_volley** - Stacking DoT (bow)
- **binding_arrow** - Root and immobilize (bow)

### Class-Specific Signatures
- **cephaliarch_judgment** - Arcanist crux finisher (Arcanist)
- **draconic_smash** - Fiery slam (Dragonknight)
- **burning_chains** - DK pull (Dragonknight)
- **frost_gale** - Frost AoE (Warden)
- **lightning_sunder** - Sorc lightning burst (Sorcerer)
- **siphoning_blade** - Steal resources (Nightblade)
- **holy_benediction** - Templar burst heal (Templar)

### Role-Specific Signatures
- **guardians_rally** - Burst heal + Minor Courage (support)
- **bulwark_guard** - Shield + taunt (tank)
- **immovable_bastion** - Massive shield + CC immunity (heavy armor)

### Guild Signatures
- **silvered_assault** - Fighters Guild holy finisher (Fighters Guild)

## Compatibility Rules

### Grimoire Restrictions

**Vault** (Mobility):
- ✅ Allows: mobility, stealth, agility focus
- ✅ Allows: utility, light_damage affixes
- ✅ Allows: piercing_stride, windstep_retreat signatures
- ❌ Blocks: heavy CC signatures

**Elemental Explosion** (AoE Damage):
- ✅ Allows: damage, elemental focus
- ✅ Allows: any damage affixes
- ✅ Allows: explosive_finale signature
- ❌ Blocks: healing signatures

**Soul Burst** (Utility Damage):
- ✅ Allows: damage, utility focus
- ✅ Allows: any affixes
- ✅ Allows: cephaliarch_judgment signature
- ❌ No restrictions

### Class Restrictions

Some scripts require specific classes:
- **Arcanist**: arcanist_focus, cephaliarch_flare, tomebearers_lash, cephaliarch_judgment
- **Dragonknight**: draconic_fortitude, draconic_smash, burning_chains
- **Sorcerer**: stormcalling_tether, lightning_sunder
- **Warden**: frost_guardian_bite, frost_gale
- **Nightblade**: shadowed_precision, siphoning_blade
- **Templar**: holy_benediction

### Weapon/Armor Restrictions

Some signatures require specific equipment:
- **Melee weapons**: crushing_sweep
- **Bow**: windstep_retreat, rending_volley, binding_arrow
- **2H/DW/1H+Shield**: piercing_stride
- **Heavy Armor**: immovable_bastion

## Example Builds

### Arcanist DoT Build
```typescript
{
  grimoire: "Torchbearer",
  focus: "elemental_focus",
  affix: "cephaliarch_flare",  // Generates Crux
  signature: "rending_volley"   // Stacking DoT
}
```

### Tank Utility
```typescript
{
  grimoire: "Warding Glyph",
  focus: "bulwark_focus",
  affix: "challengers_mark",  // Taunt
  signature: "immovable_bastion"
}
```

### Mobility DPS
```typescript
{
  grimoire: "Vault",
  focus: "agility_focus",
  affix: "stormlash",
  signature: "piercing_stride"  // Gap closer
}
```

## Parse Detection

The system can detect scribed skills in ESO Logs parses by looking for grimoire keywords in ability names. Scribed skills typically show as "Grimoire Name (Scribed)" or contain "scribing" keywords.

## Data Source

All scribing data based on:
- Official ESO game data (Update 41+)
- UESP Scribing documentation
- Community testing and validation

Last updated: 2025-11-25

---

**Related Documentation**:
- [SKILLLINE-PASSIVES](./SKILLLINE-PASSIVES.md) - Skill line passive buffs
- [TARGET-DUMMIES](./TARGET-DUMMIES.md) - Target dummy buff tracking
