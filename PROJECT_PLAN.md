# ESO MCP Server - Project Plan

## Overview
MCP (Model Context Protocol) server for Elder Scrolls Online data, providing access to skills, sets, races, classes, and combat mechanics from UESP wiki.

## Configuration Decisions

1. **Scope:** All data types (skills, sets, races, classes, dummies, buffs/debuffs)
2. **Technology:** Node.js with TypeScript
3. **Update Strategy:** Manual update command (run on ESO release days)
4. **Implementation Priority:** Skills first, then sets
5. **Feature Focus:** Set/skill lookups (build validation, set optimizer, and rotation suggestions for future phases)
   - Note: DPS calculation excluded due to internal game mechanics complexity

---

## Stage 1: Data Inventory & Requirements

### Core Data Types to Scrape

#### 1. Character Building Elements

**Classes** (7 classes)
- Dragonknight
- Sorcerer
- Nightblade
- Templar
- Warden
- Necromancer
- Arcanist

Each class has:
- 3 skill lines per class
- Active abilities with morphs
- Passive abilities

**Races** (10 playable races)
https://en.uesp.net/wiki/Online:Races
- Altmer (High Elf)
- Bosmer (Wood Elf)
- Dunmer (Dark Elf)
- Argonian
- Khajiit
- Breton
- Redguard
- Orc
- Nord
- Imperial

Each race has:
- Racial passive abilities
- Stat bonuses
- Lore description

**Mundas Stones** (13 stones with specific buffs)
NOTE: There are some armor sets that allow you to choose 2 stones.
https://en.uesp.net/wiki/Online:Mundus_Stones

**Skills & Skill Lines**
https://en.uesp.net/wiki/Online:skills

Weapon Skills:
- Two-Handed
- One Hand and Shield
- Dual Wield
- Bow
- Destruction Staff
- Restoration Staff

Armor Skills:
- Light Armor
- Medium Armor
- Heavy Armor

Guild Skills:
- Fighters Guild
- Mages Guild
- Undaunted
- Psijic Order
- Thieves Guild
- Dark Brotherhood

World Skills:
- Soul Magic
- Vampire
- Werewolf
- Scrying
- Excavation

Alliance War Skills:
- Assault
- Support
- Emperor

Crafting Skills:
- Alchemy
- Blacksmithing
- Clothing
- Woodworking
- Enchanting
- Provisioning
- Jewelry Crafting

#### 2. Gear & Equipment

**Sets** (400+ sets)
https://en.uesp.net/wiki/Online:Sets

Types:
- Craftable sets
- Overland sets
- Dungeon sets
- Trial sets
- Arena sets
- Mythic items

Set Information:
- Set bonuses (2-5 piece)
- Drop locations
- Armor weight (Light/Medium/Heavy)
- Jewelry availability
- Weapon types available
- Tradeable status
- Required DLC/Chapter

**Mythic Items**
- Unique legendary items
- Antiquities system locations
- Special effects

**Arena Weapons**
- Maelstrom Arena
- Vateshran Hollows
- Dragonstar Arena
- Blackrose Prison

#### 3. Combat Mechanics

**Target Dummies**
- Trial Dummy (21M HP)
  - Major Force
  - Major Slayer
  - Minor Slayer
  - Crusher enchant
  - Alkosh/Martial Knowledge effects
- Precursor Dummy (6M HP)
  - Basic buffs
- Skeleton Dummy (300K-3M HP)
  - No buffs

**Status Effects**
- Burning
- Poisoned
- Diseased
- Chilled
- Concussed
- Hemorrhaging
- Overcharged
- Sundered

**Buffs & Debuffs**
- Major/Minor buff system
- Duration
- Source abilities
- Stack behavior

**Combat Formulas** (documentation only, not calculation)
- Damage types
- Penetration mechanics
- Critical strike
- Resource management
- Scaling coefficients

#### 4. Character Stats

**Primary Attributes**
- Health
- Magicka
- Stamina

**Derived Stats**
- Spell Damage
- Weapon Damage
- Spell Critical
- Weapon Critical
- Spell Penetration
- Physical Penetration
- Spell Resistance
- Physical Resistance
- Critical Damage
- Health Recovery
- Magicka Recovery
- Stamina Recovery

