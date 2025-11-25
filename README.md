# ESO-MCP

**Elder Scrolls Online MCP Server** - Comprehensive game data tools for skills, sets, buffs, parse analysis, build recommendations, and more.

[![GitHub](https://img.shields.io/badge/GitHub-ESO--MCP-blue)](https://github.com/RichardDillman/ESO-MCP)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🎮 What is ESO-MCP?

ESO-MCP is a [Model Context Protocol](https://modelcontextprotocol.io) server that provides AI assistants with deep access to Elder Scrolls Online game data. It combines web scraping, database storage, and intelligent tools to help players:

- 🔍 **Search** all ESO data (skills, sets, buffs, debuffs, races, classes, mundus stones)
- 📊 **Analyze** combat parses from ESO Logs
- ⚔️ **Optimize** builds and rotations for maximum DPS
- 🧙 **Validate** scribing combinations
- 🍖 **Recommend** consumables (food & potions)
- 📈 **Track** skill dependencies and passive buffs

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/RichardDillman/ESO-MCP.git
cd ESO-MCP
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your API credentials

# Initialize database
pnpm db:migrate

# Seed initial data
pnpm update-data

# Start the server
pnpm start
```

## 📦 Features

### 🔍 Unified Search
Search across ALL ESO data types without knowing which table contains the data:
- Skills (class, weapon, armor, guild, world, alliance)
- Gear Sets (craftable, dungeon, trial, arena, mythic)
- Buffs & Debuffs (Major/Minor with sources)
- Races (passives and bonuses)
- Classes (skill lines and abilities)
- Mundus Stones (bonuses and effects)
- Target Dummies (provided buffs/debuffs)

### 📊 Parse Analysis
Integrate with ESO Logs to analyze combat parses:
- DPS breakdown by ability
- Buff uptime tracking
- DoT coverage analysis
- Detect slotted passive skills
- Skill line passive detection
- Self-provided vs dummy-provided buffs
- Build recommendations

### ⚔️ Build Optimization
Smart recommendation engine that understands:
- Skill dependencies (weapon/class/race requirements)
- Passive cascades (changing weapon → lose/gain passives)
- Buff coverage (avoid redundant buffs)
- Consumable optimization (food & potions)

### 🧙 Scribing System
Complete validation for ESO's scribing system:
- 11 Grimoires (base skills)
- 11 Focus Scripts (primary effects)
- 22 Affix Scripts (secondary effects)
- 19 Signature Scripts (execution methods)
- Compatibility checking (class/weapon/armor restrictions)

### 🍖 Consumables Database
Raid-viable food and potions:
- Single-stat foods (max DPS)
- Bi-stat foods (balanced)
- Tri-stat foods (hybrid builds)
- Spell/Weapon Power potions
- Tri-Stat Restoration potions
- Heroism potions (ultimate generation)

## 🛠️ MCP Tools

### Core Search Tools
- `search_eso` - Universal search across all data types
- `get_eso_details` - Detailed information for any game element

### Specialized Tools
- `search_skills`, `get_skill_details` - Skill database
- `search_sets`, `get_set_details` - Gear sets
- `search_buffs`, `get_buff_details` - Buffs & debuffs
- `search_races`, `get_race_info` - Racial passives
- `search_classes`, `get_class_info` - Class abilities
- `search_mundus_stones`, `get_mundus_stone_details` - Mundus bonuses

### Target Dummy Tools
- `get_target_dummy_info` - Dummy-provided buffs/debuffs
- `list_target_dummies` - All available dummies

### Scribing Tools
- `validate_scribed_skill` - Check scribing compatibility
- `list_scribing_options` - Available grimoires/scripts
- `describe_scribed_skill` - Full scribed skill description

## 📚 Documentation

- [ESO Logs Integration Guide](docs/ESOLOGS-INTEGRATION.md) - Set up parse analysis
- [ESO Logs Setup](docs/ESOLOGS-SETUP-GUIDE.md) - API credentials
- [Scribing System](docs/SCRIBING-SYSTEM.md) - Scribing validation
- [Target Dummies](docs/TARGET-DUMMIES.md) - Dummy buff database
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute

## 🔧 Tech Stack

- **Runtime**: Node.js + TypeScript
- **Database**: Prisma ORM + SQLite
- **MCP**: Model Context Protocol server
- **APIs**: ESO Logs GraphQL, UESP web scraping
- **Integrations**: Telegram (InnerVoice), Vercel deployment

## 📊 Database Schema

```prisma
model Skill {
  id          String   @id
  name        String
  category    String
  skillLine   String
  type        String
  description String?
  cost        Json?
  effects     SkillEffect[]
  morphs      SkillMorph[]
  scaling     SkillScaling[]
}

model Set {
  id          String   @id
  name        String
  type        String
  slots       String[]
  bonuses     Json
  location    String?
  tradeable   Boolean
}

// + Buff, Debuff, Race, Class, MundusStone, TargetDummy
```

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for:
- Code style guidelines
- How to add new scrapers
- Testing requirements
- Pull request process

## 🙏 Acknowledgments

- [UESP](https://en.uesp.net/wiki/Online) - Comprehensive ESO documentation
- [ESO Logs](https://www.esologs.com/) - Combat parse hosting
- [Anthropic](https://anthropic.com) - Model Context Protocol
- ESO Community - Build guides and testing

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 📬 Contact

- **Author**: Richard Dillman
- **Email**: rdillman@gmail.com
- **GitHub**: [@RichardDillman](https://github.com/RichardDillman)

---

🤖 *Built with [Claude Code](https://claude.com/claude-code)*
