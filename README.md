# ESO MCP Server

MCP (Model Context Protocol) server for Elder Scrolls Online data, providing access to skills, sets, races, classes, and combat mechanics scraped from [UESP wiki](https://en.uesp.net/wiki/Online).

## Features

- **Skills Database**: All class, weapon, armor, guild, world, and alliance war skills
- **Gear Sets**: Complete database of craftable, dungeon, trial, arena, and mythic sets
- **Race Information**: Racial passives and bonuses for all playable races
- **Class Data**: Organized class skill lines and abilities
- **Combat Mechanics**: Target dummy buffs/debuffs and combat formulas
- **Fast Lookups**: Indexed database queries with Prisma ORM
- **Type-Safe**: Full TypeScript implementation with Prisma and Zod validation
- **SQLite Database**: Lightweight local database using Prisma with libSQL adapter

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd eso-mcp

# Install dependencies
pnpm install

# Generate Prisma client and run migrations
pnpm db:migrate

# Scrape initial data from UESP
pnpm update-data

# Build the project
pnpm build
```

## Usage

### Running the Server

```bash
# Development mode with auto-reload
pnpm dev

# Production mode
pnpm start
```

### Updating Data

Data should be updated manually on ESO release days:

```bash
pnpm update-data
```

This will scrape the latest information from UESP and update the local cache.

## MCP Resources

Access data via URI patterns:

```
eso://skills/{category}/{skillLine}/{skillName}
eso://sets/{setName}
eso://races/{raceName}
eso://classes/{className}/{skillLine}
eso://dummies/{dummyType}
eso://buffs/{buffName}
```

### Examples

```
eso://skills/class/dragonknight/ardent-flame/lava-whip
eso://skills/weapon/two-handed/cleave
eso://sets/relequens-whorl
eso://races/dunmer
eso://classes/sorcerer/daedric-summoning
eso://dummies/trial-dummy
```

## MCP Tools

Interactive queries available:

### `search_skills`
Find skills by criteria:
```typescript
{
  query?: string,
  skillLine?: string,
  type?: "active" | "passive" | "ultimate",
  resource?: "magicka" | "stamina" | "health"
}
```

### `search_sets`
Find gear sets:
```typescript
{
  query?: string,
  type?: "craftable" | "overland" | "dungeon" | "trial" | "arena" | "mythic",
  minPieces?: number,
  slot?: "light" | "medium" | "heavy" | "jewelry" | "weapon",
  bonusKeyword?: string
}
```

### `get_skill_details`
Get complete information about a specific skill:
```typescript
{ skillName: string }
```

### `get_set_details`
Get complete information about a specific set:
```typescript
{ setName: string }
```

### `get_race_info`
Get racial passives and bonuses:
```typescript
{ raceName: string }
```

### `get_class_info`
Get class skill lines and abilities:
```typescript
{
  className: string,
  skillLine?: string  // optional: filter by skill line
}
```

### `get_dummy_info`
Get target dummy buffs and debuffs:
```typescript
{ dummyType: string }  // "trial-dummy", "precursor", "skeleton"
```

## Project Structure

```
eso-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── lib/
│   │   └── prisma.ts         # Prisma client singleton
│   ├── types/                # TypeScript type definitions
│   │   ├── common.ts
│   │   ├── skill.ts
│   │   ├── set.ts
│   │   ├── race.ts
│   │   ├── class.ts
│   │   └── buff.ts
│   ├── scrapers/             # UESP wiki scrapers
│   │   ├── base.ts
│   │   ├── skills.ts
│   │   ├── sets.ts
│   │   ├── races.ts
│   │   └── dummies.ts
│   ├── storage/              # Data caching utilities
│   │   ├── cache.ts
│   │   └── loader.ts
│   ├── utils/                # Utilities
│   │   └── logger.ts
│   └── generated/
│       └── prisma/           # Generated Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── dev.db                # SQLite database file
├── scripts/
│   └── update-data.ts        # Data update script
└── tests/                    # Test files
```

## Data Models

### Skill
```typescript
{
  name: string;
  id: string;
  type: "active" | "passive" | "ultimate";
  skillLine: string;
  category: "class" | "weapon" | "armor" | "guild" | "world" | "alliance" | "crafting";
  cost?: { resource: string; amount: number };
  effects: Effect[];
  morphs?: Morph[];
  scaling?: ScalingInfo;
  description: string;
  source: string;
  lastUpdated: string;
}
```

### Set
```typescript
{
  name: string;
  id: string;
  type: "craftable" | "overland" | "dungeon" | "trial" | "arena" | "mythic";
  slots: Array<"light" | "medium" | "heavy" | "jewelry" | "weapon">;
  bonuses: {
    pieces: 1 | 2 | 3 | 4 | 5;
    stats?: Record<string, number>;
    effect?: string;
  }[];
  location?: string;
  tradeable: boolean;
  source: string;
  lastUpdated: string;
}
```

### Race
```typescript
{
  name: string;
  id: string;
  description: string;
  alliance?: string;
  passives: RacialPassive[];
  baseStats?: Record<string, number>;
  source: string;
  lastUpdated: string;
}
```

## Development

### Database Management

```bash
# Generate Prisma client
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

### Type Checking
```bash
pnpm type-check
```

### Linting
```bash
pnpm lint
```

### Formatting
```bash
pnpm format
```

### Testing
```bash
pnpm test
```

## Implementation Phases

- [x] **Phase 1**: Foundation - Basic MCP server with one skill line
- [ ] **Phase 2**: Skills Complete - All skills scraped and accessible
- [ ] **Phase 3**: Sets Implementation - Complete sets database
- [ ] **Phase 4**: Races & Classes - Character creation data
- [ ] **Phase 5**: Combat Mechanics - Target dummies and buff/debuff system
- [ ] **Phase 6**: Polish & Testing - Production-ready server

## Future Enhancements

- Build validation (checking for conflicts and synergies)
- Set optimizer (recommendations based on playstyle)
- Rotation suggestions (skill priorities and timing)

## Contributing

Data is sourced from [UESP](https://en.uesp.net/wiki/Online). Please verify any scraped information against the wiki and game client.

## Contact

- Email: rdillman@gmail.com
- Phone: (317) 586-2365 (US)

## License

MIT

## Acknowledgments

- UESP community for maintaining comprehensive ESO documentation
- Anthropic for the Model Context Protocol SDK