---

## Stage 2: MCP Server Architecture

### Technology Stack

**Core Technologies**
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript
- **MCP SDK:** @modelcontextprotocol/sdk
- **Web Scraping:**
  - cheerio (HTML parsing)
  - axios (HTTP requests)
  - puppeteer (optional, for JS-rendered content)
- **Data Storage:**
  - Local JSON files for caching
  - SQLite for structured queries (optional future)
- **Build Tools:**
  - tsx for development
  - esbuild or tsc for production builds

**Development Tools**
- ESLint
- Prettier
- Jest (testing)

### Server Components

#### 1. Data Scraper Module
```
src/scrapers/
  ├── base.ts           # Base scraper class
  ├── skills.ts         # Skills scraper
  ├── sets.ts           # Sets scraper
  ├── races.ts          # Races scraper
  ├── classes.ts        # Classes scraper
  └── dummies.ts        # Target dummy scraper
```

Responsibilities:
- Parse UESP wiki pages
- Extract structured data
- Handle rate limiting
- Cache responses
- Track scrape timestamps
- Detect data changes

#### 2. Data Models
```
src/types/
  ├── skill.ts          # Skill interfaces
  ├── set.ts            # Set interfaces
  ├── race.ts           # Race interfaces
  ├── class.ts          # Class interfaces
  ├── buff.ts           # Buff/debuff interfaces
  └── common.ts         # Shared types
```

#### 3. Data Storage
```
data/
  ├── skills/
  ├── sets/
  ├── races/
  ├── classes/
  ├── dummies/
  └── metadata.json     # Version info, last update
```

#### 4. MCP Server
```
src/
  ├── server.ts         # Main MCP server
  ├── resources.ts      # Resource handlers
  ├── tools.ts          # Tool handlers
  └── index.ts          # Entry point
```

### MCP Resources (Read-only Data Access)

**Resource URI Pattern:**
```
eso://skills/{category}/{skillLine}/{skillName}
eso://sets/{setName}
eso://races/{raceName}
eso://classes/{className}/{skillLine}
eso://dummies/{dummyType}
eso://buffs/{buffName}
```

**Examples:**
```
eso://skills/class/dragonknight/ardent-flame/lava-whip
eso://skills/weapon/two-handed/cleave
eso://sets/relequens-whorl
eso://races/dunmer
eso://classes/sorcerer/daedric-summoning
eso://dummies/trial-dummy
eso://buffs/major-force
```

### MCP Tools (Interactive Queries)

#### Priority Tools (Phase 1-2)
```typescript
search_skills(
  query?: string,
  skillLine?: string,
  type?: "active" | "passive" | "ultimate",
  resource?: "magicka" | "stamina" | "health"
)

search_sets(
  query?: string,
  type?: "craftable" | "overland" | "dungeon" | "trial" | "arena" | "mythic",
  minPieces?: number,
  slot?: "light" | "medium" | "heavy" | "jewelry" | "weapon",
  bonusKeyword?: string
)

get_skill_details(skillName: string)

get_set_details(setName: string)

get_race_info(raceName: string)

get_class_info(className: string, skillLine?: string)

get_dummy_info(dummyType: string)
```

#### Future Tools (Phase 3)
```typescript
validate_build(
  class: string,
  race: string,
  skills: string[],
  sets: string[]
)

find_set_synergies(
  currentSets: string[],
  playstyle?: string
)

compare_morphs(
  baseSkill: string
)

list_buffs_debuffs(
  source?: "skill" | "set" | "dummy"
)
```

---

## Stage 3: Data Models

