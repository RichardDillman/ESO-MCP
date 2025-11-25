# ESO-MCP Documentation

Complete documentation for the Elder Scrolls Online MCP Server.

## 🚀 Getting Started

New to ESO-MCP? Start here:

1. **[Installation & Setup](../README.md#-quick-start)** - Get the server running
2. **[ESO Logs API Setup](setup-esologs-api.md)** - Configure parse analysis (optional)
3. **[Parse Analysis Guide](guide-parse-analysis.md)** - Analyze your combat parses

## 📖 User Guides

### Setup & Configuration
- **[ESO Logs API Setup](setup-esologs-api.md)** - Get API credentials for combat parse integration
- **[Parse Analysis Guide](guide-parse-analysis.md)** - How to use parse analysis features

### Feature Documentation
- **[Scribing System](reference-scribing.md)** - Validate scribed skill combinations (grimoires + scripts)
- **[Target Dummies](reference-target-dummies.md)** - Understand dummy-provided buffs vs self-provided

## 🛠️ Developer Guides

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute code, scrapers, or documentation
- **[Project Architecture](archive/dev-project-plan.md)** - System design and implementation phases

## 📚 Technical References

### Game Mechanics
- **[Damage Formulas](archive/reference-damage-formulas.md)** - ESO damage calculation math
- **[Stat Caps](archive/reference-stat-caps.md)** - Hard caps, soft caps, and diminishing returns
- **[CMX Parsing](archive/reference-cmx-parsing.md)** - Combat Metrics Extended integration

### API Documentation
All MCP tools are documented in the [main README](../README.md#-mcp-tools):
- Search tools (unified search, skills, sets, buffs, etc.)
- Parse analysis tools
- Scribing validation tools
- Target dummy tools

## 🔗 Quick Links

- [Main README](../README.md) - Project overview and quick start
- [GitHub Repository](https://github.com/RichardDillman/ESO-MCP)
- [UESP Wiki](https://en.uesp.net/wiki/Online) - Game data source

## 📂 Documentation Structure

```
docs/
├── README.md (you are here)
├── CONTRIBUTING.md
│
├── Setup Guides
│   └── setup-esologs-api.md
│
├── User Guides  
│   └── guide-parse-analysis.md
│
├── Reference Documentation
│   ├── reference-scribing.md
│   └── reference-target-dummies.md
│
└── archive/
    ├── dev-project-plan.md
    ├── reference-damage-formulas.md
    ├── reference-stat-caps.md
    └── reference-cmx-parsing.md
```

## 💡 Tips

- **For users**: Start with the setup guides, then explore feature documentation
- **For contributors**: Read the contributing guide and project architecture
- **For deep dives**: Check out the technical references in the archive folder

---

*Have questions? [Open an issue](https://github.com/RichardDillman/ESO-MCP/issues) on GitHub!*
