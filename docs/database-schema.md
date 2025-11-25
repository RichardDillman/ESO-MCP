# ESO-MCP Database Schema

## Main Schema (Tables with Relationships)

```mermaid
erDiagram
    Skill {
        string id PK
        string name
        string type
        string skillLine
        string category
        string costResource
        int costAmount
        int castTime
        int channelTime
        int duration
        int cooldown
        int range
        int radius
        string target
        string description
        string unlockDescription
        string patch
        string source
        datetime lastUpdated
        string baseSkillId FK
        string skillLineId FK
    }

    Effect {
        int id PK
        string type
        string description
        string value
        int duration
        string target
        string skillId FK
    }

    Morph {
        string id PK
        string name
        string description
        string changes
        string skillId FK
    }

    Scaling {
        int id PK
        string stat
        float coefficient
        int maxTargets
        string skillId FK
    }

    Requirements {
        int id PK
        int level
        int skillLineRank
        string prerequisiteSkill
        string skillId FK
    }

    SkillLine {
        string id PK
        string name
        string category
        int maxRank
    }

    Set {
        string id PK
        string name
        string type
        string slots
        string weaponTypes
        string location
        string dropSource
        string craftingSites
        string dlcRequired
        boolean tradeable
        string bindType
        string description
        string patch
        string source
        datetime lastUpdated
    }

    SetBonus {
        int id PK
        int pieces
        string stats
        string effect
        string effectType
        int cooldown
        string setId FK
    }

    Race {
        string id PK
        string name
        string description
        string alliance
        string baseStats
        string source
        datetime lastUpdated
    }

    RacialPassive {
        int id PK
        string name
        int rank
        string description
        int unlockLevel
        string effects
        string raceId FK
    }

    Cap {
        string id PK
        string name
        string category
        string capValue
        string capType
        string description
        string notes
        datetime lastUpdated
    }

    StatAffectsCap {
        int id PK
        string capId FK
        string statName
        string conversionInfo
    }

    Skill ||--o{ Effect : has
    Skill ||--o{ Morph : has
    Skill ||--o| Scaling : has
    Skill ||--o| Requirements : has
    Skill }o--o| SkillLine : belongs-to
    Skill }o--o| Skill : morphs-from
    Set ||--o{ SetBonus : has
    Race ||--o{ RacialPassive : has
    Cap ||--o{ StatAffectsCap : affected-by
```

## Standalone Tables (No Foreign Keys)

These tables have no foreign key relationships and are queried independently:

```mermaid
erDiagram
    Class {
        string id PK
        string name
        string description
        string source
        datetime lastUpdated
    }
```

```mermaid
erDiagram
    Buff {
        string id PK
        string name
        string type
        string description
        string icon
        string sources
        string pageUrl
        datetime lastUpdated
    }
```

```mermaid
erDiagram
    Debuff {
        string id PK
        string name
        string type
        string description
        string icon
        string sources
        string pageUrl
        datetime lastUpdated
    }
```

```mermaid
erDiagram
    TargetDummy {
        string id PK
        string name
        int health
        string buffsProvided
        string debuffsProvided
        string description
        string usage
        string source
        datetime lastUpdated
    }
```

```mermaid
erDiagram
    MundusStone {
        string id PK
        string name
        string effect
        string value
        string description
        string location
        string source
        datetime lastUpdated
    }
```

```mermaid
erDiagram
    CharacterBuild {
        string id PK
        string name
        string description
        string classId
        string raceId
        string stats
        string sets
        string rotation
        string buffs
        float cachedDPS
        datetime createdAt
        datetime updatedAt
    }
```

```mermaid
erDiagram
    Metadata {
        int id PK
        string key
        string value
        datetime lastUpdated
    }
```

## Entity Relationships Summary

| Parent | Child | Relationship |
|--------|-------|--------------|
| Skill | Effect | One-to-Many |
| Skill | Morph | One-to-Many |
| Skill | Scaling | One-to-One |
| Skill | Requirements | One-to-One |
| SkillLine | Skill | One-to-Many |
| Skill | Skill | Self-referential (morphs) |
| Set | SetBonus | One-to-Many |
| Race | RacialPassive | One-to-Many |
| Cap | StatAffectsCap | One-to-Many |

## Proposed Tag System

```mermaid
erDiagram
    Tag {
        string id PK
        string name
        string category
        string display
    }

    ItemTag {
        int id PK
        string tagId FK
        string itemId
        string itemType
    }

    Tag ||--o{ ItemTag : has
```

The `ItemTag` table uses a polymorphic pattern where:

- `itemId` = the ID from the source table (Skill, Set, Buff, etc.)
- `itemType` = which table it references ("skill", "set", "buff", "debuff", "mundus", "racial")

This enables queries like:

- Find all items tagged `major-force`
- Find all sets tagged `stamina`
- Find all skills tagged `healing`