### Skill Model
```typescript
interface Skill {
  name: string;
  id: string;
  type: "active" | "passive" | "ultimate";
  skillLine: string;
  category: "class" | "weapon" | "armor" | "guild" | "world" | "alliance" | "crafting";

  // Active skill properties
  cost?: {
    resource: "magicka" | "stamina" | "health" | "ultimate";
    amount: number;
  };
  castTime?: number; // milliseconds
  channelTime?: number;
  duration?: number;
  cooldown?: number;
  range?: number; // meters
  radius?: number;
  target?: string;

  // Effects
  effects: Effect[];

  // Morphs
  morphs?: Morph[];
  baseSkill?: string; // if this is a morph

  // Scaling
  scaling?: {
    stat: string;
    coefficient: number;
    maxTargets?: number;
  };

  // Requirements
  requirements?: {
    level?: number;
    skillLineRank?: number;
    prerequisiteSkill?: string;
  };

  // Metadata
  description: string;
  unlockDescription?: string;
  patch?: string;
  source: string; // UESP URL
  lastUpdated: string; // ISO date
}

interface Effect {
  type: string;
  description: string;
  value?: number | string;
  duration?: number;
  target?: "self" | "enemy" | "ally" | "area";
}

interface Morph {
  name: string;
  id: string;
  description: string;
  changes: string[]; // What changed from base
}
```

### Set Model
```typescript
interface Set {
  name: string;
  id: string;
  type: "craftable" | "overland" | "dungeon" | "trial" | "arena" | "mythic" | "monster" | "special";

  // Availability
  slots: Array<"light" | "medium" | "heavy" | "jewelry" | "weapon">;
  weaponTypes?: string[]; // "1h", "2h", "bow", "staff", etc.

  // Bonuses
  bonuses: {
    pieces: 2 | 3 | 4 | 5 | 1; // 1 for mythics
    stats?: Record<string, number>; // { "Max Health": 1206, "Spell Damage": 129 }
    effect?: string; // Proc or special effect description
    effectType?: "proc" | "passive" | "toggle";
    cooldown?: number;
  }[];

  // Location & Acquisition
  location?: string;
  dropSource?: string[]; // Specific bosses, zones
  craftingSites?: string[]; // For craftable sets
  dlcRequired?: string;

  // Trading
  tradeable: boolean;
  bindType?: "on pickup" | "on equip";

  // Metadata
  description?: string;
  patch?: string;
  source: string; // UESP URL
  lastUpdated: string;
}
```

### Race Model
```typescript
interface Race {
  name: string;
  id: string;

  // Lore
  description: string;
  alliance?: "Aldmeri Dominion" | "Daggerfall Covenant" | "Ebonheart Pact" | "Any";

  // Passives
  passives: RacialPassive[];

  // Starting bonuses
  baseStats?: Record<string, number>;

  // Metadata
  source: string;
  lastUpdated: string;
}

interface RacialPassive {
  name: string;
  rank: number;
  effects: Effect[];
  description: string;
  unlockLevel: number;
}
```

### Class Model
```typescript
interface Class {
  name: string;
  id: string;
  description: string;

  skillLines: SkillLine[];

  source: string;
  lastUpdated: string;
}

interface SkillLine {
  name: string;
  id: string;
  category: string;
  skills: Skill[];
  maxRank: number;
}
```

### Target Dummy Model
```typescript
interface TargetDummy {
  name: string;
  id: string;
  health: number;

  buffsProvided: Buff[];
  debuffsProvided: Debuff[];

  description: string;
  usage: string; // When to use this dummy

  source: string;
  lastUpdated: string;
}

interface Buff {
  name: string;
  type: "major" | "minor" | "unique";
  effect: string;
  value?: number;
  duration?: number | "permanent";
}

interface Debuff {
  name: string;
  type: "major" | "minor" | "unique";
  effect: string;
  value?: number;
  duration?: number | "permanent";
}
```

---

## Stage 4: Scraping Strategy

### Approach

#### Initial Setup
1. **Full data pull** on first run
2. Store in structured JSON files
3. Create metadata file with versions and timestamps
4. Index data for fast lookups

#### Update Mechanism
Command: `npm run update-data` (manual execution on release days)

Process:
1. Check current game version
2. Compare with stored version
3. Scrape changed categories
4. Validate new data
5. Update local cache
6. Update metadata

#### Caching Strategy
```
data/
  ├── cache/
  │   ├── raw/          # Raw HTML responses
  │   └── parsed/       # Parsed JSON
  ├── skills.json
  ├── sets.json
  ├── races.json
  ├── classes.json
  ├── dummies.json
  └── metadata.json
```

