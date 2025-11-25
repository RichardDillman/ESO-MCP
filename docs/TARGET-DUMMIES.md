# Target Dummy System

Complete target dummy information stored in the database for accurate parse analysis.

## Overview

The ESO-MCP server now maintains a comprehensive database of target dummies with their exact buffs/debuffs. This allows for accurate parse analysis by understanding what buffs the dummy provides vs. what the player must provide themselves.

## Database Model

Located in `prisma/schema.prisma`:

```prisma
model TargetDummy {
  id              String   @id
  name            String   @unique
  health          Int
  buffsProvided   String   // JSON array
  debuffsProvided String   // JSON array
  description     String
  usage           String
  source          String
  lastUpdated     DateTime @default(now()) @updatedAt
}
```

## Available Dummies

### Iron Atronach (Trial Dummy)
- **ID**: `iron-atronach-trial`
- **Health**: 21,000,000
- **Buffs**: Full raid support (Major Force, Major Courage, Major Slayer, Minor Sorcery, Minor Brutality, Minor Prophecy, Minor Berserk, Minor Savagery, Minor Toughness, Aggressive Horn)
- **Debuffs**: Brittle, Minor Vulnerability, Major Vulnerability
- **Usage**: Optimal DPS testing with full group support

### Iron Atronach (Robust Dummy)
- **ID**: `iron-atronach-robust`
- **Health**: 21,000,000
- **Buffs**: Only Hircine's Veneer and Worm's Raiment (resource recovery)
- **Debuffs**: None
- **Usage**: Solo/self-sufficient DPS testing

### Iron Atronach (Precursor Dummy)
- **ID**: `iron-atronach-precursor`
- **Health**: 6,000,000
- **Buffs**: Same as Trial Dummy
- **Debuffs**: Same as Trial Dummy
- **Usage**: Quick rotation testing, shorter parses

### Stone Husk (3M)
- **ID**: `stone-husk-3m`
- **Health**: 3,000,000
- **Buffs**: None
- **Debuffs**: None
- **Usage**: Basic skill testing, quick damage checks

### Stone Husk (6M)
- **ID**: `stone-husk-6m`
- **Health**: 6,000,000
- **Buffs**: None
- **Debuffs**: None
- **Usage**: Intermediate testing, dungeon DPS approximation

## MCP Tools

### list_target_dummies
List all available target dummies with basic info.

```json
{
  "name": "list_target_dummies"
}
```

**Returns**:
```json
[
  {
    "id": "iron-atronach-trial",
    "name": "Iron Atronach (Trial Dummy)",
    "health": 21000000,
    "description": "Trial dummy providing full raid buffs..."
  },
  ...
]
```

### get_target_dummy_info
Get detailed information about a specific dummy including all buffs/debuffs.

```json
{
  "name": "get_target_dummy_info",
  "arguments": {
    "dummyId": "iron-atronach-trial"
  }
}
```

**Returns**:
```json
{
  "id": "iron-atronach-trial",
  "name": "Iron Atronach (Trial Dummy)",
  "health": 21000000,
  "buffsProvided": [
    {
      "name": "Major Force",
      "description": "Increases critical damage by 10%"
    },
    ...
  ],
  "debuffsProvided": [...],
  "description": "...",
  "usage": "..."
}
```

### search_eso
Target dummies are now included in unified search:

```json
{
  "name": "search_eso",
  "arguments": {
    "query": "trial dummy"
  }
}
```

## Parse Analysis Integration

The parse analysis script (`scripts/analyze-my-parse.ts`) now:

1. Queries the database for trial dummy information
2. Displays which buffs the dummy provides
3. Clearly separates what YOU must provide vs. what the dummy provides
4. Identifies missing critical buffs that trials won't provide

Example output:
```
=== BUFF ANALYSIS ===
ℹ️  Iron Atronach (Trial Dummy) provides: Aggressive Horn, Major Force, Major Courage, Minor Brutality, Minor Savagery, Minor Prophecy, Minor Sorcery, Minor Berserk, Major Slayer, Minor Toughness
   (These buffs won't be available in most content - you need to provide them yourself)

❌ Major Sorcery          0.0% (Spell Damage) - MISSING
✅ Major Brutality      100.0% (Weapon Damage)
❌ Major Prophecy         0.0% (Spell Critical) - MISSING
❌ Major Savagery         0.0% (Weapon Critical) - MISSING

=== SELF-PROVIDED BUFFS (What you bring to trials) ===
✅ Minor Slayer         100.0%
✅ Minor Force           57.9%
✅ Empower               67.9%
⚠️  Major Resolve          0.0% - Consider adding

💡 These are YOUR responsibility - trial dummy provides them but real content won't!
```

## Seeding Data

Run the seed script to populate or update dummy data:

```bash
pnpm exec tsx scripts/seed-target-dummies.ts
```

This is idempotent and can be run multiple times safely.

## Data Source

Target dummy information sourced from:
- Official ESO game data
- Community testing (UESP, ESO-Hub)
- In-game dummy purchase descriptions

Last verified: Update 45 (2025)

## Future Enhancements

- [ ] Add parse dummy auto-detection from ESO Logs fight name
- [ ] Track dummy changes across game updates
- [ ] Add combat context presets (solo, dungeon, trial)
- [ ] Support for custom dummy configurations

---

**Related Documentation**:
- [ESOLOGS-SETUP-GUIDE.md](./ESOLOGS-SETUP-GUIDE.md) - ESO Logs API integration
- [ESOLOGS-INTEGRATION.md](./ESOLOGS-INTEGRATION.md) - Parse analysis features