metadata.json:
```json
{
  "gameVersion": "Update 41",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "dataVersions": {
    "skills": "2024-01-15T10:30:00Z",
    "sets": "2024-01-15T10:45:00Z",
    "races": "2024-01-10T08:00:00Z",
    "classes": "2024-01-10T08:00:00Z"
  },
  "sources": {
    "skills": "https://en.uesp.net/wiki/Online:Skills",
    "sets": "https://en.uesp.net/wiki/Online:Sets"
  }
}
```

### Scraping Considerations

#### Rate Limiting
- Delay between requests: 1-2 seconds
- Respect robots.txt
- Use User-Agent identification
- Cache aggressively

#### Error Handling
- Retry logic for failed requests
- Validation of scraped data
- Logging of errors
- Partial update capability

#### Data Validation
- Schema validation with Zod
- Check for required fields
- Validate references (skill names, set names)
- Detect format changes in UESP

---

## Stage 5: Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic MCP server with one skill line

Tasks:
- [x] Project setup (Node.js, TypeScript, MCP SDK)
- [ ] Create base scraper class
- [ ] Implement skills scraper (one skill line: Dragonknight > Ardent Flame)
- [ ] Define Skill data model
- [ ] Setup basic MCP server
- [ ] Implement `get_skill_details` tool
- [ ] Test with Claude Desktop

Deliverables:
- Working MCP server
- 8-10 skills from one skill line
- Basic search functionality

### Phase 2: Skills Complete (Week 2-3)
**Goal:** All skills scraped and accessible

Tasks:
- [ ] Scrape all class skills
- [ ] Scrape weapon skills
- [ ] Scrape armor skills
- [ ] Scrape guild skills
- [ ] Scrape world skills
- [ ] Implement `search_skills` tool with filters
- [ ] Add morph comparison
- [ ] Implement caching

Deliverables:
- 500+ skills in database
- Advanced search capabilities
- Fast lookup times (<100ms)

### Phase 3: Sets Implementation (Week 4-5)
**Goal:** Complete sets database

Tasks:
- [ ] Define Set data model
- [ ] Scrape craftable sets
- [ ] Scrape dungeon sets
- [ ] Scrape trial sets
- [ ] Scrape arena sets
- [ ] Scrape mythic items
- [ ] Implement `search_sets` tool
- [ ] Implement `get_set_details` tool
- [ ] Add set bonus parsing

Deliverables:
- 400+ sets in database
- Set search with filters
- Location information

### Phase 4: Races & Classes (Week 6)
**Goal:** Character creation data

Tasks:
- [ ] Scrape all races
- [ ] Scrape racial passives
- [ ] Organize class data
- [ ] Implement `get_race_info` tool
- [ ] Implement `get_class_info` tool

Deliverables:
- Complete race data
- Organized class information

### Phase 5: Combat Mechanics (Week 7)
**Goal:** Target dummies and buff/debuff system

Tasks:
- [ ] Scrape dummy information
- [ ] Document buff/debuff system
- [ ] Implement `get_dummy_info` tool
- [ ] Implement `list_buffs_debuffs` tool

Deliverables:
- Dummy buff information
- Comprehensive buff/debuff list

### Phase 6: Polish & Testing (Week 8)
**Goal:** Production-ready server

Tasks:
- [ ] Implement update command
- [ ] Add comprehensive error handling
- [ ] Write tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Setup CI/CD (optional)

Deliverables:
- Stable, tested server
- Complete documentation
- Update mechanism

---

## Stage 6: Future Enhancements

### Phase 7: Build Validation
- Check for skill/set conflicts
- Validate resource alignment (mag vs stam)
- Detect anti-synergies
- Suggest alternatives

### Phase 8: Set Optimizer
- Recommend sets based on playstyle
- Find synergies between sets
- Calculate total stat bonuses
- Compare set combinations

### Phase 9: Rotation Suggestions
- Suggest skill rotations based on build
- Consider cooldowns and resources
- Factor in buff uptimes
- Provide priority lists

---

## Project Structure

```
eso-mcp/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── resources.ts          # Resource handlers
│   ├── tools.ts              # Tool handlers
│   ├── types/
│   │   ├── skill.ts
│   │   ├── set.ts
│   │   ├── race.ts
│   │   ├── class.ts
│   │   ├── buff.ts
│   │   └── common.ts
│   ├── scrapers/
│   │   ├── base.ts
│   │   ├── skills.ts
│   │   ├── sets.ts
│   │   ├── races.ts
│   │   ├── classes.ts
│   │   └── dummies.ts
│   ├── storage/
│   │   ├── cache.ts
│   │   └── loader.ts
│   └── utils/
│       ├── logger.ts
│       ├── validator.ts
│       └── parser.ts
├── data/
│   ├── skills.json
│   ├── sets.json
│   ├── races.json
│   ├── classes.json
│   ├── dummies.json
│   └── metadata.json
├── tests/
│   ├── scrapers/
│   ├── tools/
│   └── integration/
├── scripts/
│   └── update-data.ts
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── README.md
└── PROJECT_PLAN.md
```

---

## Success Metrics

### MVP (Phase 1)
- [x] Server runs and connects to Claude Desktop
- [ ] Can query at least one skill line
- [ ] Response time < 200ms

### Phase 2 Complete
- [ ] 500+ skills accessible
- [ ] Search returns relevant results
- [ ] All skill lines covered

### Phase 3 Complete
- [ ] 400+ sets accessible
- [ ] Set search with filters working
- [ ] Location data accurate

### Production Ready (Phase 6)
- [ ] All data types accessible
- [ ] Update command works
- [ ] 90%+ uptime
- [ ] Comprehensive test coverage
- [ ] Documentation complete

---

## Risk Mitigation

### Risk: UESP format changes
**Mitigation:**
- Flexible parsers with fallbacks
- Validation to detect issues early
- Version tracking

### Risk: Rate limiting or blocking
**Mitigation:**
- Aggressive caching
- Respectful scraping (delays)
- User-Agent identification

### Risk: Data accuracy
**Mitigation:**
- Manual verification of samples
- Community validation
- Link to source pages

### Risk: Performance with large datasets
**Mitigation:**
- Indexing for fast lookups
- Lazy loading
- Query optimization

---

## Maintenance Plan

### On ESO Release Days
1. Run `npm run update-data`
2. Review changelog from patch notes
3. Verify critical data (new sets, skill changes)
4. Update metadata with new version
5. Test updated data

### Monthly
- Review error logs
- Performance monitoring
- Update dependencies

---

---

## Data Scraping Progress

### Completed
- [x] Mundus Stones (12/13 stones scraped - missing The Apprentice)
- [x] Dragonknight Ardent Flame skill line (5 skills)
- [x] Races (10/10 races scraped)
  - [x] Altmer (High Elf) - 6 passives
  - [x] Bosmer (Wood Elf) - 6 passives
  - [x] Dunmer (Dark Elf) - 6 passives
  - [x] Argonian - 6 passives
  - [x] Khajiit - 6 passives
  - [x] Breton - 6 passives
  - [x] Redguard - 6 passives
  - [x] Orc - 6 passives
  - [x] Nord - 6 passives
  - [x] Imperial - 6 passives
  - [x] MCP tools: `search_races` and `get_race_details`
  - [x] MCP resources: `eso://races/all` and `eso://races/{race-id}`

- [x] Classes (7 total - all scraped with 19 skill lines, 114 skills)
  - [x] Dragonknight (Ardent Flame, Draconic Power, Earthen Heart - 18 skills)
  - [x] Sorcerer (Dark Magic, Daedric Summoning, Storm Calling - 18 skills)
  - [x] Nightblade (Assassination, Shadow, Siphoning - 18 skills)
  - [x] Templar (Aedric Spear, Dawn's Wrath, Restoring Light - 18 skills)
  - [x] Warden (Animal Companions, Green Balance, Winter's Embrace - 18 skills)
  - [x] Necromancer (Grave Lord, Bone Tyrant, Living Death - 18 skills)
  - [x] Arcanist (Herald of the Tome, Curative Runeforms - 12 skills, note: Apocryphal Soldier 404'd)
  - [x] JSON backup system: data/scraped/classes/
  - [x] Import scripts: scripts/import-classes.ts
  - [x] MCP tools: `search_classes` and `get_class_details`
  - [x] MCP resources: `eso://classes/all` and `eso://classes/{class-id}`

- [x] Skills - Weapon (6 skill lines - 66 skills total)
  - [x] Two Handed - 11 skills
  - [x] One Hand and Shield - 11 skills
  - [x] Dual Wield - 11 skills
  - [x] Bow - 11 skills
  - [x] Destruction Staff - 11 skills
  - [x] Restoration Staff - 11 skills
  - [x] JSON backup system: data/scraped/skills/
  - [x] Import scripts: scripts/import-skills.ts

- [x] Skills - Armor (3 skill lines - 6 skills total, all passive)
  - [x] Light Armor - 2 skills
  - [x] Medium Armor - 2 skills
  - [x] Heavy Armor - 2 skills
  - [x] JSON backup system: data/scraped/skills/
  - [x] Import scripts: scripts/import-skills.ts

### Completed
- [x] Sets (595 sets with 2,326 bonuses) - **ALL SCRAPED AND IMPORTED**
  - [x] Sets scraper created and fixed for bonus extraction
  - [x] Craftable Sets - 83 sets with bonuses
  - [x] Dungeon Sets - 150 sets with bonuses
  - [x] Monster Sets - 64 sets with bonuses
  - [x] Trial Sets - 84 sets with bonuses
  - [x] Arena Sets - 13 sets with bonuses
  - [x] Overland Sets - 105 sets with bonuses
  - [x] PVP Sets - 82 sets with bonuses
  - [x] Class Sets - 14 sets with bonuses
  - [x] Mythic Items - 0 sets (empty wiki page)
  - [x] Jewelry Sets - 0 sets (empty wiki page)
  - [x] Weapon Sets - 0 sets (empty wiki page)
  - [x] JSON backup system: data/scraped/sets/
  - [x] Import scripts: scripts/import-sets.ts
  - [x] MCP tools: `search_sets` and `get_set_details`
  - [x] MCP resources: `eso://sets/all` and `eso://sets/{set-id}`

### Not Started
- [ ] Skills - Guild (6 skill lines)
- [ ] Skills - World (4 skill lines)
- [ ] Skills - Alliance War (3 skill lines)
- [ ] Skills - Crafting (7 skill lines)
- [ ] Target Dummies
- [ ] Status Effects

- [ ] **Buffs & Debuffs System** - CRITICAL for build analysis
  - Source: https://en.uesp.net/wiki/Online:Buffs
  - [ ] Buffs table (Major/Minor variants)
    - Buff Name (e.g., "Aegis", "Brutality", "Courage")
    - Type (Major, Minor, or unique/unnamed)
    - Description (mechanical effect)
    - Sources (nested structure):
      - Abilities (links to skills)
      - Sets (links to armor sets)
      - Scribing (custom ability modifications)
      - Potions (consumables)
      - Champion/Verses (CP abilities)
      - Weapon type (conditional triggers)
    - Icon (visual asset)
  - [ ] Debuffs table (same structure as buffs)
  - [ ] Data model for Buff/Debuff
    - id, name, type (major/minor/unique)
    - description, icon
    - sources (JSON: {abilities: [], sets: [], scribing: [], potions: []})
  - [ ] Scraper for buffs/debuffs
    - Parse both tables
    - Handle nested source structure
    - Link to existing sets/skills where applicable
  - [ ] Import script
  - [ ] MCP tools: `search_buffs`, `get_buff_details`
  - [ ] MCP resources: `eso://buffs/all`, `eso://buffs/{buff-id}`
  - **Note**: Some sets provide unnamed buffs not in these tables

### Future Features
- [ ] DPS Calculations (see ESO_DPS_Math.md)
  - Note: This will be implemented after core data scraping is complete
  - Reference document: ESO_DPS_Math.md contains formulas and mechanics

---

## Notes

- Focus on data accuracy over feature completeness
- Prioritize reliable lookups over advanced calculations
- Keep scraper modular for easy updates
- Document UESP structure assumptions
- Maintain changelog of game updates
